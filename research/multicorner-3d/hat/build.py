#!/usr/bin/env python3
"""One-piece hat net; shared reference regions drive SVG and POV-Ray."""
import argparse, base64, json, math, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'research/output/multicorner-hat'
PRINT_MIN=-15
PRINT_MAX=35
PRINT_SPAN=PRINT_MAX-PRINT_MIN
PRINT_PIXELS=2500
def add(a,b):return [x+y for x,y in zip(a,b)]
def mul(a,k):return [x*k for x in a]
def sub(a,b):return add(a,mul(b,-1))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def length(a):return math.sqrt(dot(a,a))
def close(a,b):return length(sub(a,b))<1e-8
def vec(a):return '<'+','.join(f'{v:.12g}' for v in a)+'>'
def polygon_area(q):return abs(sum(p[0]*r[1]-p[1]*r[0] for p,r in zip(q,q[1:]+q[:1])))/2

def recipe(side_units=12,height=6,brim=4):
    if side_units<=0 or side_units%6 or height<=0 or height%6 or brim<=0:
        raise ValueError('This registered recipe requires side-units a positive multiple of 6, height a positive multiple of 6 pitches, and positive brim width.')
    L=side_units*math.sqrt(3);A=[[0,0],[L,0],[L/2,L*math.sqrt(3)/2]]
    t=[mul(sub(A[(i+1)%3],A[i]),1/L) for i in range(3)];o=[[u[1],-u[0]] for u in t]
    O=[add(A[i],add(mul(o[i],brim),mul(t[i],-math.sqrt(3)*brim))) for i in range(3)]
    panels=[dict(id='T',sheet='S0',ref=A,xyz=[p+[height] for p in A],vertices=['A0','A1','A2'])]
    for i in range(3):
        j=(i+1)%3;bottom=[add(A[i],mul(o[i],height)),add(A[j],mul(o[i],height))]
        panels.append(dict(id=f'W{i}',sheet='S0',ref=[A[i],A[j],bottom[1],bottom[0]],xyz=[A[i]+[height],A[j]+[height],A[j]+[0],A[i]+[0]],vertices=[f'A{i}',f'A{j}',f'B{j}',f'B{i}']))
        # Unfold each brim trapezoid outward from its wall's bottom. Keeping K
        # attached makes one sheet; the three radial brim seams D are taped.
        brim_ref=[add(q,mul(o[i],height)) for q in [A[i],O[i],O[j],A[j]]]
        panels.append(dict(id=f'R{i}',sheet='S0',ref=brim_ref,xyz=[A[i]+[0],O[i]+[0],O[j]+[0],A[j]+[0]],vertices=[f'B{i}',f'O{i}',f'O{j}',f'B{j}']))
    joins=[]
    for i in range(3):
        j=(i+1)%3;prev=(i-1)%3
        joins.extend([dict(id=f'F{i}',kind='fold',a=['T',i,j],b=[f'W{i}',0,1]),dict(id=f'J{i}',kind='tape',a=[f'W{prev}',1,2],b=[f'W{i}',0,3]),dict(id=f'K{i}',kind='fold',a=[f'W{i}',3,2],b=[f'R{i}',0,3]),dict(id=f'D{i}',kind='tape',a=[f'R{prev}',3,2],b=[f'R{i}',0,1])])
    corners=[dict(id=f'{kind}{i}',beta=beta) for kind,beta in [('A',240),('B',480)] for i in range(3)]
    return dict(recipe='triangular-hat',pitch=1,width=.75,side=L,height=height,brim=brim,panels=panels,joins=joins,corners=corners,outer=O)

