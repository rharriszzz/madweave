#!/usr/bin/env python3
"""Independent supplied-certificate checker; standard library only.

Reconstructs geometry by line intersections and a convex hull, rather than the
producer's clipping algorithm. No imports from either producer or Stage 1.
Exact rational circle/segment predicates; rejects unsupported degeneracies.
"""
from fractions import Fraction as Q
from itertools import combinations
from functools import lru_cache
import json
import sys
from math import isqrt


def require(condition, witness):
    if not condition:raise ValueError(witness)


N=((Q(0),Q(1)),(Q(-1,2),Q(-1,2)),(Q(1,2),Q(-1,2)))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def sq(a):return a[0]*a[0]/3+a[1]*a[1]
def turn(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])


def hull(points):
    points=sorted(set(points))
    if len(points)<3:return []
    halves=[]
    for seq in (points,points[::-1]):
        h=[]
        for p in seq:
            while len(h)>1 and turn(h[-2],h[-1],p)<=0:h.pop()
            h.append(p)
        halves.extend(h[:-1])
    return halves


def cap_lengths(R,w):
    result={}
    for s in range(-int(R)-3,int(R)+9):
        b=abs(Q(s)-Q(5,2))
        if b>=R:continue
        bound=3*(R*R-max(Q(0),b-w/2)**2)*256
        root=isqrt(bound.numerator//bound.denominator)
        while Q(root*root)<bound:root+=1
        result[s]=Q(root,16)+Q(1,8)
    return result


def tangent(d):return (-N[d][1],3*N[d][0])


def region(bands,alpha,R,w,ends=None):
    extent=R+2 if ends is not None else R
    planes=[((Q(1),Q(0)),2*extent),((Q(-1),Q(0)),2*extent),
            ((Q(0),Q(1)),extent),((Q(0),Q(-1)),extent),
            ((Q(0),Q(-1)),Q(0)),((Q(-1),Q(-1 if alpha==120 else 1)),Q(0))]
    for d,s in bands:
        b=Q(s)-Q(5,2)
        planes.extend([(N[d],b+w/2),(tuple(-v for v in N[d]),-b+w/2)])
        if ends is not None:planes.extend([(tangent(d),ends[s]),(tuple(-v for v in tangent(d)),ends[s])])
    points=[]
    for (a,b),(c,d) in combinations(planes,2):
        det=a[0]*c[1]-a[1]*c[0]
        if not det:continue
        p=((b*c[1]-a[1]*d)/det,(a[0]*d-b*c[0])/det)
        if all(dot(n,p)<=v for n,v in planes):points.append(p)
    return hull(points)


def inside(poly,R):
    if len(poly)<3:return False
    minimum=min(sq(p) for p in poly)
    for a,b in zip(poly,poly[1:]+poly[:1]):
        v=tuple(b[i]-a[i] for i in range(2))
        t=max(Q(0),min(Q(1),-(a[0]*v[0]/3+a[1]*v[1])/sq(v)))
        minimum=min(minimum,sq(tuple(a[i]+t*v[i] for i in range(2))))
    return minimum<R*R


def arcs(poly,R):
    count=0
    for a,b in zip(poly,poly[1:]+poly[:1]):
        v=tuple(b[i]-a[i] for i in range(2))
        A,B,C=sq(v),2*(a[0]*v[0]/3+a[1]*v[1]),sq(a)-R*R
        D=B*B-4*A*C
        require(C!=0 and A+B+C!=0,'Unvalidated: vertex on circular boundary')
        if D<=0:continue
        # Count roots in (0,1) using monotonic intervals of the quadratic.
        points=[Q(0),Q(1)]
        if 0<-B/(2*A)<1:points.insert(1,-B/(2*A))
        for lo,hi in zip(points,points[1:]):
            if (A*lo*lo+B*lo+C)*(A*hi*hi+B*hi+C)<0:count+=1
    require(count%2==0,'Odd circle intersection count')
    return count//2


def port(d,s,ray,R,w,ends=None):
    v={0:(0,-1,1),60:(1,-1,0),120:(1,0,-1)}[ray][d]
    if not v:return None
    b=Q(s)-Q(5,2)
    lo,hi=max(Q(0),2*v*b-w),2*v*b+w
    if ends is not None:
        direction={0:(1,0),60:(Q(1,2),Q(1,2)),120:(Q(-1,2),Q(1,2))}[ray]
        hi=min(hi,ends[s]/abs(dot(tangent(d),direction)))
        return [str(lo),str(hi)] if hi>lo else None
    if hi<=lo or lo*lo>=3*R*R:return None
    return [str(lo),str(hi) if hi*hi<3*R*R else ['sqrt',str(3*R*R),1]]


def rotate(d,s,steps):
    # Closed form, independently from iterative label transport.
    return ((d+(steps//2 if steps%2==0 else (steps+3)//2))%3,
            s if steps%2==0 else 5-s)


def precedence(a,b,p):
    d,s=a;e,t=b;k=p['k'];C=p['C']
    s+=k[d];t+=k[e]
    dd=(d-e)%3
    residue=((t-s) if dd==1 else (s-t))%3
    value=residue==(1-C)
    value^=((dd==1)==bool(p['X']))
    value^=bool(p['hand']) and (s+C*(3-d))%3==(t+C*(3-e))%3
    return value


def validate_render_partition(c,bands):
    p={k:v for k,v in c['parameters'].items() if k not in ('sectors','beta','f','strip_seeds')}
    return checked_partition(json.dumps(dict(parameters=p,render_cells=c['render_cells'],render_outside_cells=c['render_outside_cells']),sort_keys=True))


@lru_cache(maxsize=512)
def checked_partition(raw):
    """Independent exact coverage proof for Stage 2's optional cell partition.

    Distinct plane-sign signatures give disjoint interiors. Exact area sums
    within each full reference band prove completeness before circular clipping.
    Exact disk predicates then prove that omitted cells have zero crop area.
    No clipping algorithm or producer cells are used as expected answers.
    """
    c=json.loads(raw);p=c['parameters'];R=Q(p['R_over_P']);w=Q(p['W_over_P'])
    bands=reference_sector(json.dumps(p,sort_keys=True))[0]
    ends=cap_lengths(R,w) if p.get('end_style')=='strip' else None
    extent=R+2 if ends is not None else R
    cuts={(N[d],Q(s)-Q(5,2)+sign*w/2) for d,s in bands for sign in (-1,1)}
    if ends is not None:cuts.update((tuple(sign*x for x in tangent(d)),ends[s]) for d,s in bands for sign in (-1,1))
    cuts=sorted(cuts)
    signatures=set();areas={a:Q(0) for a in bands}
    def twice_area(poly):return sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(poly,poly[1:]+poly[:1]))
    for visible,rows in [(True,c['render_cells']),(False,c['render_outside_cells'])]:
        for row in rows:
            poly=[tuple(map(Q,a)) for a in row['vertices']];convex=hull(poly)
            require(len(set(poly))==len(poly) and len(convex)>=3 and twice_area(poly)==twice_area(convex)>0,'Nonconvex/invalid order-region polygon')
            require(all(abs(x)<=2*extent and abs(y)<=extent and y>=0 and x+(y if p['alpha']==120 else -y)>=0 for x,y in poly),'Order region outside reference wedge')
            signature=[]
            for n,b in cuts:
                values=[dot(n,a)-b for a in poly]
                require(not(min(values)<0<max(values)),'Order region crosses a material boundary')
                signature.append(max(values)>0)
            signature=tuple(signature)
            require(signature not in signatures,'Duplicated order-region material');signatures.add(signature)
            mean=tuple(sum(a[i] for a in poly)/len(poly) for i in range(2))
            members={a for a in bands if abs(dot(N[a[0]],mean)-(Q(a[1])-Q(5,2)))<w/2 and (ends is None or abs(dot(tangent(a[0]),mean))<ends[a[1]])}
            supplied=[tuple(a) for a in row['members']]
            require(members and len(supplied)==len(set(supplied)) and set(supplied)==members,'Incorrect order-region membership')
            require((bool(convex) if ends is not None else inside(convex,R))==visible,'Positive cropped material marked outside')
            for a in members:areas[a]+=twice_area(convex)
    require(all(areas[a]==twice_area(poly) for a,poly in bands.items()),'Incomplete order-region material coverage')


def reference(raw):
    p=json.loads(raw);R=Q(p['R_over_P']);w=Q(p['W_over_P']);alpha=p['alpha'];m=p['sectors']
    # Stage 3B extends only the enumeration bound, to twelve 60-degree sectors
    # (beta=720). All geometry remains in one convex canonical sector; joins,
    # source phase checks, orders and the final wrap are still checked for every
    # occurrence. No proof assumes m<=8. Twelve/thirteen-sector regression cases
    # explicitly exercise the new limit and its rejection boundary.
    square=p.get('end_style')=='strip'
    require(alpha in (60,120) and isinstance(m,int) and 1<=m<=12 and Q(1)<=R<=(12 if square else 8) and 0<w<1,
            'Unvalidated: outside bounded checker domain')
    if square:require(type(p.get('size')) is int and 1<=p['size']<=8 and R==Q(3*p['size']+1,2)//1,'Strip size and working radius')
    require(sum(p['k'])==0 and all(isinstance(v,int) for v in p['k']),'Center phase')
    require(all(p[f] in (0,1) for f in ('C','hand','X')),'Order flags')
    require(p['member'] in (None,0,1,2),'Membership')
    require(Q(p['f'])==Q(360,alpha*m) and p['beta']==alpha*m,'Angle state')
    return reference_sector(json.dumps({k:v for k,v in p.items() if k not in ('sectors','beta','f','strip_seeds')},sort_keys=True))


@lru_cache(maxsize=512)
def reference_sector(raw):
    # Sector geometry is shared by every angle; occurrence joins are checked
    # separately below. Sizes and spacings use the same exact checks.
    p=json.loads(raw);R=Q(p['R_over_P']);w=Q(p['W_over_P']);alpha=p['alpha']
    ends=cap_lengths(R,w) if p.get('end_style')=='strip' else None
    shape=lambda a:region(a,alpha,R,w,ends)
    occupied=lambda poly:bool(poly) if ends is not None else inside(poly,R)
    bands={}
    for d in range(3):
        # Outside this range |normal offset| > R+w/2: no band material.
        for s in range(-int(R)-3,int(R)+9):
            if ends is not None and s not in ends:continue
            if p['member'] is not None and (s+p['k'][d]+p['C']*(3-d))%3!=p['member']:continue
            poly=shape([(d,s)])
            if occupied(poly):bands[d,s]=poly
    expected_orders={};crossings={}
    for a,b in combinations(bands,2):
        if a[0]==b[0]:continue
        if occupied(shape([a,b])):
            expected_orders[a,b]=a if precedence(a,b,p) else b
        n,v=N[a[0]],N[b[0]];D=n[0]*v[1]-n[1]*v[0]
        A,B=Q(a[1])-Q(5,2),Q(b[1])-Q(5,2)
        z=((A*v[1]-n[1]*B)/D,(n[0]*B-A*v[0])/D)
        if (all(abs(dot(tangent(d),z))<=ends[s] for d,s in (a,b)) if ends is not None else sq(z)<R*R) and z[1]>=0 and z[0]+(z[1] if alpha==120 else -z[1])>=0:
            crossings[a,b]=z
    # Check every actually simultaneous positive-area triple, not a global rank.
    for triple in combinations(bands,3):
        if len({a[0] for a in triple})<3:continue
        if not all(tuple(sorted(pair)) in expected_orders for pair in combinations(triple,2)):continue
        if occupied(shape(triple)):
            ranks=[sum(precedence(a,b,p) for b in triple if b!=a) for a in triple]
            require(sorted(ranks)==[0,1,2],f'Inconsistent source local stack: {triple}')
    def end_count(a,poly):
        t=tangent(a[0]);L=ends[a[1]]
        return sum(any(dot(t,x)==dot(t,y)==sign*L for sign in (-1,1)) for x,y in zip(poly,poly[1:]+poly[:1]))
    return bands,expected_orders,crossings,{a:end_count(a,poly) if ends is not None else arcs(poly,R) for a,poly in bands.items()}


def connected(nodes,edges):
    adjacency={a:set() for a in nodes}
    for a,b in edges:adjacency[a].add(b);adjacency[b].add(a)
    groups=[];remaining=set(nodes)
    while remaining:
        group=set();todo=[min(remaining)]
        while todo:
            a=todo.pop()
            if a in group:continue
            group.add(a);todo.extend(adjacency[a]-group)
        remaining-=group;groups.append(frozenset(group))
    return groups


def validate(c):
    require(c['version']==2,'Certificate version')
    p=c['parameters'];alpha=p['alpha'];m=p['sectors'];R=Q(p['R_over_P']);w=Q(p['W_over_P'])
    bands,expected_orders,crossings,arc_counts=reference(json.dumps(p,sort_keys=True))
    caps=cap_lengths(R,w) if p.get('end_style')=='strip' else None
    if 'render_cells' in c:validate_render_partition(c,bands)
    for j in range(m+1):
        for a in bands:
            d,s=rotate(*a,j*(alpha//60))
            require(p['member'] is None or (s+p['k'][d]+p['C']*(3-d))%3==p['member'],
                    f'Sector material membership phase: sector={j}, original={a}, rotated={(d,s)}, selected class={p["member"]}')
        for (a,b),top in expected_orders.items():
            aa=rotate(*a,j*(alpha//60));bb=rotate(*b,j*(alpha//60))
            require(precedence(a,b,p)==precedence(aa,bb,p),f'Sector/seam crossing phase: sector={j}, pair={(a,b)}, rotated={(aa,bb)}, original_top={top}, rotated_top={aa if precedence(aa,bb,p) else bb}')
    expected={(j,*a) for j in range(m) for a in bands}
    expected_joins={}
    start_bands={a for a in bands if port(*a,0,R,w,caps) is not None}
    end_bands={a for a in bands if port(*a,alpha,R,w,caps) is not None}
    require({rotate(*a,alpha//60) for a in start_bands}==end_bands,'Unpaired reference end intervals')
    for j in range(m):
        for a in start_bands:
            interval=port(*a,0,R,w,caps);b=rotate(*a,alpha//60)
            require(b in bands and port(*b,alpha,R,w,caps)==interval,'Reference seam membership')
            expected_joins[(j,*b),((j+1)%m,*a)]=interval
    if caps is not None:
        candidates={min(group):group for group in connected(expected,expected_joins)}
        seeds=[tuple(a) for a in p['strip_seeds']]
        require(len(seeds)==len(set(seeds)) and set(seeds)<=set(candidates),'Invalid strip selection')
        target=Q((9 if p['member'] is None else 3)*p['size']*p['beta'],360)
        require(len(seeds)==(2*target.numerator+target.denominator)//(2*target.denominator),'Incorrect size strip count')
        expected=set().union(*(candidates[a] for a in seeds))
        expected_joins={edge:v for edge,v in expected_joins.items() if edge[0] in expected}
        require(all(b in expected for a,b in expected_joins),'Partial strip selection')
        if p['beta']==360:
            labels={rotate(d,s,j*(alpha//60)) for j,d,s in expected}
            lo=3-(3*p['size'])//2;hi=lo+3*p['size']-1
            wanted={(d,s) for d in range(3) for s in range(lo,hi+1) if p['member'] is None or (s+p['k'][d]+p['C']*(3-d))%3==p['member']}
            require(labels==wanted,'Size at 360 differs from original strip counts')
    supplied=[tuple(a['id']) for a in c['pieces']]
    require(len(set(supplied))==len(supplied),'Duplicated or merged occurrence identity')
    require(set(supplied)==expected,f'Material coverage mismatch: missing={expected-set(supplied)}, extra={set(supplied)-expected}')
    colors={}
    for a in c['pieces']:
        j,d,s=a['id'];key=(j,d,s)
        vertices=[tuple(map(Q,v)) for v in a['vertices']]
        require(len(vertices)==len(set(vertices)) and set(vertices)==set(bands[d,s]),f'Band boundary geometry: {key}')
        require(a['outer_arc_fragments']==arc_counts[d,s],f'Circular material arcs: {key}')
        col=a['color'];require(type(col) is int and 0<=col<3,f'Material color label: {key}')
        if c['pattern'] is None:require(col==0,f'Monochrome assignment: {key}')
        elif c['pattern']!='custom':
            pattern=c['pattern'];require(type(pattern) is int and 0<=pattern<5,'Color pattern')
            e,t=rotate(d,s,j*(alpha//60));z=t+p['k'][e]+p['C']*(3-e)
            require(col==[e,z%3,e+z%3,z//3,z%3+z//3][pattern]%3,f'Source pattern assignment: {key}')
        colors[key]=col
    supplied_joins=[(tuple(e['left']),tuple(e['right'])) for e in c['joins']]
    require(len(set(supplied_joins))==len(supplied_joins) and set(supplied_joins)==set(expected_joins),'Wrong, missing or duplicate registered partner')
    for e in c['joins']:
        a,b=tuple(e['left']),tuple(e['right'])
        require(e['interval']==expected_joins[a,b],f'Full-width seam interval: {a}')
        require(e['face']==1 and e['side_sign']==(-1)**(alpha//60),'Ribbon face/side transport')
        require(colors[a]==colors[b],f'Color conflict at join: {a}, {b}')
    groups=connected(expected,expected_joins)
    claimed=[frozenset(tuple(a) for a in group['pieces']) for group in c['components']]
    require(len(claimed)==len(set(claimed)) and set(claimed)==set(groups),'Merged/split material components')
    component_of={a:i for i,g in enumerate(groups) for a in g}
    for claim,group in zip(c['components'],claimed):
        require(len(group)==len(claim['pieces']),'Repeated component occurrence')
        edges=[e for e in c['joins'] if tuple(e['left']) in group]
        require(len(edges)==len(group)-1,'Unvalidated: ribbon region is not a disk (join cycle)')
        def at_end(e):
            if caps is None:return isinstance(e['interval'][1],list)
            _,d,s=e['right'];actual=Q(e['interval'][1])==caps[s]/abs(tangent(d)[0])
            require(e.get('at_end')==actual,'Incorrect end cut at seam')
            return actual
        ends=sum(arc_counts[a[1:]] for a in group)-sum(at_end(e) for e in edges)
        require(claim['outer_ends']==ends==2,'Unvalidated: crop is not a regular two-ended ribbon')
    orders={}
    for e in c['orders']:
        a,b=map(tuple,e['pair']);key=(a,b)
        require(key not in orders,'Duplicate local overlap');orders[key]=tuple(e['top'])
    expected_full={( (j,*a),(j,*b)):(j,*top) for j in range(m) for (a,b),top in expected_orders.items() if (j,*a) in expected and (j,*b) in expected}
    if orders!=expected_full:
        pair=next(key for key in set(orders)|set(expected_full) if orders.get(key)!=expected_full.get(key))
        raise ValueError(f'Missing/incorrect local order or overlap material: {pair}')
    events={}
    for e in c['crossings']:
        pair=tuple(map(tuple,e['pair']))
        require(pair not in events,'Duplicated local crossing');events[pair]=tuple(map(Q,e['XY']))
    expected_cross={((j,*a),(j,*b)):z for j in range(m) for (a,b),z in crossings.items() if (j,*a) in expected and (j,*b) in expected}
    require(events==expected_cross,'Missing/incorrect crossing positions')
    unique=set();self_events=set()
    for (a,b),z in events.items():
        j=a[0];ids=tuple(sorted((component_of[a],component_of[b])))
        boundary=j if z[1]==0 else ((j+1)%m if z[0]+(z[1] if alpha==120 else -z[1])==0 else None)
        key=('boundary',boundary,sq(z),ids) if boundary is not None else ('interior',j,z,ids)
        unique.add(key)
        if ids[0]==ids[1]:self_events.add(key)
    return {'occurrences':len(expected),'joins':len(expected_joins),'open_strips':len(groups),
            'outer_ends':2*len(groups),'centerline_crossings':len(unique),'self_crossings':len(self_events)}


if __name__=='__main__':
    try:
        result=validate(json.load(open(sys.argv[1])))
        print(json.dumps({'status':'Validated','counts':result}))
    except (ValueError,KeyError,TypeError,IndexError,ZeroDivisionError) as e:
        status='Unvalidated' if str(e).startswith('Unvalidated:') else 'Invalid'
        print(json.dumps({'status':status,'witness':str(e)}));sys.exit(1)
