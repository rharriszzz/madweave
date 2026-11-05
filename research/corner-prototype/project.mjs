import {Diagram,id,number} from './kernel.mjs';

// Version 2 extends the trusted catalogue. Version 1 restores the original nine
// with exact certificates/identities, then resaves in v2 without ID renaming.
export const Project=(()=>{
  const format='madweave-corner-project',version=2;
  const defaults={rotation:23,outlines:false,seams:true,edges:false,annotations:false};
  const reject=(message,status='Invalid')=>{throw Object.assign(Error(message),{status});};
  const exactKeys=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join('|')!==[...keys].sort().join('|'))reject('Malformed project fields');};
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
  const stripKey=(model,index)=>model.certificate.components[index].pieces.map(id).sort()[0];
  const crossings=model=>model.certificate.crossings.map((event,index)=>({event,index})).filter(({event})=>{
    const [X,Y]=event.XY.map(number);return Y>1e-10&&X+(model.p.alpha===120?Y:-Y)>1e-10;
  });
  function capture(s,catalogue){
    const selected=s.selected===null?null:stripKey(s.model,s.selected);
    return {format,version,catalogue:catalogue.id,
      construction:{id:s.entry.id,digest:catalogue.digests[s.entry.id],parameters:structuredClone(s.model.p)},
      material:{pattern:s.model.pattern},view:{...s.view,center:[...s.model.center]},
      selection:{strip:selected,local:s.hits.length?{sector:s.anchor.sector,point:[...s.anchor.point],
        positions:s.hits.map(a=>a.position),active:s.hits[s.hitIndex].position,
        crossing:s.crossing===null?null:structuredClone(s.model.certificate.crossings[s.crossing])}:null}};
  }
  function parse(text){
    if(typeof text!=='string'||text.length>10*1024*1024)reject('Malformed or oversized project file');
    let json=text.trim();
    if(!json.startsWith('{')){
      // Extract inert data only. Never insert, execute or DOM-parse imported HTML.
      const matches=[...text.matchAll(/<script\b([^>]*\sid\s*=\s*["']corner-project["'][^>]*)>([\s\S]*?)<\/script\s*>/gi)];
      if(matches.length!==1||! /\stype\s*=\s*["']application\/json["']/i.test(matches[0][1]))reject(/<svg\b/i.test(text)?'SVG artwork is not an editable corner project':'Missing or duplicate editable project data');
      json=matches[0][2];
    }
    try{return JSON.parse(json);}catch(error){reject('Malformed project JSON');}
  }
  function restore(value,catalogue){
    if(!value||value.format!==format)reject('Not a supported corner project');
    if(![1,version].includes(value.version))reject('Unsupported corner-project version','Unvalidated');
    exactKeys(value,['format','version','catalogue','construction','material','view','selection']);
    const legacy=value.version===1;
    if(value.catalogue!==(legacy?'corner-nine-v1':catalogue.id))reject('Unsupported reference catalogue','Unvalidated');
    exactKeys(value.construction,['id','digest','parameters']);
    const entry=catalogue.examples.find(a=>a.id===value.construction.id);
    if(!entry)reject('Construction outside the supported finite catalogue','Unvalidated');
    if(legacy&&!catalogue.legacyIds.includes(entry.id))reject('Construction was not in the version-1 catalogue','Unvalidated');
    const certificate=catalogue.certificates[entry.id];
    if(value.construction.digest!==catalogue.digests[entry.id]||!same(value.construction.parameters,certificate.parameters))reject('Inconsistent certified construction parameters or digest');
    exactKeys(value.material,['pattern']);const pattern=value.material.pattern;
    if(pattern!==null&&(!Number.isInteger(pattern)||pattern<0||pattern>4))reject('Unsupported material coloring');
    exactKeys(value.view,['rotation','outlines','seams','edges','annotations','center']);
    if(![0,23,90,-137].includes(value.view.rotation)||!same(value.view.center,[1.25,-.75])||!['outlines','seams','edges','annotations'].every(k=>typeof value.view[k]==='boolean'))reject('Unsupported or malformed view settings');
    const model=new Diagram(certificate);model.pattern=pattern;model.rotation=value.view.rotation*Math.PI/180;
    const result=model.compatibility(pattern);if(result.status!=='Validated')reject(result.witness);
    const choices=crossings(model),view=Object.fromEntries(Object.keys(defaults).map(k=>[k,value.view[k]]));
    const next={model,entry,view,selected:null,hits:[],hitIndex:0,crossing:null,crossings:choices,anchor:null};
    exactKeys(value.selection,['strip','local']);const selection=value.selection;
    if(selection.strip!==null){
      next.selected=certificate.components.findIndex((_,i)=>stripKey(model,i)===selection.strip);
      if(next.selected<0)reject('Invalid joined-strip identity');
    }
    if(selection.local!==null){
      const local=selection.local;exactKeys(local,['sector','point','positions','active','crossing']);
      if(!Number.isInteger(local.sector)||local.sector<0||local.sector>=model.m||!Array.isArray(local.point)||local.point.length!==2||!local.point.every(Number.isFinite))reject('Invalid local reference coordinates');
      if(!Array.isArray(local.positions)||!local.positions.every(a=>typeof a==='string')||typeof local.active!=='string')reject('Malformed local position identities');
      const radius=Math.hypot(...local.point),angle=Math.atan2(local.point[1],local.point[0]);
      if(radius>model.R+1e-12||angle< -1e-12||angle>=model.alpha)reject('Local position outside the owned finite reference sector');
      // Reconstruct in reference coordinates, independently of display rotation
      // and rendered curves. Sector ownership is stored explicitly, half-open.
      const normals=[[0,1],[-Math.sqrt(3)/2,-.5],[Math.sqrt(3)/2,-.5]];
      const ids=certificate.pieces.filter(a=>a.id[0]===local.sector&&Math.abs(normals[a.id[1]][0]*local.point[0]+normals[a.id[1]][1]*local.point[1]-(a.id[2]-2.5))<=model.W/2+1e-12).map(a=>id(a.id));
      next.hits=model.ranked(ids).map(position=>({position,strip:model.owner.get(position)}));
      if(!next.hits.length||!same(local.positions,next.hits.map(a=>a.position))||new Set(local.positions).size!==local.positions.length)reject('Invalid local material positions or order');
      next.hitIndex=next.hits.findIndex(a=>a.position===local.active);
      if(next.hitIndex<0||next.selected!==next.hits[next.hitIndex].strip)reject('Inconsistent selected material position');
      next.anchor={sector:local.sector,point:[...local.point]};
      if(local.crossing!==null){
        const match=choices.find(a=>same(a.event,local.crossing));
        if(!match)reject('Invalid crossing identity');
        const [X,Y]=match.event.XY.map(number);
        if(match.event.pair[0][0]!==local.sector||Math.hypot(X/Math.sqrt(3)-local.point[0],Y-local.point[1])>1e-10)reject('Crossing and selected reference coordinates disagree');
        next.crossing=match.index;
      }
    }
    return next;
  }
  return {format,version,defaults,same,stripKey,crossings,capture,parse,restore};
})();
