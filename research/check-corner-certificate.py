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


def region(bands,alpha,R,w):
    planes=[((Q(1),Q(0)),2*R),((Q(-1),Q(0)),2*R),
            ((Q(0),Q(1)),R),((Q(0),Q(-1)),R),
            ((Q(0),Q(-1)),Q(0)),((Q(-1),Q(-1 if alpha==120 else 1)),Q(0))]
    for d,s in bands:
        b=Q(s)-Q(5,2)
        planes.extend([(N[d],b+w/2),(tuple(-v for v in N[d]),-b+w/2)])
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


def port(d,s,ray,R,w):
    v={0:(0,-1,1),60:(1,-1,0),120:(1,0,-1)}[ray][d]
    if not v:return None
    b=Q(s)-Q(5,2)
    lo,hi=max(Q(0),2*v*b-w),2*v*b+w
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
    """Independent exact coverage proof for Stage 2's optional cell partition.

    Distinct plane-sign signatures give disjoint interiors. Exact area sums
    within each full reference band prove completeness before circular clipping.
    Exact disk predicates then prove that omitted cells have zero crop area.
    No clipping algorithm or producer cells are used as expected answers.
    """
    p=c['parameters'];R=Q(p['R_over_P']);w=Q(p['W_over_P'])
    cuts={(N[d],Q(s)-Q(5,2)+sign*w/2) for d,s in bands for sign in (-1,1)}
    cuts=sorted(cuts)
    signatures=set();areas={a:Q(0) for a in bands}
    def twice_area(poly):return sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(poly,poly[1:]+poly[:1]))
    for visible,rows in [(True,c['render_cells']),(False,c['render_outside_cells'])]:
        for row in rows:
            poly=[tuple(map(Q,a)) for a in row['vertices']];convex=hull(poly)
            require(len(set(poly))==len(poly) and len(convex)>=3 and twice_area(poly)==twice_area(convex)>0,'Nonconvex/invalid order-region polygon')
            require(all(abs(x)<=2*R and abs(y)<=R and y>=0 and x+(y if p['alpha']==120 else -y)>=0 for x,y in poly),'Order region outside reference wedge')
            signature=[]
            for n,b in cuts:
                values=[dot(n,a)-b for a in poly]
                require(not(min(values)<0<max(values)),'Order region crosses a material boundary')
                signature.append(max(values)>0)
            signature=tuple(signature)
            require(signature not in signatures,'Duplicated order-region material');signatures.add(signature)
            mean=tuple(sum(a[i] for a in poly)/len(poly) for i in range(2))
            members={a for a in bands if abs(dot(N[a[0]],mean)-(Q(a[1])-Q(5,2)))<w/2}
            supplied=[tuple(a) for a in row['members']]
            require(members and len(supplied)==len(set(supplied)) and set(supplied)==members,'Incorrect order-region membership')
            require(inside(convex,R)==visible,'Positive cropped material marked outside')
            for a in members:areas[a]+=twice_area(convex)
    require(all(areas[a]==twice_area(poly) for a,poly in bands.items()),'Incomplete order-region material coverage')


@lru_cache(maxsize=256)
def reference(raw):
    p=json.loads(raw);R=Q(p['R_over_P']);w=Q(p['W_over_P']);alpha=p['alpha'];m=p['sectors']
    # Stage 3B extends only the enumeration bound, to twelve 60-degree sectors
    # (beta=720). All geometry remains in one convex canonical sector; joins,
    # source phase checks, orders and the final wrap are still checked for every
    # occurrence. No proof assumes m<=8. Twelve/thirteen-sector regression cases
    # explicitly exercise the new limit and its rejection boundary.
    require(alpha in (60,120) and isinstance(m,int) and 1<=m<=12 and Q(1)<=R<=8 and 0<w<1,
            'Unvalidated: outside bounded checker domain')
    require(sum(p['k'])==0 and all(isinstance(v,int) for v in p['k']),'Center phase')
    require(all(p[f] in (0,1) for f in ('C','hand','X')),'Order flags')
    require(p['member'] in (None,0,1,2),'Membership')
    require(Q(p['f'])==Q(360,alpha*m) and p['beta']==alpha*m,'Angle state')
    bands={}
    for d in range(3):
        # Outside this range |normal offset| > R+w/2: no band material.
        for s in range(-int(R)-3,int(R)+9):
            if p['member'] is not None and (s+p['k'][d]+p['C']*(3-d))%3!=p['member']:continue
            poly=region([(d,s)],alpha,R,w)
            if inside(poly,R):bands[d,s]=poly
    expected_orders={};crossings={}
    for a,b in combinations(bands,2):
        if a[0]==b[0]:continue
        if inside(region([a,b],alpha,R,w),R):
            expected_orders[a,b]=a if precedence(a,b,p) else b
        n,v=N[a[0]],N[b[0]];D=n[0]*v[1]-n[1]*v[0]
        A,B=Q(a[1])-Q(5,2),Q(b[1])-Q(5,2)
        z=((A*v[1]-n[1]*B)/D,(n[0]*B-A*v[0])/D)
        if sq(z)<R*R and z[1]>=0 and z[0]+(z[1] if alpha==120 else -z[1])>=0:
            crossings[a,b]=z
    # Check every actually simultaneous positive-area triple, not a global rank.
    for triple in combinations(bands,3):
        if len({a[0] for a in triple})<3:continue
        if not all(tuple(sorted(pair)) in expected_orders for pair in combinations(triple,2)):continue
        if inside(region(triple,alpha,R,w),R):
            ranks=[sum(precedence(a,b,p) for b in triple if b!=a) for a in triple]
            require(sorted(ranks)==[0,1,2],f'Inconsistent source local stack: {triple}')
    return bands,expected_orders,crossings,{a:arcs(poly,R) for a,poly in bands.items()}


