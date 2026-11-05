#!/usr/bin/env python3
"""Full-region certificate producer. Research only; no application rendering.

Uses the Stage 1 clipping construction. The separate checker does not import
this module or its geometry, pairings, or component construction.
"""
from fractions import Fraction as F
from itertools import combinations
import runpy
from pathlib import Path

g = runpy.run_path(str(Path(__file__).with_name('single-corner-stage1.py')))


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
    bands = [(d, q) for d in range(3) for q in range(-int(R)-2, int(R)+8)
             if (member is None or g['cls'](d, q+k[d], C) == member)
             and g['positive_material']([(d,q)], alpha, R, w)]
    polygons = {a:g['polygon']([a],alpha,R,w) for a in bands}
    arcs = {a:circle_arcs(polygons[a],R) for a in bands}
    ports = {ray:{a:g['port'](*a,ray,R,w) for a in bands if g['port'](*a,ray,R,w)}
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
        for a,b in combinations(bands,2):
            if a[0]==b[0]: continue
            if g['positive_material']([a,b],alpha,R,w):
                top = a if g['above'](a[1]+k[a[0]],a[0],b[1]+k[b[0]],b[0],C,H,X) else b
                orders.append({'pair':[[j,*a],[j,*b]],'top':[j,*top]})
            z = g['intersection'](a,b)
            if g['norm2'](z)<R*R and all(g['dot'](n,z)<=v for n,v in g['wedge'](alpha)):
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
        outer=sum(arcs[a[1:]] for a in group)-sum(isinstance(e['interval'][1],tuple) for e in localjoins)
        components.append({'pieces':sorted(group),'outer_ends':outer})
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