def flat_net_check(model):
    """Verify physical paper connectivity, non-overlap and one cutting loop."""
    panels={p['id']:p for p in model['panels']}
    def cross(a,b):return a[0]*b[1]-a[1]*b[0]
    def intersection(poly,clip):
        signed=sum(cross(a,b) for a,b in zip(clip,clip[1:]+clip[:1]))
        if signed<0:clip=list(reversed(clip))
        for a,b in zip(clip,clip[1:]+clip[:1]):
            out=[]
            for p,q in zip(poly,poly[1:]+poly[:1]):
                dp=cross(sub(b,a),sub(p,a));dq=cross(sub(b,a),sub(q,a))
                if dp>=-1e-10:out.append(p)
                if (dp>1e-10 and dq< -1e-10) or (dp< -1e-10 and dq>1e-10):out.append(add(p,mul(sub(q,p),dp/(dp-dq))))
            poly=out
            if not poly:break
        return poly
    values=list(panels.values())
    for i,p in enumerate(values):
        for q in values[i+1:]:
            poly=intersection(p['ref'],q['ref'])
            if len(poly)>=3 and polygon_area(poly)>1e-8:raise ValueError('Overlapping net panels '+p['id']+'/'+q['id'])
    adjacent={name:set() for name in panels};retained=set()
    for join in model['joins']:
        if join['kind'] not in ('fold','subdivision'):continue
        a,i,j=join['a'];b,k,l=join['b']
        if panels[a]['sheet']!=panels[b]['sheet'] or not close(panels[a]['ref'][i],panels[b]['ref'][k]) or not close(panels[a]['ref'][j],panels[b]['ref'][l]):raise ValueError('Misplaced retained edge '+join['id'])
        adjacent[a].add(b);adjacent[b].add(a)
        for name,v,w in [(a,i,j),(b,k,l)]:retained.add((name,tuple(sorted((v,w)))))
    def components(graph):
        rest=set(graph);count=0
        while rest:
            count+=1;todo=[rest.pop()]
            while todo:
                for q in graph[todo.pop()]&rest:rest.remove(q);todo.append(q)
        return count
    count=components(adjacent)
    if count!=1:raise ValueError(f'Expected one connected paper component, got {count}')
    point=lambda q:tuple(round(x,8) for x in q)
    boundary={};segments=0
    for p in values:
        for i,a in enumerate(p['ref']):
            j=(i+1)%len(p['ref'])
            if (p['id'],tuple(sorted((i,j)))) in retained:continue
            a,b=point(a),point(p['ref'][j]);boundary.setdefault(a,set()).add(b);boundary.setdefault(b,set()).add(a);segments+=1
    if any(len(v)!=2 for v in boundary.values()) or sum(map(len,boundary.values()))!=2*segments:raise ValueError('Cut boundary is not a simple cycle')
    loops=components(boundary)
    if loops!=1:raise ValueError(f'Expected one cut boundary without holes, got {loops}')
    return dict(paper_components=count,cut_boundary_loops=loops,cut_boundary_segments=segments,net_overlaps=0)

def check(model):
    panels={p['id']:p for p in model['panels']};checks=0
    for p in panels.values():
        if polygon_area(p['ref'])<=0:raise ValueError('Empty panel '+p['id'])
        for i,a in enumerate(p['ref']):
            for j,b in enumerate(p['ref']):
                if abs(length(sub(a,b))-length(sub(p['xyz'][i],p['xyz'][j])))>1e-8:raise ValueError('Stretch '+p['id'])
                checks+=1
    for join in model['joins']:
        a,i,j=join['a'];b,k,l=join['b'];a=panels[a];b=panels[b]
        if not close(a['xyz'][i],b['xyz'][k]) or not close(a['xyz'][j],b['xyz'][l]):raise ValueError('Unclosed '+join['id'])
        if abs(length(sub(a['ref'][i],a['ref'][j]))-length(sub(b['ref'][k],b['ref'][l])))>1e-8:raise ValueError('Length mismatch '+join['id'])
    for c in model['corners']:
        angle=0
        for p in panels.values():
            for i,name in enumerate(p['vertices']):
                if name==c['id']:
                    q=p['ref'];u=sub(q[i-1],q[i]);v=sub(q[(i+1)%len(q)],q[i]);angle+=math.degrees(math.acos(max(-1,min(1,dot(u,v)/length(u)/length(v)))))
        if abs(angle-c['beta'])>1e-7:raise ValueError('Corner angle '+c['id'])
    brim_area=sum(polygon_area(p['ref']) for p in panels.values() if p['id'].startswith('R'))
    if abs(brim_area-(polygon_area(model['outer'])-polygon_area(panels['T']['ref'])))>1e-8:raise ValueError('Brim coverage')
    edges={};faces=0;vertices=set()
    for p in panels.values():
        names=p['vertices'];vertices.update(names)
        for j in range(1,len(names)-1):
            tri=[names[0],names[j],names[j+1]]
            if p['id'].startswith('W'):tri.reverse()
            faces+=1
            for a,b in zip(tri,tri[1:]+tri[:1]):edges.setdefault(tuple(sorted((a,b))),[]).append((a,b))
    for pair,uses in edges.items():
        if len(uses)==1:
            if not all(v.startswith('O') for v in pair):raise ValueError('Unexpected open edge '+str(pair))
        elif len(uses)!=2 or uses[0]!=tuple(reversed(uses[1])):raise ValueError('Nonmanifold or reversed edge '+str(pair))
    if len(vertices)-len(edges)+faces!=1:raise ValueError('Expected a disk surface')
    return dict(panel_distance_checks=checks,matched_edges=len(model['joins']),corners=model['corners'],brim_area=brim_area,vertices=len(vertices),triangles=faces,edges=len(edges),euler_characteristic=1,**flat_net_check(model))

