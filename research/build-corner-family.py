#!/usr/bin/env python3
"""Stage 3B finite matrix first, then build independently checked drawing inputs.

No production imports. The checker still imports neither this generator nor
the clipping producer. Each advertised full certificate and each advertised
color assignment is checked, including every internal and final boundary.
"""
from pathlib import Path
from fractions import Fraction as F
from collections import Counter
from itertools import product
import copy,hashlib,json,runpy

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'research/corner-prototype'
old=runpy.run_path(str(ROOT/'research/build-corner-prototype.py'))
producer,check=old['producer'],old['check']
PHASES=[
 dict(id='mad-ordinary',weave='madweave',label='Small hexagon · ordinary threefold',k=[0,0,0],C=0,hand=0,X=0,member=None,unit=120,crops=['r3','r6']),
 dict(id='mad-sixfold',weave='madweave',label='Small hexagon · displaced sixfold',k=[0,2,-2],C=0,hand=0,X=0,member=None,unit=60,crops=['r3','r6']),
 dict(id='mad-c-on',weave='madweave',label='Small hexagon · C on, sixfold',k=[0,0,0],C=1,hand=0,X=0,member=None,unit=60,crops=['r3','r6']),
 dict(id='hex-large',weave='hexweave',label='Large hexagon · class 1',k=[0,0,0],C=0,hand=0,X=0,member=1,unit=60,crops=['r7']),
 dict(id='hex-minus',weave='hexweave',label='Triangle −y · class 0',k=[0,0,0],C=0,hand=0,X=0,member=0,unit=120,crops=['r7']),
 dict(id='hex-plus',weave='hexweave',label='Triangle +y · class 2',k=[0,0,0],C=0,hand=0,X=0,member=2,unit=120,crops=['r7']),
]
CROPS=[dict(id='r3',radius='3',label='Compact · R/P=3'),dict(id='r6',radius='6',label='Full fringe crop · R/P=6'),dict(id='r7',radius='7',label='Hexweave crop · R/P=7')]
def encode(x):return json.loads(json.dumps(x,default=producer['encode']))
def signature(p):return json.dumps(p,sort_keys=True)
def status(e):return 'Unvalidated' if str(e).startswith('Unvalidated:') else 'Invalid'
def parameters(phase,crop,beta):
    # C-on even steps retain the old 120-degree occurrence decomposition.
    # The sixfold displaced and large-hexagon phases always use 60-degree units.
    alpha=120 if beta%120==0 and phase['id'] not in ('mad-sixfold','hex-large') else 60
    return dict(alpha=alpha,sectors=beta//alpha,beta=beta,f=str(F(360,beta)),
                **{k:phase[k] for k in ['k','C','hand','X','member']},W_over_P='3/4',R_over_P=crop['radius'])

def phase_check(p):
    bands,orders,_,_=check['reference'](signature(p))
    # Call the independent checker's actual phase checks. A phase failure is
    # reached before piece data is requested; KeyError means that phase passed.
    try:check['validate'](dict(version=2,parameters=p))
    except KeyError as e:
        assert e.args==('pieces',)

PARTITIONS={}
def partition(p):
    key=signature({k:v for k,v in p.items() if k not in ['sectors','beta','f']})
    if key in PARTITIONS:return PARTITIONS[key]
    bands,_,_,_=check['reference'](signature(p));R=F(p['R_over_P']);w=F(p['W_over_P']);g=producer['g']
    cells=[[(-2*R,-R),(2*R,-R),(2*R,R),(-2*R,R)]]
    for normal,bound in g['wedge'](p['alpha']):cells=[g['clip'](c,normal,bound) for c in cells]
    cuts={(check['N'][d],F(s)-F(5,2)+sign*w/2) for d,s in bands for sign in (-1,1)}
    for normal,bound in sorted(cuts):
        children=[]
        for cell in cells:
            for n,b in [(normal,bound),(tuple(-x for x in normal),-bound)]:
                child=g['clip'](cell,n,b)
                if len(child)>=3 and g['area2'](child)>0:children.append(child)
        cells=children
    inside=[];outside=[]
    for cell in cells:
        mean=tuple(sum(a[i] for a in cell)/len(cell) for i in range(2))
        members=[a for a in bands if abs(check['dot'](check['N'][a[0]],mean)-(F(a[1])-F(5,2)))<w/2]
        if members:(inside if check['inside'](cell,R) else outside).append(dict(vertices=cell,members=members))
    PARTITIONS[key]=encode((inside,outside));return PARTITIONS[key]