def validate(c):
    require(c['version']==2,'Certificate version')
    p=c['parameters'];alpha=p['alpha'];m=p['sectors'];R=Q(p['R_over_P']);w=Q(p['W_over_P'])
    bands,expected_orders,crossings,arc_counts=reference(json.dumps(p,sort_keys=True))
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
    expected_joins={}
    start_bands={a for a in bands if port(*a,0,R,w) is not None}
    end_bands={a for a in bands if port(*a,alpha,R,w) is not None}
    require({rotate(*a,alpha//60) for a in start_bands}==end_bands,'Unpaired reference end intervals')
    for j in range(m):
        for a in bands:
            interval=port(*a,0,R,w)
            if interval is None:continue
            b=rotate(*a,alpha//60)
            require(b in bands and port(*b,alpha,R,w)==interval,'Reference seam membership')
            expected_joins[(j,*b),((j+1)%m,*a)]=interval
    supplied_joins=[(tuple(e['left']),tuple(e['right'])) for e in c['joins']]
    require(len(set(supplied_joins))==len(supplied_joins) and set(supplied_joins)==set(expected_joins),'Wrong, missing or duplicate registered partner')
    adjacency={a:set() for a in expected}
    for e in c['joins']:
        a,b=tuple(e['left']),tuple(e['right'])
        require(e['interval']==expected_joins[a,b],f'Full-width seam interval: {a}')
        require(e['face']==1 and e['side_sign']==(-1)**(alpha//60),'Ribbon face/side transport')
        require(colors[a]==colors[b],f'Color conflict at join: {a}, {b}')
        adjacency[a].add(b);adjacency[b].add(a)
    groups=[];remaining=set(expected)
    while remaining:
        group=set();todo=[next(iter(remaining))]
        while todo:
            a=todo.pop()
            if a in group:continue
            group.add(a);todo.extend(adjacency[a]-group)
        remaining-=group;groups.append(frozenset(group))
    claimed=[frozenset(tuple(a) for a in group['pieces']) for group in c['components']]
    require(len(claimed)==len(set(claimed)) and set(claimed)==set(groups),'Merged/split material components')
    component_of={a:i for i,g in enumerate(groups) for a in g}
    for claim,group in zip(c['components'],claimed):
        require(len(group)==len(claim['pieces']),'Repeated component occurrence')
        edges=[e for e in c['joins'] if tuple(e['left']) in group]
        require(len(edges)==len(group)-1,'Unvalidated: ribbon region is not a disk (join cycle)')
        ends=sum(arc_counts[a[1:]] for a in group)-sum(isinstance(e['interval'][1],list) for e in edges)
        require(claim['outer_ends']==ends==2,'Unvalidated: crop is not a regular two-ended ribbon')
    orders={}
    for e in c['orders']:
        a,b=map(tuple,e['pair']);key=(a,b)
        require(key not in orders,'Duplicate local overlap');orders[key]=tuple(e['top'])
    expected_full={( (j,*a),(j,*b)):(j,*top) for j in range(m) for (a,b),top in expected_orders.items()}
    if orders!=expected_full:
        pair=next(key for key in set(orders)|set(expected_full) if orders.get(key)!=expected_full.get(key))
        raise ValueError(f'Missing/incorrect local order or overlap material: {pair}')
    events={}
    for e in c['crossings']:
        pair=tuple(map(tuple,e['pair']))
        require(pair not in events,'Duplicated local crossing');events[pair]=tuple(map(Q,e['XY']))
    expected_cross={((j,*a),(j,*b)):z for j in range(m) for (a,b),z in crossings.items()}
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