def net(model,png):
    # Mathematical y points upward; flip the entire paper group, including print.
    points=[p for panel in model['panels'] for p in panel['ref']]
    left=min(p[0] for p in points)-3;right=max(p[0] for p in points)+3
    lo=min(p[1] for p in points)-3;hi=max(p[1] for p in points)+3;width=right-left
    s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*6}mm" height="{(hi-lo)*6}mm" viewBox="{left} {-hi} {width} {hi-lo}"><rect x="{left}" y="{-hi}" width="{width}" height="{hi-lo}" fill="white"/>', '<defs>']
    for p in model['panels']:
        s.append(f'<clipPath id="{p["id"]}"><polygon points="'+ ' '.join(f'{x},{y}' for x,y in p['ref'])+'"/></clipPath>')
    encoded=base64.b64encode(png).decode()
    s += [f'<image id="print" x="{PRINT_MIN}" y="{PRINT_MIN}" width="{PRINT_SPAN}" height="{PRINT_SPAN}" href="data:image/png;base64,{encoded}"/>', '</defs>', '<g transform="scale(1,-1)">']
    for p in model['panels']:
        dx=0
        s.append(f'<g transform="translate({dx},0)"><use href="#print" clip-path="url(#{p["id"]})"/></g>')
    # One outer cutting cycle; retained F/K edges are drawn as dashed folds.
    seen=set()
    for p in model['panels']:
        dx=0
        for i,a in enumerate(p['ref']):
            b=p['ref'][(i+1)%len(p['ref'])];key=(p['sheet'],tuple(sorted((tuple(round(v,7) for v in a),tuple(round(v,7) for v in b)))))
            if key in seen:continue
            seen.add(key)
            matches=[j for j in model['joins'] for side in ['a','b'] if j[side][0]==p['id'] and {j[side][1],j[side][2]}=={i,(i+1)%len(p['ref'])}]
            j=matches[0] if matches else None
            if j and j['kind']=='subdivision':continue
            color='#b52118' if j and j['kind']=='fold' else '#222';dash=' stroke-dasharray=".5 .3"' if j and j['kind']=='fold' else ''
            s.append(f'<path d="M {a[0]+dx},{a[1]} L {b[0]+dx},{b[1]}" fill="none" stroke="{color}" stroke-width=".08"{dash}/>')
            if j:
                x=(a[0]+b[0])/2+dx;y=(a[1]+b[1])/2
                s.append(f'<text transform="translate({x},{y}) scale(1,-1)" font-size=".9" text-anchor="middle" stroke="white" stroke-width=".25" paint-order="stroke" font-family="sans-serif">{j["id"]}</text>')
        x=sum(v[0] for v in p['ref'])/len(p['ref'])+dx;y=sum(v[1] for v in p['ref'])/len(p['ref'])
        s.append(f'<text transform="translate({x},{y}) scale(1,-1)" font-size="1.2" text-anchor="middle" stroke="white" stroke-width=".3" paint-order="stroke" font-family="sans-serif">{p["id"]}</text>')
        for name,q in zip(p['vertices'],p['ref']):
            if name.startswith('O'):continue
            s.append(f'<circle cx="{q[0]+dx}" cy="{q[1]}" r=".18" fill="#c21b17"/><text transform="translate({q[0]+dx+.3},{q[1]+.4}) scale(1,-1)" font-size=".75" stroke="white" stroke-width=".2" paint-order="stroke" font-family="sans-serif">{name}</text>')
    s+=['</g></svg>'];return ''.join(s)