def colored(c,pattern):
    candidate=copy.deepcopy(c);candidate['pattern']=pattern;p=c['parameters']
    for a in candidate['pieces']:
        j,d,s=a['id'];d,s=check['rotate'](d,s,j*(p['alpha']//60));z=s+p['k'][d]+p['C']*(3-d)
        a['color']=0 if pattern is None else [d,z%3,d+z%3,z//3,z%3+z//3][pattern]%3
    return candidate

def main():
    legacy=json.loads((DEST/'examples.json').read_text());by_params={}
    for entry in legacy:
        c=json.loads((DEST/entry['url']).read_text());by_params[signature(c['parameters'])]=(entry,c)
    entries=[];rows=[];oracles={};color_oracles={};certificates={};digests={}
    for phase in PHASES:
        phase['center_over_P']=[str(F(-(2*phase['k'][1]+phase['k'][0]),3))+'*sqrt(3)',str(phase['k'][0])]
        for crop in CROPS:
            for beta in range(60,721,60):
                p=parameters(phase,crop,beta);row=dict(weave=phase['weave'],phase=phase['id'],crop=crop['id'],beta=beta,parameters=p)
                rows.append(row)
                if crop['id'] not in phase['crops']:
                    row.update(status='Unvalidated',witness='Crop preset outside this phase’s bounded UI scope; no certificate advertised',patterns=[dict(pattern=a,status='Unvalidated',witness='Crop not offered for this phase') for a in [None,0,1,2,3,4]])
                    continue
                try:
                    phase_check(p)
                    existing=by_params.get(signature(p));key=existing[0]['id'] if existing else f"{phase['id']}-{beta}-{crop['id']}"
                    c=existing[1] if existing else encode(producer['make'](p,key))
                    counts=check['validate'](c)
                except (ValueError,KeyError,AssertionError) as e:
                    # Assertions/missing keys are generator defects, not math
                    # witnesses. Abort rather than misclassify a producer bug.
                    if not isinstance(e,ValueError):raise
                    row.update(status=status(e),witness=str(e),patterns=[dict(pattern=a,status=status(e),witness=str(e)) for a in [None,0,1,2,3,4]])
                    continue
                patterns=[];color_oracles[key]=dict(positions=[':'.join(map(str,a['id'])) for a in c['pieces']],patterns={})
                for a in [None,0,1,2,3,4]:
                    candidate=colored(c,a)
                    color_oracles[key]['patterns']['mono' if a is None else str(a)]=[v['color'] for v in candidate['pieces']]
                    try:assert check['validate'](candidate)==counts;result=dict(pattern=a,status='Validated',distinct_colors=len({v['color'] for v in candidate['pieces']}))
                    except ValueError as e:result=dict(pattern=a,status=status(e),witness=str(e))
                    patterns.append(result)
                # Matrix exists before browser inputs: geometry and color
                # acceptance are separate, with a witness for each restriction.
                row.update(id=key,status='Validated',counts=counts,open_strips_only=True,patterns=patterns)
                if not existing:
                    c['render_cells'],c['render_outside_cells']=partition(p)
                    assert check['validate'](c)==counts
                    (DEST/'family-certificates').mkdir(exist_ok=True)
                    (DEST/'family-certificates'/f'{key}.json').write_text(json.dumps(c,separators=(',',':'))+'\n')
                raw=(DEST/(existing[0]['url'] if existing else 'family-certificates/'+key+'.json')).read_bytes()
                digests[key]=hashlib.sha256(raw).hexdigest();certificates[key]=c
                entries.append(dict(id=key,label=existing[0]['label'] if existing else f"{phase['label']} · {beta}° · R/P={crop['radius']}",url=existing[0]['url'] if existing else f'family-certificates/{key}.json',counts=counts,
                    patterns=[dict(pattern=a,valid=r['status']=='Validated',distinct_colors=r.get('distinct_colors'),witness=r.get('witness')) for a,r in zip(range(5),patterns[1:])],default_pattern=existing[0]['default_pattern'] if existing else None,
                    config={k:row[k] for k in ['weave','phase','crop','beta']}))
                # Canonical band/overlap interior probes, replicated with exact
                # occurrence identity. Expected order comes from the checker.
                bands,orders,_,_=check['reference'](signature(p));R=F(p['R_over_P']);w=F(p['W_over_P'])
                points={old['probe'](poly,R) for poly in bands.values()}
                for a,b in orders:points.add(old['probe'](check['region']([a,b],p['alpha'],R,w),R))
                for x,y in product(range(-12,13),repeat=2):
                    z=(F(x)*R/7,F(y)*R/12)
                    if z[1]>0 and z[0]+(z[1] if p['alpha']==120 else -z[1])>0:points.add(z)
                samples=[]
                for z in sorted(points):
                    if z[1]<=F(1,100000) or z[0]+(z[1] if p['alpha']==120 else -z[1])<=F(1,100000):continue
                    margin=min([abs(float(check['dot'](check['N'][d],z)-(F(s)-F(5,2))+sign*w/2)) for d,s in bands for sign in (-1,1)]+[abs(float(check['sq'](z))-float(R*R))/(2*float(R))])
                    if margin<.002:continue
                    members=[a for a in bands if check['sq'](z)<R*R and abs(check['dot'](check['N'][a[0]],z)-(F(a[1])-F(5,2)))<w/2]
                    # sorted reads the original list. list.sort temporarily
                    # empties its list while evaluating key functions.
                    members=sorted(members,key=lambda a:-sum(check['precedence'](a,b,p) for b in members if b!=a))
                    assert all(check['precedence'](a,b,p) for i,a in enumerate(members) for b in members[i+1:])
                    for j in range(p['sectors']):samples.append(dict(XY=list(map(float,z)),sector=j,positions=[[j,*a] for a in members]))
                assert {tuple(a) for r in samples for a in r['positions']}=={tuple(a['id']) for a in c['pieces']},'Oracle missed material'
                oracles[key]=samples
                print(key,counts,flush=True)
    # Verify the bound explicitly without claiming thirteen sectors impossible.
    largest=next(c for c in certificates.values() if c['parameters']['sectors']==12)
    assert check['validate'](largest)
    beyond=copy.deepcopy(largest);beyond['parameters'].update(sectors=13,beta=780,f='6/13')
    try:check['validate'](beyond)
    except ValueError as e:assert str(e)=='Unvalidated: outside bounded checker domain'
    else:raise AssertionError('Expected the declared checker limit')
    assert {e['id'] for e in legacy}<={e['id'] for e in entries}
    matrix=dict(version=1,domain=dict(angles=list(range(60,721,60)),width='3/4',phases=PHASES,crops=CROPS),rows=rows,summary=dict(Counter(r['status'] for r in rows)),colorSummary=dict(Counter(a['status'] for r in rows for a in r['patterns'])))
    (DEST/'family-matrix.json').write_text(json.dumps(matrix,indent=2)+'\n')
    (DEST/'family.json').write_text(json.dumps(entries,indent=2)+'\n')
    (ROOT/'research/evidence/corner-family-oracles.json').write_text(json.dumps(oracles,separators=(',',':'))+'\n')
    (ROOT/'research/evidence/corner-family-color-oracles.json').write_text(json.dumps(color_oracles,separators=(',',':'))+'\n')
    print('Matrix',matrix['summary'],'certificates',len(entries),'bytes',sum((DEST/e['url']).stat().st_size for e in entries),flush=True)

if __name__=='__main__':main()
