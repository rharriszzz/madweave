/* Adapter for the existing SVG palette and painting controls. No second editor. */
(function(){
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const style='[role=button]:focus{outline:none;opacity:1;fill:none;stroke:#b04d3e;stroke-width:2.5px;vector-effect:non-scaling-stroke}.selection{fill:none;stroke:#c74900;stroke-width:.045;pointer-events:none}.outline{fill:none;stroke:#263d3b;stroke-width:.008;stroke-dasharray:.05 .035;pointer-events:none}.seam{stroke:#584a76;stroke-width:.009;stroke-dasharray:.08 .06;pointer-events:none}.partner{stroke:#c74900;stroke-width:.035;pointer-events:none}';
 class CornerEditor{
  constructor(frame,core,value,callbacks){
   this.frame=frame;this.w=frame.contentWindow;this.doc=frame.contentDocument;this.core=core;this.callbacks=callbacks;this.state=core.CornerProject.restore(value,core.catalogue);
   this.root=this.doc.getElementById('svg');this.doc.getElementById('tools')?.remove();this.doc.getElementById('pattern')?.remove();
   this.host=this.doc.createElementNS(NS,'svg');this.host.id='diagram';this.host.setAttribute('tabindex','0');this.host.setAttribute('aria-label','Corner diagram, click material to paint a joined strip');this.doc.getElementById('strips').replaceChildren(this.host);
   this.root.append(this.doc.createElementNS(NS,'style'));this.root.lastChild.textContent=style;
   this.original={};const w=this.w;
   for(const name of ['getPointForEvent','buildButtons','setDefaultColor','setColorFromLast','setOpacity','setHue','setSat','setValue'])this.original[name]=w[name];
   // Keep native mouse handlers, with bounded slider coordinates. Synthetic
   // keyboard events otherwise lose subpixel precision at opacity 0/1 in Firefox.
   w.getPointForEvent=event=>{const p=this.original.getPointForEvent(event);if(p&&/^cbutton(?:OB|HB|SB|VB)$/.test(event.target.id)){p.x=Math.max(0,Math.min(1,p.x));if(p.x<1e-7)p.x=0;if(p.x>1-1e-7)p.x=1;}return p;};
   w.buildStrips=()=>{};
   for(const name of ['setDefaultColor','setColorFromLast','setOpacity','setHue','setSat','setValue'])w[name]=(...args)=>this.paletteAction(name,args);
   w.changeColorPattern=(_,pattern)=>this.callbacks.formula(pattern);
   w.changeColorCount=(_,count)=>{if(count===1)this.callbacks.formula(null);else if(count===3)this.callbacks.formula(this.state.value.material.pattern??0);else this.unavailable('Only monochrome and the five three-label formulas are certified.');};
   w.toggleVisibilityH=(_,member)=>this.callbacks.weave(member);
   for(const name of ['setContent','setSeparation','changeHand','changeTop','changeCenter','toggleVisibilityD','setVisibleOrHidden'])w[name]=()=>this.unavailable('Use a certified corner phase/crop. Planar size, spacing, order and material visibility controls are unavailable here.');
   w.showOrHideLines=()=>this.edit('Outlines',v=>{v.view.edges=!v.view.edges;});
   w.showOrHideButtons=()=>this.edit('Controls',v=>{v.controlsHidden=!v.controlsHidden;});
   this.syncPalette();this.layout();this.commit(this.state,this.draw(this.state));
   // Observe now, write on the next frame: changing iframe height inside a
   // ResizeObserver delivery causes WebKit's undelivered-notification error.
   this.observer=new ResizeObserver(()=>{if(this.resizeFrame)return;this.resizeFrame=requestAnimationFrame(()=>{this.resizeFrame=null;if(frame.isConnected&&!frame.hidden&&Math.abs(frame.clientWidth-(this.width||0))>1){try{this.layout();this.commit(this.state,this.draw(this.state),false);}catch(e){this.callbacks.error('Resize',e);}}});});this.observer.observe(frame);
  }
  capture(){return this.core.CornerProject.capture(this.state,this.core.catalogue);}
  unavailable(message){this.callbacks.intent();this.callbacks.error('Control',Error(message));return false;}
  draw(s,annotations=true,exporting=false){
   const drawing=this.core.createRenderer(this.host,s.value.palette,()=>'',{opacity:s.value.opacity})(s,exporting?1024/(2*(s.model.R+.3)):null);
   const css=this.doc.createElementNS(NS,'style');css.textContent=style;drawing.root.prepend(css);
   if(annotations)for(const e of s.conflicts){
    const radius=(this.core.number(e.interval[0])/Math.sqrt(3)+(Array.isArray(e.interval[1])?s.model.R:this.core.number(e.interval[1])/Math.sqrt(3)))/2;
    const angle=s.model.rotation+e.right[0]*2*Math.PI/s.model.m;
    const marker=this.doc.createElementNS(NS,'circle');for(const [k,v]of Object.entries({cx:s.model.center[0]+radius*Math.cos(angle),cy:s.model.center[1]+radius*Math.sin(angle),r:.08,fill:'#ff00be',stroke:'#3a003c','stroke-width':.025,tabindex:0,'data-seam-warning':'true','aria-label':`Color change at seam ${e.left.join(':')} to ${e.right.join(':')}`}))marker.setAttribute(k,v);
    const title=this.doc.createElementNS(NS,'title');title.textContent=marker.getAttribute('aria-label');marker.append(title);drawing.root.append(marker);
    marker.setAttribute('role','img');marker.style.cursor='help';marker.onmousemove=e=>e.stopPropagation();marker.onmousedown=e=>e.stopPropagation();
   }
   return drawing;
  }
  commit(s,drawing,notify=true){
   this.state=s;s.value=this.core.CornerProject.capture(s,this.core.catalogue);
   this.host.setAttribute('viewBox',drawing.viewBox);this.host.replaceChildren(...drawing.root.childNodes);this.syncPalette();this.layout();this.hookPointer();
   if(notify)this.callbacks.change(this);
  }
  edit(operation,update){
   this.callbacks.intent();
   try{const v=this.capture();update(v);const next=this.core.CornerProject.restore(v,this.core.catalogue);this.commit(next,this.draw(next));return true;}
   catch(e){this.callbacks.error(operation,e);return false;}
  }
  replace(value){const next=this.core.CornerProject.restore(value,this.core.catalogue),drawing=this.draw(next);this.commit(next,drawing);}
  paletteAction(name,args){
   this.callbacks.intent();const old=this.root.cloneNode(true),w=this.w;
   const hsv=[w.currentHue,w.currentSat,w.currentValue,w.currentOpacity];
   try{
    this.original[name].apply(w,args);const v=this.capture();v.palette=Array.from(w.colorArray);v.opacity=Array.from(w.opacityArray,Number);v.recent=Array.from(w.lastColor);v.recentOpacity=Array.from(w.lastOpacity,Number);v.selectedColor=Number(w.defaultColorIndex);
    const next=this.core.CornerProject.restore(v,this.core.catalogue),drawing=this.draw(next);this.commit(next,drawing);return true;
   }catch(e){
    this.root.replaceChildren(...old.childNodes);this.host=this.doc.getElementById('diagram');this.setGlobals(this.state);[w.currentHue,w.currentSat,w.currentValue,w.currentOpacity]=hsv;this.layout();this.hookPointer();this.callbacks.error('Palette edit',e);return false;
   }
  }
  setGlobals(s){const w=this.w,v=s.value;w.colorArray=[...v.palette];w.opacityArray=[...v.opacity];w.lastColor=[...v.recent];w.lastOpacity=[...v.recentOpacity];w.defaultColorIndex=v.selectedColor;w.colorPattern=v.material.pattern??0;w.colorCount=v.material.pattern===null?1:3;w.showingLines=s.view.edges;w.hideStrips=w.showStrips=false;w.hidingButtons=false;w.showC=[0,1,2].map(x=>s.model.p.member===null||s.model.p.member===x);}
  syncPalette(){
   this.setGlobals(this.state);this.original.buildButtons.call(this.w,this.doc);
   if(Object.keys(this.state.value.material.overrides).length)for(const id of ['CP'+this.w.colorPattern,'CC'+this.w.colorCount])this.doc.getElementById('button'+id).setAttribute('stroke-width',this.w.buttonRectSize*this.w.buttonStrokeWidth);
  }
  layout(){
   this.width=this.frame.clientWidth;
   const w=this.w;
   // Use the original SVG coordinates for every shared control.
   const enabled=new Set([
    ...Array.from({length:8},(_,i)=>'C'+i),
    ...Array.from({length:4},(_,i)=>'LAST'+i),
    ...Array.from({length:5},(_,i)=>'CP'+i),
    'CC1','CC3','VH0','VH1','VH2','Lines','HideButtons','OB','HB','SB','VB'
   ]);
   for(const g of this.doc.querySelectorAll('#buttons > g[id^="gbutton"]')){
    const name=g.id.slice(7),available=enabled.has(name);
    g.style.opacity=available?'':'0.3';
    g.setAttribute('visibility',this.state.value.controlsHidden&&name!=='HideButtons'?'hidden':'visible');
    const target=this.doc.getElementById('cbutton'+name);
    target.setAttribute('tabindex',available?'0':'-1');target.setAttribute('role','button');
    target.setAttribute('aria-disabled',String(!available));
    const text=this.doc.getElementById('doc'+name+'_1')?.textContent||name;
    const label=!available?'Unavailable in corner mode: '+text:name.startsWith('VH')?'Select hexweave class '+name.slice(2):text;
    target.setAttribute('aria-label',label);
    let title=g.querySelector('title');if(!title){title=this.doc.createElementNS(NS,'title');g.prepend(title);}title.textContent=label;
    target.onkeydown=e=>{
     const slider=['OB','HB','SB','VB'].includes(name);
     if(!available||!['Enter',' ','ArrowLeft','ArrowRight'].includes(e.key)||(!slider&&e.key.startsWith('Arrow')))return;
     e.preventDefault();let p;
     if(slider){
      const value=Number({OB:w.currentOpacity,HB:w.currentHue/360,SB:w.currentSat,VB:w.currentValue}[name]);
      const x=Math.max(0,Math.min(1,value+(e.key==='ArrowLeft'?-.02:e.key==='ArrowRight'?.02:0)));
      p=new w.DOMPoint(x,.5).matrixTransform(target.getScreenCTM());
     }else{const b=target.getBoundingClientRect();p={x:b.x+b.width/2,y:b.y+b.height/2};}
     const event=new w.MouseEvent('mousedown',{bubbles:true,clientX:p.x,clientY:p.y});
     Object.defineProperties(event,{clientX:{value:p.x},clientY:{value:p.y}});target.dispatchEvent(event);
    };
   }
   w.buildViewButtons(this.doc,'corner',this.state.entry.config.beta);
   this.doc.getElementById('viewButtons').setAttribute('visibility',this.state.value.controlsHidden?'hidden':'visible');
   this.root.style.cssText='display:block;width:100%;height:100vh';
   this.frame.style.height='';
   for(const [key,value]of Object.entries({x:-w.viewWidth*.32,y:-w.viewHeight*.35,width:w.viewWidth*.64,height:w.viewHeight*.70}))this.host.setAttribute(key,value);
   this.doc.getElementById('documentations').setAttribute('display','none');
  }
  point(event){return new this.w.DOMPoint(event.clientX,event.clientY).matrixTransform(this.host.querySelector('.material-cells').getScreenCTM().inverse());}
  select(point,paint=false){
   const v=this.capture(),s=this.core.CornerProject.restore(v,this.core.catalogue),hits=s.model.pick([point.x,point.y]);
   const prior=s.hits[s.hitIndex]?.position;s.hits=hits;s.hitIndex=Math.max(0,hits.findIndex(h=>h.position===prior));s.selected=hits[s.hitIndex]?.strip??null;s.crossing=null;
   const inverse=s.model.inverse([point.x,point.y]);s.anchor=hits.length?{sector:inverse.j,point:inverse.local}:null;
   const next=paint&&s.selected!==null?this.core.CornerProject.paint(s,v.selectedColor,this.core.catalogue):s;
   this.commit(next,this.draw(next));
  }
  hookPointer(){
   for(const marker of this.host.querySelectorAll('[data-seam-warning]')){marker.onmousemove=e=>e.stopPropagation();marker.onmousedown=e=>e.stopPropagation();}
   this.host.onmousemove=e=>{const p=this.point(e),hits=this.state.model.pick([p.x,p.y]);if(hits.map(h=>h.position).join('|')!==this.state.hits.map(h=>h.position).join('|')){this.callbacks.intent();try{this.select(p);}catch(error){this.callbacks.error('Selection',error);}}};
   this.host.onmousedown=e=>{this.callbacks.intent();try{this.select(this.point(e),true);}catch(error){this.callbacks.error('Paint',error);}};
  }
  paintSelected(){return this.edit('Paint selected',v=>{const s=this.core.CornerProject.restore(v,this.core.catalogue);if(s.selected===null)throw Error('Select a strip first');v.material.overrides[s.keys[s.selected]]=v.selectedColor;});}
  inspectStrip(key){return this.edit('Inspect strip',v=>{v.selection={strip:key||null,local:null};});}
  inspectCrossing(index){
   this.callbacks.intent();try{const s=this.core.CornerProject.restore(this.capture(),this.core.catalogue),event=s.model.certificate.crossings[index],[X,Y]=event.XY.map(this.core.number),local=[X/Math.sqrt(3),Y],j=event.pair[0][0],p=s.model.map(local,j);s.hits=s.model.pick(p);s.hitIndex=0;s.selected=s.hits[0]?.strip??null;s.anchor={sector:j,point:local};s.crossing=Number(index);this.commit(s,this.draw(s));return true;}catch(e){this.callbacks.error('Crossing inspection',e);return false;}
  }
  next(){this.callbacks.intent();try{const s=this.core.CornerProject.restore(this.capture(),this.core.catalogue);if(s.hits.length){s.hitIndex=(s.hitIndex+1)%s.hits.length;s.selected=s.hits[s.hitIndex].strip;}this.commit(s,this.draw(s));return true;}catch(e){this.callbacks.error('Position inspection',e);return false;}}
  exportSVG(){
   const s=this.core.CornerProject.restore(this.capture(),this.core.catalogue),include=s.view.annotations;
   if(!include){s.view={...s.view,edges:false,outlines:false,seams:false};s.selected=null;}
   const drawing=this.draw(s,include,true),root=drawing.root,span=2*(s.model.R+.3),x=s.model.center[0]-span/2,y=s.model.center[1]-span/2;
   for(const [k,v]of Object.entries({width:1024,height:1101,viewBox:`${x} ${y} ${span} ${span*1.075}`}))root.setAttribute(k,v);
   const element=(tag,attrs,text)=>{const e=this.doc.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;root.append(e);return e;};
   const bg=element('rect',{x,y,width:span,height:span*1.075,fill:'white'});root.prepend(bg);
   element('title',{},'Corner diagram artwork; physical constructibility unverified');
   element('desc',{},`Not an editable project or fabrication template. Inspection annotations ${include?'included':'excluded'}. ${s.conflicts.length} seam color warnings.`);
   element('metadata',{id:'corner-artwork-info'},JSON.stringify({format:'madweave-corner-artwork',version:2,construction:s.value.construction,parameters:s.model.p,palette:s.value.palette,opacity:s.value.opacity,material:s.value.material,rotation:s.view.rotation,center:s.model.center,components:s.model.certificate.components,joins:s.model.certificate.joins,crossings:s.model.certificate.crossings,inspectionAnnotations:include,seamWarnings:s.conflicts.length,approximation:JSON.parse(drawing.certificate)}));
   ['Diagram artwork — physical constructibility unverified.',`Not editable or fabrication-ready. Inspection ${include?'included':'excluded'}; seam color warnings: ${s.conflicts.length}.`].forEach((text,i)=>element('text',{x:x+span*.02,y:y+span*(1.026+i*.025),'font-size':span/70,'font-family':'sans-serif',fill:'#203c3b'},text));
   return new XMLSerializer().serializeToString(root);
  }
 }
 window.MadWeaveCornerEditor=CornerEditor;
})();