def scene(model):
    s=['#version 3.7;', 'global_settings { assumed_gamma 1.0 }', 'background { color rgb <1,1,1> }', '#ifndef(View) #declare View=0; #end', '#ifndef(Plain) #declare Plain=0; #end', '#declare Paper=texture { uv_mapping pigment { image_map { png "pattern.png" gamma 2.2 interpolate 2 once } } finish { ambient .18 diffuse .82 } };']
    L=model['side'];H=model['height'];target=[L/2,L*math.sqrt(3)/6,H*.35];span=L+2*math.sqrt(3)*model['brim'];d=span*1.6
    cameras=[add(target,[d*.7,-d,d*.7]),add(target,[0,0,d]),add(target,[0,-d,0]),add(target,[d*.5,-d,-d*.7]),add(target,[-d,-d*.6,d*.5])]
    for i,pos in enumerate(cameras):
        sky=[0,1,0] if i==1 else [0,0,1]
        s.append(f'#if(View={i}) #declare Eye={vec(pos)}; #declare Aim={vec(target)}; #declare Sky={vec(sky)}; camera {{ orthographic location {vec(pos)} look_at {vec(target)} sky {vec(sky)} right x*{span*1.35} up y*{span*1.35} }} #end')
    s += [f'light_source {{ {vec(add(target,[-30,-40,70]))} color rgb .65 }}', f'light_source {{ {vec(add(target,[40,20,30]))} color rgb .25 }}',f'light_source {{ {vec(add(target,[0,0,-50]))} color rgb .3 }}']
    colors=[[.7,.83,.71],[.65,.77,.88],[.84,.74,.88],[.9,.82,.65]]
    for p in model['panels']:
        q=p['ref'];xyz=p['xyz'];uv=[[(x-PRINT_MIN)/PRINT_SPAN,1-(y-PRINT_MIN)/PRINT_SPAN] for x,y in q];tri=[[0,j,j+1] for j in range(1,len(q)-1)]
        if p['id'].startswith('W'):tri=[list(reversed(f)) for f in tri]
        s.append('// '+p['id']+' on '+p['sheet'])
        s.append('mesh2 { vertex_vectors { '+str(len(q))+', '+','.join(map(vec,xyz))+' } uv_vectors { '+str(len(q))+', '+','.join(map(vec,uv))+' } face_indices { '+str(len(tri))+', '+','.join(map(vec,tri))+' }')
        c=colors[0 if p['id']=='T' else 1+int(p['id'][1])%3]
        s.append(f'#if(Plain) texture {{ pigment {{ color rgb {vec(c)} }} finish {{ ambient .2 diffuse .8 }} }} #else texture {{ Paper }} #end double_illuminate }}')
    s += ['#if(Plain)', '#declare Forward=vnormalize(Aim-Eye); #declare Right=vnormalize(vcross(Sky,Forward)); #declare Up=vnormalize(vcross(Forward,Right));', '#macro Label(Name,Position) text { ttf "timrom.ttf" Name .01,0 pigment { color rgb <.08,.08,.08> } finish { ambient 1 diffuse 0 } scale .9 matrix <Right.x,Right.y,Right.z, Up.x,Up.y,Up.z, -Forward.x,-Forward.y,-Forward.z, 0,0,0> translate Position-Forward*.3 no_shadow } #end']
    labeled={}
    for p in model['panels']:
        center=[sum(q[d] for q in p['xyz'])/len(p['xyz']) for d in range(3)]
        s.append(f'Label("{p["id"]}",{vec(center)})')
        for name,q in zip(p['vertices'],p['xyz']):labeled[name]=q
    for name,q in labeled.items():s.append(f'Label("{name}",{vec(q)})')
    s.append('#end')
    return '\n'.join(s)+'\n'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--render',action='store_true');ap.add_argument('--povray',default='/usr/bin/povray');ap.add_argument('--size',type=int,default=1000);ap.add_argument('--side-units',type=int,default=12);ap.add_argument('--height',type=int,default=6);ap.add_argument('--brim',type=float,default=4);args=ap.parse_args()
    model=recipe(args.side_units,args.height,args.brim);report=check(model)
    model['pattern']={'source':'madweave.js','C':0,'hand':False,'alternate':False,'formula':'class','palette':['#83b8ca','#a9cda0','#8c9abd'],'opacity':[1,1,1],'bounds':[PRINT_MIN,PRINT_MIN,PRINT_MAX,PRINT_MAX],'image':'pattern.png','image_size':[PRINT_PIXELS,PRINT_PIXELS],'signed_index_offset':2.5,'reference_units':'pitch'}
    # Current source artwork covers a finite declared domain; never silently sample outside it.
    if any(not(PRINT_MIN<=x<=PRINT_MAX and PRINT_MIN<=y<=PRINT_MAX) for p in model['panels'] for x,y in p['ref']):raise ValueError('Recipe exceeds captured print bounds; enlarge the reference capture first.')
    OUT.mkdir(parents=True,exist_ok=True);png=(OUT/'pattern.png').read_bytes()
    (OUT/'construction.json').write_text(json.dumps(model,indent=2)+'\n');(OUT/'checks.json').write_text(json.dumps(report,indent=2)+'\n');(OUT/'net.svg').write_text(net(model,png));(OUT/'hat.pov').write_text(scene(model))
    names=['three-quarter','top','side','underside','reverse']
    if args.render:
        for i,name in enumerate(names+['plain']):
            cmd=[args.povray,'+Ihat.pov',f'+O{name}.png',f'+W{args.size}',f'+H{args.size}','-D','+A0.15','+AM2','+R2',f'Declare=View={i if i<5 else 0}',f'Declare=Plain={int(i==5)}']
            with (OUT/(name+'.log')).open('w') as log:subprocess.run(cmd,cwd=OUT,stdout=log,stderr=subprocess.STDOUT,check=True)
            print('Rendered',name,flush=True)
    html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MadWeave paper hat</title><style>body{font:18px system-ui;margin:2rem auto;max-width:1100px;padding:0 1rem;color:#222}img{width:100%;height:auto;border:1px solid #ccc}nav{display:flex;gap:1rem;flex-wrap:wrap}a{color:#145b6c}figure{margin:2rem 0}code{font-size:.85em}</style><h1>MadWeave paper hat</h1><p>One connected paper piece, six corners. Its net has one outer cutting loop and no enclosed holes. The net and POV-Ray views use the same reference regions and joins. This is an alternative to Richard's original four-piece hat: one central piece and one added piece per outer corner. The individual strips are printed artwork, not raised ribbons.</p><nav><a href="#net">Paper net</a>'''
    html+=''.join(f'<a href="#{n}">{n.replace("-"," ").title()}</a>' for n in names+['plain'])+'</nav><figure id="net"><img src="net.svg" alt="One connected patterned paper net with labeled cuts, folds and taped edge pairs"><figcaption>Follow the single solid outside outline to cut out the net. Dashed red F and K edges stay attached and are folded. Tape matching J wall edges and D brim edges. One continuous cutting path takes multiple scissors snips; a single straight snip is not claimed. At 100% SVG print scale one pitch is 6 mm; the complete layout is larger than A4.</figcaption></figure>'
    for n in names+['plain']:html+=f'<figure id="{n}"><img src="{n}.png" alt="POV-Ray {n} view of the paper hat"><figcaption>{n.replace("-"," ").title()}</figcaption></figure>'
    html+='<p>Ideal zero-thickness surface, printed on both sides in this preview. No fabrication or ribbon-clearance claim. <a href="construction.json">Construction record</a> · <a href="hat.pov">POV-Ray scene</a> · <a href="checks.json">Geometry checks</a></p></html>'
    (OUT/'index.html').write_text(html);print(json.dumps(report));print(OUT/'index.html')
if __name__=='__main__':main()
