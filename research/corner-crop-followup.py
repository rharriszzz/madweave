#!/usr/bin/env python3
"""Bounded crop/independence experiment and adversarial supplied certificates."""
from pathlib import Path
from fractions import Fraction as F
import copy
import json
import runpy
from itertools import combinations

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'research/output/corner-crop-followup'
producer=runpy.run_path(str(Path(__file__).with_name('corner-crop-reference.py')))
checker=runpy.run_path(str(Path(__file__).with_name('check-corner-certificate.py')))


def wire(c):return json.loads(json.dumps(c,default=producer['encode']))


def recolor(c,pattern):
    c=copy.deepcopy(c);c['pattern']=pattern;p=c['parameters'];g=producer['g']
    for a in c['pieces']:
        j,d,q=a['id'];e,s=g['rotate_label'](d,q,j*(p['alpha']//60))
        a['color']=g['color'](pattern,e,s+p['k'][e],p['C'])
    return c


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    old=json.loads((ROOT/'research/evidence/single-corner-stage1.json').read_text())
    fresh=json.loads((ROOT/'research/output/single-corner-stage1/compact-summary.json').read_text())
    assert old==fresh,'Original certificates did not reproduce'
    specs=[(r['name'],r['parameters'],r) for r in old['fixtures']]
    base=old['fixtures'][0]['parameters']
    for radius in ('59/10','6','61/10'):
        for alpha in (60,120):
            for beta in (240,480):
                p=dict(base,alpha=alpha,sectors=beta//alpha,beta=beta,f=str(F(360,beta)),
                       R_over_P=radius,k=[0,2,-2] if alpha==60 else [0,0,0])
                specs.append((f'mad-R{radius}-alpha{alpha}-beta{beta}',p,None))
        for C in (0,1):
            for member in range(3):
                for beta in (240,480):
                    alpha=60 if member==1 else 120
                    p=dict(base,alpha=alpha,sectors=beta//alpha,beta=beta,f=str(F(360,beta)),
                           R_over_P=radius,k=[0,C,-C],C=C,member=member)
                    specs.append((f'hex-R{radius}-C{C}-class{member}-beta{beta}',p,None))
    summaries=[];baseline=None;fringe_example=None;self_example=None
    for index,(name,p,prior) in enumerate(specs):
        c=wire(producer['make'](p,name))
        counts=checker['validate'](c)
        patterns=[]
        for pattern in range(5):
            candidate=recolor(c,pattern)
            try:checker['validate'](candidate);valid=True;witness=None
            except ValueError as e:valid=False;witness=str(e)
            patterns.append({'pattern':pattern,'valid':valid,'witness':witness})
        if prior:
            for key,value in counts.items():assert prior[key]==value,(name,key,prior[key],value)
            assert [r['valid'] for r in patterns]==[r['valid'] for r in prior['patterns']],name
        summaries.append({'name':name,'parameters':p,'counts':counts,'fringe_bands':c['fringe_bands'],
                          'original_counts_unchanged':True if prior else None,'patterns':patterns})
        (OUT/(name.replace('/','_')+'.json')).write_text(json.dumps(c,indent=2)+'\n')
        if name=='mad-origin-m4-C0-H0-X0':baseline=c
        if name=='mad-R6-alpha120-beta480':fringe_example=c
        if name=='mad-self-crossing-beta120':self_example=c
        if index%20==0:print(f'checked {index+1}/{len(specs)}',flush=True)
    assert baseline and fringe_example and self_example
    mutations=[]
    def reject(name,modify,source=baseline):
        c=copy.deepcopy(source);modify(c)
        path=OUT/('invalid-'+name+'.json');path.write_text(json.dumps(c,indent=2)+'\n')
        try:checker['validate'](c)
        except ValueError as e:mutations.append({'mutation':name,'status':'Rejected','witness':str(e)})
        else:raise AssertionError('Mutation accepted: '+name)
    def swap(c):
        for a,b in combinations(c['joins'],2):
            if a['left'][0]==b['left'][0] and a['interval']==b['interval']:
                a['right'],b['right']=b['right'],a['right'];return
        raise AssertionError('No equal-interval partners')
    reject('wrong-partners',swap)
    reject('missing-material',lambda c:c['pieces'].pop())
    reject('duplicate-material',lambda c:c['pieces'].append(copy.deepcopy(c['pieces'][0])))
    reject('merged-occurrences',lambda c:c['pieces'][1].update(id=c['pieces'][0]['id']))
    reject('merged-components',lambda c:c['components'][0]['pieces'].extend(c['components'][1]['pieces']))
    def color_conflict(c):
        c['pattern']='custom';c['pieces'][0]['color']=1
    reject('color-conflict',color_conflict)
    def wrong_order(c):c['orders'][0]['top']=next(a for a in c['orders'][0]['pair'] if a!=c['orders'][0]['top'])
    reject('local-order',wrong_order)
    reject('missing-overlap',lambda c:c['orders'].pop())
    reject('bad-interval',lambda c:c['joins'][0]['interval'].__setitem__(0,'1/1000'))
    reject('side-reversal',lambda c:c['joins'][0].update(side_sign=-1))
    def missing_fringe(c):
        d,q=c['fringe_bands'][0];c['pieces']=[a for a in c['pieces'] if a['id']!=[0,d,q]]
    reject('missing-fringe',missing_fringe,fringe_example)
    reject('changed-boundary',lambda c:c['pieces'][0]['vertices'][0].__setitem__(0,'0'))
    reject('collapsed-self-crossing',lambda c:c['crossings'].pop(),self_example)
    def simultaneous_cycle(c):
        g=producer['g'];p=c['parameters']
        bands=[tuple(a['id'][1:]) for a in c['pieces'] if a['id'][0]==0]
        for triple in combinations(bands,3):
            if len({a[0] for a in triple})==3 and g['positive_material'](triple,p['alpha'],F(p['R_over_P']),F(p['W_over_P'])):
                for a,b in zip(triple,triple[1:]+triple[:1]):
                    pair={tuple([0,*a]),tuple([0,*b])}
                    row=next(e for e in c['orders'] if set(map(tuple,e['pair']))==pair)
                    row['top']=[0,*a]
                return
        raise AssertionError('No simultaneous overlap')
    reject('simultaneous-cycle',simultaneous_cycle)
    # A component-level cycle at separate locations is ordinary weaving.
    ids={tuple(a):i for i,c in enumerate(baseline['components']) for a in c['pieces']}
    edges=set()
    for row in baseline['orders']:
        a,b=map(tuple,row['pair']);top=tuple(row['top']);bottom=b if top==a else a
        edges.add((ids[top],ids[bottom]))
    cycle=next((a,b,c) for a,b in sorted(edges) for x,c in sorted(edges) if b==x and (c,a) in edges)
    cap=wire(producer['make'](dict(base,R_over_P='63/10'),'cap-R63_10'))
    (OUT/'cap-R63_10.json').write_text(json.dumps(cap,indent=2)+'\n')
    try:checker['validate'](cap)
    except ValueError as e:
        assert str(e).startswith('Unvalidated:'),str(e)
        cap_limit=str(e)
    else:raise AssertionError('Cap-end policy silently adopted')
    result={'scope':'Bounded full-region reference certificates; physical constructibility unverified',
            'original_fixtures_reproduced':89,'total_checked':len(specs),'mutations':mutations,
            'legitimate_self_crossings':checker['validate'](self_example)['self_crossings'],
            'legitimate_separate_location_cycle':cycle,
            'additional_cap_crop_limit':{'R_over_P':'63/10','status':'Unvalidated','witness':cap_limit,
                'all_occurrences_retained':len(cap['pieces'])},
            'cases':summaries}
    (OUT/'results.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='cases'},indent=2))


if __name__=='__main__':main()
