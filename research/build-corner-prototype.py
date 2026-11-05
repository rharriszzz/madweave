#!/usr/bin/env python3
"""Build Stage 2's finite catalogue; certify every input and construct test oracles."""
from pathlib import Path
from fractions import Fraction as F
from itertools import product
import copy
import json
import runpy

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'research/corner-prototype'
producer=runpy.run_path(str(ROOT/'research/corner-crop-reference.py'))
check=runpy.run_path(str(ROOT/'research/check-corner-certificate.py'))


def probe(poly,R):
    mean=tuple(sum(p[i] for p in poly)/len(poly) for i in range(2))
    if check['sq'](mean)<R*R:return mean
    candidates=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        v=tuple(b[i]-a[i] for i in range(2))
        t=max(F(0),min(F(1),-(a[0]*v[0]/3+a[1]*v[1])/check['sq'](v)))
        candidates.append(tuple(a[i]+t*v[i] for i in range(2)))
    near=min(candidates,key=check['sq'])
    for n in range(1,60):
        lam=F(1,2**n)
        p=tuple(near[i]+lam*(mean[i]-near[i]) for i in range(2))
        if check['sq'](p)<R*R:return p
    raise ValueError('No interior oracle point')


def main():
    base=dict(alpha=120,sectors=3,beta=360,f='1',k=[0,0,0],C=0,hand=0,X=0,
              member=None,W_over_P='3/4',R_over_P='3')
    specs=[('planar','Madweave · planar 360°',dict(base)),
           ('deficit','Madweave · deficit 240°',dict(base,sectors=2,beta=240,f='3/2')),
           ('excess','Madweave · excess 480° · radius-6 fringes',dict(base,sectors=4,beta=480,f='3/4',R_over_P='6')),
           ('sixty','Madweave · 300° · 60° increments',dict(base,alpha=60,sectors=5,beta=300,f='6/5',k=[0,2,-2])),
           ('c-on','Madweave · C on · 480°',dict(base,sectors=4,beta=480,f='3/4',C=1)),
           ('self','Madweave · 120° · self-crossings',dict(base,sectors=1,beta=120,f='3'))]
    for member,label in [(1,'large hexagon'),(0,'triangle −y'),(2,'triangle +y')]:
        alpha=60 if member==1 else 120
        specs.append((f'hex-{member}',f'Hexweave · {label} · 480°',dict(base,alpha=alpha,sectors=480//alpha,
                    beta=480,f='3/4',member=member,R_over_P='7')))
    registry=[];oracles={};partition_evidence=[]
    for key,label,p in specs:
        c=json.loads(json.dumps(producer['make'](p,key),default=producer['encode']))
        counts=check['validate'](c);patterns=[]
        for pattern in range(5):
            candidate=copy.deepcopy(c);candidate['pattern']=pattern
            for a in candidate['pieces']:
                j,d,s=a['id'];d,s=check['rotate'](d,s,j*(p['alpha']//60));z=s+p['k'][d]+p['C']*(3-d)
                a['color']=[d,z%3,d+z%3,z//3,z%3+z//3][pattern]%3
            try:check['validate'](candidate);valid=True;witness=None
            except ValueError as e:valid=False;witness=str(e)
            patterns.append(dict(pattern=pattern,valid=valid,witness=witness,
                                 distinct_colors=len({a['color'] for a in candidate['pieces']})))
        bands,orders,_,_=check['reference'](json.dumps(p,sort_keys=True));R=F(p['R_over_P']);w=F(p['W_over_P'])
        # Partition the full wedge exactly. Never discard a small positive region
        # merely because a floating area/centerline test would miss it.
        g=producer['g'];cells=[[(-2*R,-R),(2*R,-R),(2*R,R),(-2*R,R)]]
        for normal,bound in g['wedge'](p['alpha']):cells=[g['clip'](cell,normal,bound) for cell in cells]
        cuts={(check['N'][d],F(s)-F(5,2)+sign*w/2) for d,s in bands for sign in (-1,1)}
        for normal,bound in sorted(cuts):
            children=[]
            for cell in cells:
                for n,b in [(normal,bound),(tuple(-x for x in normal),-bound)]:
                    part=g['clip'](cell,n,b)
                    if len(part)>=3 and g['area2'](part)>0:children.append(part)
            cells=children
        render_cells=[];outside_cells=[]
        for cell in cells:
            mean=tuple(sum(a[i] for a in cell)/len(cell) for i in range(2))
            members=[a for a in bands if abs(check['dot'](check['N'][a[0]],mean)-(F(a[1])-F(5,2)))<w/2]
            if members:
                (render_cells if check['inside'](cell,R) else outside_cells).append(dict(vertices=cell,members=members))
        assert {tuple(a) for cell in render_cells for a in cell['members']}==set(bands)
        c['render_cells']=render_cells
        c['render_outside_cells']=outside_cells
        c=json.loads(json.dumps(c,default=producer['encode']))
        check['validate'](c)
        partition_evidence.append(dict(id=key,render_cells=len(render_cells),outside_cells=len(outside_cells),counts=counts))
        (DEST/'certificates'/f'{key}.json').write_text(json.dumps(c,separators=(',',':'))+'\n')
        registry.append(dict(id=key,label=label,url=f'certificates/{key}.json',counts=counts,patterns=patterns,
                             default_pattern=3 if p['member'] is not None else 1 if key=='excess' else None))
        points={probe(poly,R) for poly in bands.values()}
        for a,b in orders:points.add(probe(check['region']([a,b],p['alpha'],R,w),R))
        for x,y in product(range(-12,13),repeat=2):
            z=(F(x)*R/7,F(y)*R/12)
            if z[1]>0 and z[0]+(z[1] if p['alpha']==120 else -z[1])>0:points.add(z)
        rows=[];owner={tuple(a):i for i,g in enumerate(c['components']) for a in g['pieces']}
        for z in sorted(points):
            if z[1]<=F(1,100000) or z[0]+(z[1] if p['alpha']==120 else -z[1])<=F(1,100000):continue
            occupied=[a for a in bands if check['sq'](z)<R*R and abs(check['dot'](check['N'][a[0]],z)-(F(a[1])-F(5,2)))<w/2]
            margin=min([abs(float(check['dot'](check['N'][d],z)-(F(s)-F(5,2))+sign*w/2))
                        for d,s in bands for sign in (-1,1)]+[abs(float(check['sq'](z))-float(R*R))/(2*float(R))])
            if margin<.002:continue
            ranked=sorted(occupied,key=lambda a:-sum(check['precedence'](a,b,p) for b in occupied if a!=b))
            for j in range(p['sectors']):
                ids=[[j,*a] for a in ranked]
                rows.append(dict(XY=[float(x) for x in z],sector=j,positions=ids,
                                 strips=[owner[tuple(a)] for a in ids]))
        oracles[key]=rows
        assert {tuple(a) for row in rows for a in row['positions']}=={tuple(a['id']) for a in c['pieces']},'Oracle missed a material occurrence'
        print(key,counts,'oracle probes',len(rows),flush=True)
    (DEST/'examples.json').write_text(json.dumps(registry,indent=2)+'\n')
    (ROOT/'research/evidence/corner-prototype-oracles.json').write_text(json.dumps(oracles,separators=(',',':'))+'\n')
    sample=json.loads((DEST/'certificates/excess.json').read_text());mutations=[]
    for name,kind in [('missing-cell',0),('duplicated-cell',1),('wrong-members',2),('false-outside',3)]:
        candidate=copy.deepcopy(sample)
        if kind==0:candidate['render_cells'].pop()
        if kind==1:candidate['render_cells'].append(copy.deepcopy(candidate['render_cells'][0]))
        if kind==2:candidate['render_cells'][0]['members']=[]
        if kind==3:candidate['render_outside_cells'].append(candidate['render_cells'].pop())
        try:check['validate'](candidate)
        except ValueError as e:mutations.append(dict(mutation=name,status='Invalid',witness=str(e)))
        else:raise AssertionError('Partition mutation accepted')
    (ROOT/'research/evidence/corner-prototype-reference.json').write_text(json.dumps(dict(cases=partition_evidence,partition_mutations=mutations),indent=2)+'\n')


if __name__=='__main__':main()
