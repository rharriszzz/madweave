#!/usr/bin/env python3
"""Two-sheet hat recipe; shared reference regions drive SVG net and POV-Ray."""
import argparse, base64, json, math, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'research/output/multicorner-hat'
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
        panels.append(dict(id=f'R{i}',sheet='S1',ref=[A[i],O[i],O[j],A[j]],xyz=[A[i]+[0],O[i]+[0],O[j]+[0],A[j]+[0]],vertices=[f'B{i}',f'O{i}',f'O{j}',f'B{j}']))
    joins=[]
    for i in range(3):
        j=(i+1)%3;prev=(i-1)%3
        joins.extend([dict(id=f'F{i}',kind='fold',a=['T',i,j],b=[f'W{i}',0,1]),dict(id=f'J{i}',kind='tape',a=[f'W{prev}',1,2],b=[f'W{i}',0,3]),dict(id=f'K{i}',kind='tape',a=[f'W{i}',3,2],b=[f'R{i}',0,3]),dict(id=f'D{i}',kind='subdivision',a=[f'R{prev}',3,2],b=[f'R{i}',0,1])])
    corners=[dict(id=f'{kind}{i}',beta=beta) for kind,beta in [('A',240),('B',480)] for i in range(3)]
    return dict(recipe='triangular-hat',pitch=1,width=.75,side=L,height=height,brim=brim,panels=panels,joins=joins,corners=corners,outer=O)

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
    brim_area=sum(polygon_area(p['ref']) for p in panels.values() if p['sheet']=='S1')
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
    return dict(panel_distance_checks=checks,matched_edges=len(model['joins']),corners=model['corners'],brim_area=brim_area,vertices=len(vertices),triangles=faces,edges=len(edges),euler_characteristic=1)

def net(model,png):
    # Mathematical y points upward; flip the entire paper group, including print.
    L=model['side'];shift=L+22;points=[p for panel in model['panels'] for p in panel['ref']]
    lo=min(x[1] for x in points)-4;hi=max(x[1] for x in points)+4
    width=2*L+45
    s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*6}mm" height="{(hi-lo)*6}mm" viewBox="-12 {-hi} {width} {hi-lo}"><rect x="-12" y="{-hi}" width="{width}" height="{hi-lo}" fill="white"/>', '<defs>']
    for p in model['panels']:
        s.append(f'<clipPath id="{p["id"]}"><polygon points="'+ ' '.join(f'{x},{y}' for x,y in p['ref'])+'"/></clipPath>')
    encoded=base64.b64encode(png).decode()
    s += [f'<image id="print" x="-9" y="-9" width="40" height="40" href="data:image/png;base64,{encoded}"/>', '</defs>', '<g transform="scale(1,-1)">']
    for p in model['panels']:
        dx=0 if p['sheet']=='S0' else shift
        s.append(f'<g transform="translate({dx},0)"><use href="#print" clip-path="url(#{p["id"]})"/></g>')
    # Boundary segments by incidence, including retained folds; omit brim subdivisions.
    seen=set()
    for p in model['panels']:
        dx=0 if p['sheet']=='S0' else shift
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
        q=p['ref'];xyz=p['xyz'];uv=[[(x+9)/40,1-(y+9)/40] for x,y in q];tri=[[0,j,j+1] for j in range(1,len(q)-1)]
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
    model['pattern']={'source':'madweave.js','C':0,'hand':False,'alternate':False,'formula':'class','palette':['#83b8ca','#a9cda0','#8c9abd'],'opacity':[1,1,1],'bounds':[-9,-9,31,31],'image':'pattern.png','image_size':[2000,2000],'signed_index_offset':2.5,'reference_units':'pitch'}
    # Current source artwork covers a finite declared domain; never silently sample outside it.
    if any(not(-9<=x<=31 and -9<=y<=31) for p in model['panels'] for x,y in p['ref']):raise ValueError('Recipe exceeds captured print bounds; enlarge the reference capture first.')
    OUT.mkdir(parents=True,exist_ok=True);png=(OUT/'pattern.png').read_bytes()
    (OUT/'construction.json').write_text(json.dumps(model,indent=2)+'\n');(OUT/'checks.json').write_text(json.dumps(report,indent=2)+'\n');(OUT/'net.svg').write_text(net(model,png));(OUT/'hat.pov').write_text(scene(model))
    names=['three-quarter','top','side','underside','reverse']
    if args.render:
        for i,name in enumerate(names+['plain']):
            cmd=[args.povray,'+Ihat.pov',f'+O{name}.png',f'+W{args.size}',f'+H{args.size}','-D','+A0.15','+AM2','+R2',f'Declare=View={i if i<5 else 0}',f'Declare=Plain={int(i==5)}']
            with (OUT/(name+'.log')).open('w') as log:subprocess.run(cmd,cwd=OUT,stdout=log,stderr=subprocess.STDOUT,check=True)
            print('Rendered',name,flush=True)
    html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MadWeave paper hat</title><style>body{font:18px system-ui;margin:2rem auto;max-width:1100px;padding:0 1rem;color:#222}img{width:100%;height:auto;border:1px solid #ccc}nav{display:flex;gap:1rem;flex-wrap:wrap}a{color:#145b6c}figure{margin:2rem 0}code{font-size:.85em}</style><h1>MadWeave paper hat</h1><p>Two printed sheets, six corners. The net and POV-Ray views use the same reference regions and joins. This first model is paper carrying a weave print; the individual strips are not raised ribbons.</p><nav><a href="#net">Paper net</a>'''
    html+=''.join(f'<a href="#{n}">{n.replace("-"," ").title()}</a>' for n in names+['plain'])+'</nav><figure id="net"><img src="net.svg" alt="Two patterned sheets with labeled cuts, folds and taped edge pairs"><figcaption>Solid edges: cut. Dashed red: retained fold. Tape matching J and K labels. The repeated corner labels identify occurrences that meet after assembly. At 100% SVG print scale one pitch is 6 mm; the complete layout is larger than A4.</figcaption></figure>'
    for n in names+['plain']:html+=f'<figure id="{n}"><img src="{n}.png" alt="POV-Ray {n} view of the paper hat"><figcaption>{n.replace("-"," ").title()}</figcaption></figure>'
    html+='<p>Ideal zero-thickness surface, printed on both sides in this preview. No fabrication or ribbon-clearance claim. <a href="construction.json">Construction record</a> · <a href="hat.pov">POV-Ray scene</a> · <a href="checks.json">Geometry checks</a></p></html>'
    (OUT/'index.html').write_text(html);print(json.dumps(report));print(OUT/'index.html')
if __name__=='__main__':main()
