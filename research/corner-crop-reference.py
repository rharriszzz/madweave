#!/usr/bin/env python3
"""Full-region certificate producer. Research only; no application rendering.

Uses the Stage 1 clipping construction. The separate checker does not import
this module or its geometry, pairings, or component construction.
"""
from fractions import Fraction as F
from itertools import combinations
import runpy
from pathlib import Path
from math import isqrt

g = runpy.run_path(str(Path(__file__).with_name('single-corner-stage1.py')))


def strip_ends(R,w):
    """Rational end cuts just beyond the working circle, in tangent coordinates."""
    def tangent(d):return (-g['NORMALS'][d][1],3*g['NORMALS'][d][0])
    def length(q):
        near=max(F(0),abs(F(q)-F(5,2))-w/2)
        squared=3*(R*R-near*near)*256
        k=isqrt(squared.numerator//squared.denominator)
        if k*k<squared:k+=1
        return F(k,16)+F(1,8)
    def polygon(bands,alpha):
        poly=g['polygon'](bands,alpha,R+2,w)
        for d,q in bands:
            t=tangent(d);L=length(q)
            for n in (t,tuple(-x for x in t)):poly=g['clip'](poly,n,L)
        return poly
    def port(d,q,ray):
        interval=g['port'](d,q,ray,R+2,w)
        if interval is None:return None
        direction={0:(F(1),F(0)),60:(F(1,2),F(1,2)),120:(F(-1,2),F(1,2))}[ray]
        lo,hi=interval;hi=min(hi,length(q)/abs(g['dot'](tangent(d),direction)))
        return (lo,hi) if hi>lo else None
    def ends(poly,d,q):
        t=tangent(d);L=length(q)
        return sum(any(g['dot'](t,a)==g['dot'](t,b)==sign*L for sign in (-1,1)) for a,b in zip(poly,poly[1:]+poly[:1]))
    return polygon,port,ends,tangent,length


def circle_arcs(poly, R):
    crossings = 0
    for p, q in zip(poly, poly[1:]+poly[:1]):
        v = tuple(q[i]-p[i] for i in range(2))
        a = g['norm2'](p)-R*R
        b = g['norm2'](q)-R*R
        if not a or not b:
            raise ValueError('Unvalidated: circle through polygon vertex')
        if (a < 0) != (b < 0):
            crossings += 1
        elif a > 0 and b > 0:
            t = -(p[0]*v[0]/3+p[1]*v[1])/g['norm2'](v)
            if 0 < t < 1 and g['norm2'](tuple(p[i]+t*v[i] for i in range(2))) < R*R:
                crossings += 2
    assert crossings % 2 == 0
    return crossings//2


def make(parameters, name, pattern=None):
    p = dict(parameters)
    alpha, m, R, w = p['alpha'], p['sectors'], F(p['R_over_P']), F(p['W_over_P'])
    k, C, H, X, member = p['k'], p['C'], p['hand'], p['X'], p['member']
    square=p.get('end_style')=='strip'
    if square:
        polygon,port,end_count,tangent,length=strip_ends(R,w)
        positive=lambda a:len(polygon(a,alpha))>=3 and g['area2'](polygon(a,alpha))>0
    else:
        polygon=lambda a,angle:g['polygon'](a,angle,R,w)
        port=lambda d,q,ray:g['port'](d,q,ray,R,w)
        positive=lambda a:g['positive_material'](a,alpha,R,w)
    uncached_positive=positive;overlaps={}
    def positive(a):
        key=tuple(a)
        if key not in overlaps:overlaps[key]=uncached_positive(a)
        return overlaps[key]
    bands = [(d, q) for d in range(3) for q in range(-int(R)-2, int(R)+8)
             if (member is None or g['cls'](d, q+k[d], C) == member)
             and (not square or abs(F(q)-F(5,2))<R) and positive([(d,q)])]
    polygons = {a:polygon([a],alpha) for a in bands}
    arcs = {a:end_count(polygons[a],*a) if square else circle_arcs(polygons[a],R) for a in bands}
    ports = {ray:{a:port(*a,ray) for a in bands if port(*a,ray)}
             for ray in (0,alpha)}
    pieces, joins, orders, crossings = [], [], [], []
    for j in range(m):
        for d,q in bands:
            e,s = g['rotate_label'](d,q,j*(alpha//60))
            pieces.append({'id':[j,d,q], 'vertices':polygons[d,q], 'outer_arc_fragments':arcs[d,q],
                           'color':0 if pattern is None else g['color'](pattern,e,s+k[e],C)})
        for a, interval in ports[0].items():
            b = g['rotate_label'](*a,alpha//60)
            assert ports[alpha][b] == interval
            joins.append({'left':[j,*b], 'right':[(j+1)%m,*a], 'interval':interval,
                          'side_sign':(-1)**(alpha//60), 'face':1})
            if square:
                direction=(F(1),F(0))
                joins[-1]['at_end']=interval[1]==length(a[1])/abs(g['dot'](tangent(a[0]),direction))
        for a,b in combinations(bands,2):
            if a[0]==b[0]: continue
            if positive([a,b]):
                top = a if g['above'](a[1]+k[a[0]],a[0],b[1]+k[b[0]],b[0],C,H,X) else b
                orders.append({'pair':[[j,*a],[j,*b]],'top':[j,*top]})
            z = g['intersection'](a,b)
            if (all(abs(g['dot'](tangent(d),z))<=length(q) for d,q in (a,b)) if square else g['norm2'](z)<R*R) and all(g['dot'](n,z)<=v for n,v in g['wedge'](alpha)):
                crossings.append({'pair':[[j,*a],[j,*b]],'XY':z})
    adjacency = {tuple(a['id']):set() for a in pieces}
    for join in joins:
        a,b = tuple(join['left']),tuple(join['right'])
        adjacency[a].add(b); adjacency[b].add(a)
    components, seen = [], set()
    for node in adjacency:
        if node in seen: continue
        todo, group = [node], set()
        while todo:
            a=todo.pop()
            if a in group:continue
            group.add(a);todo.extend(adjacency[a]-group)
        seen.update(group)
        localjoins=[e for e in joins if tuple(e['left']) in group]
        outer=sum(arcs[a[1:]] for a in group)-sum(e.get('at_end',False) if square else isinstance(e['interval'][1],tuple) for e in localjoins)
        components.append({'pieces':sorted(group),'outer_ends':outer})
    if square:
        target=F((9 if member is None else 3)*p['size']*p['beta'],360)
        count=(2*target.numerator+target.denominator)//(2*target.denominator)
        def rank(component):
            labels=[g['rotate_label'](d,q,j*(alpha//60)) for j,d,q in component['pieces']]
            def layer(q):return next((n for n in range(1,9) if 3-(3*n)//2<=q<=2+(3*n+1)//2),9)
            return (max(layer(q) for d,q in labels),min(abs(F(q)-F(5,2)) for d,q in labels),min(component['pieces']))
        components=sorted(components,key=rank)[:count]
        if len(components)!=count:raise ValueError('Insufficient strips for size')
        p['strip_seeds']=[min(a['pieces']) for a in components]
        keep={tuple(a) for c in components for a in c['pieces']}
        pieces=[a for a in pieces if tuple(a['id']) in keep]
        joins=[e for e in joins if tuple(e['left']) in keep]
        orders=[e for e in orders if all(tuple(a) in keep for a in e['pair'])]
        crossings=[e for e in crossings if all(tuple(a) in keep for a in e['pair'])]
    fringe=[]
    for a in bands:
        try:g['spine'](*a,alpha,R)
        except AssertionError:fringe.append(a)
    return {'version':2,'name':name,'parameters':p,'pattern':pattern,'pieces':pieces,
            'joins':joins,'components':components,'orders':orders,'crossings':crossings,
            'fringe_bands':fringe}


def encode(x):
    if isinstance(x,F):return str(x)
    raise TypeError(type(x).__name__)
