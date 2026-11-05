#!/usr/bin/env python3
"""Stage 1 reference mathematics only: no renderer, UI, application state or SVG.

Exact rational half-plane geometry in X=sqrt(3)*x/P, Y=y/P. Circular decisions
compare rational squared distances. Radial ports use u=sqrt(3)*r/P. Outputs are
research certificates, not physical construction or diagram-release approval.
"""
from fractions import Fraction as F
from collections import Counter
from itertools import combinations, product
from pathlib import Path
import json
import hashlib
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'research/output/single-corner-stage1'
W = F(3, 4)
NORMALS = [(F(0), F(1)), (F(-1, 2), F(-1, 2)), (F(1, 2), F(-1, 2))]


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def norm2(p):
    return p[0]**2/3 + p[1]**2


def rotate_label(d, q, steps):
    """Rotation in 60-degree steps about selected center; q=s-k[d]."""
    for _ in range(steps % 6):
        d, q = (d+2) % 3, 5-q
    return d, q


def cls(d, s, C):
    return (s + C*(3-d)) % 3


def color(pattern, d, s, C):
    s0 = s + C*(3-d)
    c, n = s0 % 3, s0 // 3
    return [d, c, d+c, n, c+n][pattern] % 3


def above(a, d, b, e, C, H, X):
    assert d != e
    dd = (d-e) % 3
    ds = ((-1 if dd == 1 else 1)*(a-b)) % 3
    result = ds == (0 if C else 1)
    if (dd == 1) == bool(X):
        result = not result
    if H and cls(d, a, C) == cls(e, b, C):
        result = not result
    return result


def clip(poly, normal, bound):
    out = []
    for p, q in zip(poly, poly[1:]+poly[:1]):
        a, b = dot(normal, p)-bound, dot(normal, q)-bound
        if a <= 0:
            out.append(p)
        if (a < 0 < b) or (b < 0 < a):
            t = a/(a-b)
            out.append(tuple(p[i]+t*(q[i]-p[i]) for i in range(2)))
    return list(dict.fromkeys(out))


def area2(poly):
    return abs(sum(p[0]*q[1]-p[1]*q[0] for p, q in zip(poly, poly[1:]+poly[:1])))


def min_norm2(poly):
    values = [norm2(p) for p in poly]
    # Origin is outside every material polygon here (certified center hole).
    for p, q in zip(poly, poly[1:]+poly[:1]):
        v = (q[0]-p[0], q[1]-p[1])
        if norm2(v):
            t = max(F(0), min(F(1), -(p[0]*v[0]/3+p[1]*v[1])/norm2(v)))
            values.append(norm2((p[0]+t*v[0], p[1]+t*v[1])))
    return min(values)


def wedge(alpha):
    return [((F(0), F(-1)), F(0)),
            ((F(-1), F(-1 if alpha == 120 else 1)), F(0))]


def polygon(bands, alpha, R, width=W):
    poly = [(F(-2*R), F(-R)), (F(2*R), F(-R)), (F(2*R), F(R)), (F(-2*R), F(R))]
    for n, b in wedge(alpha):
        poly = clip(poly, n, b)
    for d, q in bands:
        b = F(q)-F(5, 2)
        poly = clip(poly, NORMALS[d], b+width/2)
        poly = clip(poly, tuple(-x for x in NORMALS[d]), -b+width/2)
    return poly


def positive_material(bands, alpha, R, width=W):
    poly = polygon(bands, alpha, R, width)
    return bool(len(poly) >= 3 and area2(poly) and min_norm2(poly) < R*R)


def port(d, q, ray, R, width=W):
    # n[d].ray = sign*sqrt(3)/2; u = sqrt(3)*r.
    signs = {0: [0, -1, 1], 60: [1, -1, 0], 120: [1, 0, -1]}[ray]
    sign = signs[d]
    b = F(q)-F(5, 2)
    if not sign:
        assert abs(b) > width/2
        return None
    lo, hi = max(F(0), 2*sign*b-width), 2*sign*b+width
    if hi <= lo or lo*lo >= 3*R*R:
        return None
    upper = hi if hi*hi < 3*R*R else ('sqrt', 3*R*R, 1)
    return (lo, upper)


def compare(a, b):
    """Exact comparison of rationals and signed square roots of rationals."""
    sa = a[2] if isinstance(a, tuple) else (1 if a > 0 else -1 if a < 0 else 0)
    sb = b[2] if isinstance(b, tuple) else (1 if b > 0 else -1 if b < 0 else 0)
    if sa != sb:
        return (sa > sb)-(sa < sb)
    aa = a[1] if isinstance(a, tuple) else a*a
    bb = b[1] if isinstance(b, tuple) else b*b
    return sa*((aa > bb)-(aa < bb))


def spine(d, q, alpha, R):
    b = F(q)-F(5, 2)
    origins = [(0, b), (-3*b/2, -b/2), (3*b/2, -b/2)]
    velocities = [(F(1), F(0)), (F(-1, 2), F(1, 2)), (F(-1, 2), F(-1, 2))]
    assert b*b < R*R, 'Tangential band cap requires a different endpoint policy'
    root = 3*(R*R-b*b)
    ends = [[('sqrt', root, -1), 'outer'], [('sqrt', root, 1), 'outer']]
    o, v = origins[d], velocities[d]
    for (n, bound), name in zip(wedge(alpha), ['start', 'end']):
        a, c = dot(n, v), bound-dot(n, o)
        if a == 0:
            assert c >= 0
            continue
        value = c/a
        i = 1 if a > 0 else 0
        if compare(value, ends[i][0])*(1 if i == 0 else -1) > 0:
            ends[i] = [value, name]
    assert compare(ends[0][0], ends[1][0]) < 0
    return ends


def intersection(a, b):
    d, q = a
    e, r = b
    n, m = NORMALS[d], NORMALS[e]
    det = n[0]*m[1]-n[1]*m[0]
    u, v = F(q)-F(5, 2), F(r)-F(5, 2)
    return ((u*m[1]-n[1]*v)/det, (n[0]*v-u*m[0])/det)


def parameter(d, p):
    return [p[0], (-p[0]+3*p[1])/2, (-p[0]-3*p[1])/2][d]


def fixture(name, alpha, m, k, C, H, X, member=None, R=F(3), width=W):
    assert sum(k) == 0 and alpha in (60, 120)
    steps = alpha//60
    bands = [(d, q) for d in range(3) for q in range(-int(R)-1, int(R)+7)
             if (member is None or cls(d, q+k[d], C) == member)
             and positive_material([(d, q)], alpha, R, width)]
    endpts = {a: spine(*a, alpha, R) for a in bands}
    ports = {ray: {a: port(*a, ray, R, width) for a in bands if port(*a, ray, R, width)}
             for ray in (0, alpha)}
    partners = {a: rotate_label(*a, steps) for a in ports[0]}
    assert set(partners.values()) == set(ports[alpha]), 'Incomplete boundary membership'
    for a, b in partners.items():
        assert ports[0][a] == ports[alpha][b], 'Full-band radial intervals differ'
        assert any(e[1] == 'start' for e in endpts[a])
        assert any(e[1] == 'end' for e in endpts[b])
    # Source order on every pair of simultaneously occupied seam intervals.
    seam_comparisons = 0
    for a, b in combinations(ports[0], 2):
        if a[0] == b[0]:
            continue
        lo = max(ports[0][a][0], ports[0][b][0])
        if compare(lo, ports[0][a][1]) >= 0 or compare(lo, ports[0][b][1]) >= 0:
            continue
        aa, bb = partners[a], partners[b]
        assert above(a[1]+k[a[0]], a[0], b[1]+k[b[0]], b[0], C, H, X) == above(
            aa[1]+k[aa[0]], aa[0], bb[1]+k[bb[0]], bb[0], C, H, X)
        seam_comparisons += 1
    triples = []
    overlaps = []
    for a, b in combinations(bands, 2):
        if a[0] != b[0] and positive_material([a, b], alpha, R, width):
            overlaps.append([a, b])
    for triple in combinations(bands, 3):
        if len({a[0] for a in triple}) != 3 or not positive_material(triple, alpha, R, width):
            continue
        wins = [sum(above(a[1]+k[a[0]], a[0], b[1]+k[b[0]], b[0], C, H, X)
                    for b in triple if a != b) for a in triple]
        assert sorted(wins) == [0, 1, 2], 'Simultaneous local cycle'
        triples.append(triple)
    nodes = [(j, *a) for j in range(m) for a in bands]
    links = {}
    joins = []
    for j in range(m):
        for a, b in partners.items():
            left, right = (j, *b), ((j+1) % m, *a)
            assert (left, 'end') not in links and (right, 'start') not in links
            links[left, 'end'] = (right, 'start')
            links[right, 'start'] = (left, 'end')
            joins.append({'boundary': (j+1) % m, 'left': left, 'right': right,
                          'radial_u_interval': ports[0][a],
                          'canonical_side_sign': (-1)**steps, 'registration_determinant': 1})
    components, visited, component_of = [], set(), {}
    for node in nodes:
        if node in visited:
            continue
        stack, component = [node], []
        while stack:
            p = stack.pop()
            if p in visited:
                continue
            visited.add(p)
            component.append(p)
            component_of[p] = len(components)
            for _, side in endpts[p[1:]]:
                if side != 'outer':
                    stack.append(links[p, side][0])
        free = [(p, i) for p in component for i, end in enumerate(endpts[p[1:]]) if end[1] == 'outer']
        assert len(free) == 2, 'Expected two outer ends under straight-spine theorem'
        components.append({'id': len(components), 'pieces': sorted(component), 'outer_ends': free})
    # Crossing centerline events, merged across identified radial boundaries.
    events, per_piece = {}, {p: [] for p in nodes}
    for j in range(m):
        for a, b in combinations(bands, 2):
            if a[0] == b[0]:
                continue
            p = intersection(a, b)
            if norm2(p) >= R*R or any(dot(n, p) > bound for n, bound in wedge(alpha)):
                continue
            na, nb = (j, *a), (j, *b)
            boundary = j if p[1] == 0 else ((j+1) % m if dot(wedge(alpha)[1][0], p) == 0 else None)
            ids = tuple(sorted([component_of[na], component_of[nb]]))
            key = ('boundary', boundary, norm2(p), ids) if boundary is not None else ('interior', j, p, ids)
            if key not in events:
                events[key] = {'id': len(events), 'location_key': key, 'positions': [], 'over': None}
            event = events[key]
            top = na if above(a[1]+k[a[0]], a[0], b[1]+k[b[0]], b[0], C, H, X) else nb
            top_component = component_of[top]
            assert event['over'] is None or event['over'] == top_component
            event['over'] = top_component
            event['positions'].append({'pair': [na, nb], 'top_occurrence': top})
            for node in (na, nb):
                per_piece[node].append((parameter(node[1], p), event['id'], node == top))
    for component in components:
        node, enter = component['outer_ends'][0]
        sequence, route, previous_exit_event = [], [], None
        while True:
            route.append({'piece': node, 'forward': enter == 0})
            ordered = sorted(per_piece[node], reverse=enter == 1)
            for index, (position, event_id, on_top) in enumerate(ordered):
                same_seam_position = (index == 0 and previous_exit_event == event_id
                                      and compare(position, endpts[node[1:]][enter][0]) == 0)
                if not same_seam_position:
                    sequence.append({'event': event_id, 'piece': node, 'on_top': on_top})
            previous_exit_event = (ordered[-1][1] if ordered and
                                   compare(ordered[-1][0], endpts[node[1:]][1-enter][0]) == 0 else None)
            exit_side = endpts[node[1:]][1-enter][1]
            if exit_side == 'outer':
                break
            node, incoming = links[node, exit_side]
            enter = next(i for i, e in enumerate(endpts[node[1:]]) if e[1] == incoming)
            assert len(route) <= len(component['pieces'])
        assert len(route) == len(component['pieces'])
        component['route'] = route
        component['crossing_sequence'] = sequence
    occurrences = Counter(e['event'] for c in components for e in c['crossing_sequence'])
    tops = Counter(e['event'] for c in components for e in c['crossing_sequence'] if e['on_top'])
    assert all(occurrences[e['id']] == 2 and tops[e['id']] == 1 for e in events.values())
    for j in range(m):
        for a, b in overlaps:
            d, q = rotate_label(*a, j*steps)
            e, r = rotate_label(*b, j*steps)
            assert above(a[1]+k[a[0]], a[0], b[1]+k[b[0]], b[0], C, H, X) == above(
                q+k[d], d, r+k[e], e, C, H, X), 'Sector order phase changed'
    colors = []
    for pattern in range(5):
        values = {}
        for j, d, q in nodes:
            e, r = rotate_label(d, q, j*steps)
            values[j, d, q] = color(pattern, e, r+k[e], C)
        conflict = next((c for c in components if len({values[p] for p in c['pieces']}) > 1), None)
        colors.append({'pattern': pattern, 'valid': conflict is None,
                       'used_colors': sorted(set(values.values())),
                       'witness': None if conflict is None else
                       [{'piece': p, 'color': values[p]} for p in conflict['pieces']]})
    return {'name': name, 'parameters': {'alpha': alpha, 'sectors': m, 'beta': alpha*m,
            'f': F(360, alpha*m), 'k': k, 'C': C, 'hand': H, 'X': X, 'member': member,
            'W_over_P': width, 'R_over_P': R},
            'summary': {'sector_pieces': len(bands), 'occurrences': len(nodes), 'joins': len(joins),
            'open_strips': len(components), 'loops': 0, 'outer_ends': 2*len(components),
            'centerline_crossings': len(events), 'positive_pair_overlaps_per_sector': len(overlaps),
            'self_crossings': sum(e['location_key'][-1][0] == e['location_key'][-1][1] for e in events.values()),
            'positive_triple_overlaps_per_sector': len(triples),
            'seam_order_comparisons_per_boundary': seam_comparisons,
            'open_strips_only': 'Validated', 'physical_constructibility': 'Unvalidated'},
            'sector_bands': [{'d': d, 'q': q, 'spine_ends': endpts[d, q]} for d, q in bands],
            'sector_pair_overlaps': overlaps, 'sector_triple_overlaps': triples,
            'joins': joins, 'components': components, 'crossings': list(events.values()), 'colors': colors}


def periodic_catalogue():
    rows = []
    # Geometry/order use residues mod 3; all five K=3 colors have period 9 in s.
    for C, H, X, k0, k1 in product(range(2), range(2), range(2), range(3), range(3)):
        k = [k0, k1, -k0-k1]
        phases = []
        for steps in (1, 2, 3):
            witness = None
            for d, e, a, b in product(range(3), repeat=4):
                if d == e:
                    continue
                dd, aa = rotate_label(d, a-k[d], steps)
                ee, bb = rotate_label(e, b-k[e], steps)
                if above(a, d, b, e, C, H, X) != above(aa+k[dd], dd, bb+k[ee], ee, C, H, X):
                    witness = {'a': [d, a], 'b': [e, b]}
                    break
            expected = steps == 2 or (k1-k0) % 3 == (2-2*C-H) % 3
            assert (witness is None) == expected
            phases.append({'degrees': steps*60, 'valid': witness is None, 'witness': witness})
        rows.append({'C': C, 'hand': H, 'X': X, 'k': k, 'phase': (k1-k0) % 3, 'rotations': phases})
    return rows


def encode(value):
    if isinstance(value, F):
        return str(value)
    raise TypeError(type(value).__name__)


def source_check():
    # Source comparison only; the geometry/joins above never read renderer masks.
    js = r'''
const fs=require('fs'),vm=require('vm'),e=vm.createContext({});
vm.runInContext(fs.readFileSync('madweave.js','utf8'),e);
const pairs=[],colors=[];
for(let C=0;C<2;C++)for(let H=0;H<2;H++)for(let X=0;X<2;X++){
 Object.assign(e,{starMadWeaveCenter:!!C,hand:!!H,alternate:!!X,colorCount:3});
 for(let d=0;d<3;d++)for(let f=d+1;f<3;f++)for(let s=0;s<12;s++)for(let t=0;t<12;t++)
  pairs.push([C,H,X,d,f,s,t,e.isCoveredBy(s,d,t,f)]);
}
for(let C=0;C<2;C++)for(let p=0;p<5;p++)for(let d=0;d<3;d++)for(let s=0;s<12;s++)
 colors.push([C,p,d,s,e.colorIndex(p,!!C,12,d*12+s)]);
console.log(JSON.stringify({pairs,colors}));
'''
    data = json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT, text=True))
    for C, H, X, d, e, a, b, expected in data['pairs']:
        assert above(a, d, b, e, C, H, X) == expected
    for C, p, d, s, expected in data['colors']:
        assert color(p, d, s, C) == expected
    # All possible simultaneous triple-band residues for 0<W/P<1.
    checks = 0
    for C, H, X, a, b, total in product(range(2), range(2), range(2), range(3), range(3), (7, 8)):
        indices = [a, b, total-a-b]
        wins = [sum(above(indices[d], d, indices[e], e, C, H, X) for e in range(3) if e != d)
                for d in range(3)]
        assert sorted(wins) == [0, 1, 2]
        checks += 1
    return {'source_pair_comparisons': len(data['pairs']), 'source_color_comparisons': len(data['colors']),
            'simultaneous_triple_residue_checks': checks}


def color_catalogue():
    rows = []
    for C, k0, k1 in product(range(2), range(9), range(9)):
        k = [k0, k1, -k0-k1]
        z = [k[d]+C*(3-d) for d in range(3)]
        for steps in range(1, 7):
            valid = []
            for pattern in range(5):
                ok = True
                for d, s in product(range(3), range(9)):
                    e, q = rotate_label(d, s-k[d], steps)
                    if color(pattern, d, s, C) != color(pattern, e, q+k[e], C):
                        ok = False
                        break
                if ok:
                    valid.append(pattern)
            if steps == 6:
                expected = list(range(5))
            elif steps % 2:
                expected = [0] if steps == 3 else []
            else:
                t = (k1-k0) % 3
                expected = ([1] if t == C else []) + ([2] if t == (C-1) % 3 else [])
                if len({a % 9 for a in z}) == 1:
                    expected += [3, 4]
            assert valid == expected
            rows.append({'C': C, 'k': k, 'degrees': steps*60, 'valid_patterns': valid})
    return rows


def negative_controls():
    # The crop example is a limitation of this certificate algorithm, not an
    # impossibility witness for the mathematical construction itself.
    assert positive_material([(2, 8)], 120, F(6))
    try:
        spine(2, 8, 120, F(6))
    except AssertionError:
        fringe = True
    else:
        raise AssertionError('Fringe material was silently ignored')
    # Same-band radial intervals alone cannot distinguish crossing partners.
    a, b = (1, 2), (2, 3)
    assert port(*a, 0, F(3)) == port(*b, 0, F(3))
    assert rotate_label(*a, 2) != rotate_label(*b, 2)
    # Their registered tangent families differ, so swapping partners is invalid.
    assert rotate_label(*a, 2)[0] != rotate_label(*b, 2)[0]
    return {'fringe_material_detected': fringe,
            'same_interval_partner_swap_distinguished_by_direction': True}


def hole_catalogue():
    rows = []
    for C, member, z in product(range(2), range(3), (-1, 0, 1)):
        k0 = member-1-z
        k = [k0, k0+C, -2*k0-C]
        poly = [(F(-8), F(-8)), (F(8), F(-8)), (F(8), F(8)), (F(-8), F(8))]
        margins = []
        for d in range(3):
            offsets = [F(q)-F(5, 2) for q in range(-5, 11) if cls(d, q+k[d], C) == member]
            low, high = max(a for a in offsets if a < 0), min(a for a in offsets if a > 0)
            for sign, bound in [(1, high-W/2), (-1, -low-W/2)]:
                margins.append(bound)
                poly = clip(poly, tuple(sign*a for a in NORMALS[d]), bound)
        expected = (3-W)/2 if z == 0 else (1-W)/2
        assert len(poly) == (6 if z == 0 else 3) and min(margins) == expected
        rows.append({'C': C, 'member': member, 'z': z, 'k': k,
                     'center_XY_over_P': [-(2*k[1]+k[0]), k[0]],
                     'kind': 'large-hexagon' if z == 0 else 'triangle-plus' if z == 1 else 'triangle-minus',
                     'relative_vertices_XY': poly, 'clearance_over_P': expected})
    return rows


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    source = source_check()
    catalogue = periodic_catalogue()
    color_rows = color_catalogue()
    negatives = negative_controls()
    holes = hole_catalogue()
    fixtures = []
    for m, C, H, X in product((2, 3, 4), range(2), range(2), range(2)):
        fixtures.append(fixture(f'mad-origin-m{m}-C{C}-H{H}-X{X}', 120, m, [0, 0, 0], C, H, X))
    # Every geometric hole family, both C phases, all order flags. Class colors
    # on an isolated hexweave are explicitly counted as one actual color.
    for C, H, X, member, m in product(range(2), range(2), range(2), range(3), (2, 4)):
        k = [0, C, -C]
        # z is +1,0,-1 for member=2,1,0 respectively at this representative.
        kind = ['triangle-minus', 'large-hexagon', 'triangle-plus'][member]
        alpha = 60 if member == 1 else 120
        count = m*2 if alpha == 60 else m
        fixtures.append(fixture(f'hex-{kind}-C{C}-H{H}-X{X}-beta{120*m}', alpha, count, k, C, H, X,
                                member=member, R=F(7)))
    for C, H in product(range(2), repeat=2):
        t = (2-2*C-H) % 3
        fixtures.append(fixture(f'mad-sixfold-C{C}-H{H}', 60, 5, [0, t, -t], C, H, 0))
    fixtures.append(fixture('mad-origin-large-radius', 120, 4, [0, 0, 0], 0, 0, 0, R=F(7)))
    fixtures.append(fixture('mad-self-crossing-beta120', 120, 1, [0, 0, 0], 0, 0, 0))
    for member in range(3):
        fixtures.append(fixture(f'hex-C1-color-phase-member{member}', 120, 4,
                                [-1, 0, 1], 1, 0, 0, member=member, R=F(7)))
    for width, m in product((F(100, 107), F(100, 133), F(5, 9), F(1, 3)), (2, 4)):
        fixtures.append(fixture(f'mad-spacing-{width}-beta{120*m}', 120, m,
                                [0, 0, 0], 0, 0, 0, width=width))
    result = {'scope': 'Exact reference-ribbon certificates, not physical or application validation',
              'source_sha256': hashlib.sha256((ROOT/'madweave.js').read_bytes()).hexdigest(),
              'source_checks': source, 'negative_controls': negatives, 'hexweave_hole_representatives': holes,
              'periodic_order_catalogue': catalogue, 'periodic_color_catalogue': color_rows,
              'fixtures': fixtures}
    (OUT/'certificates.json').write_text(json.dumps(result, default=encode, indent=2)+'\n')
    summary = [{'name': f['name'], **f['summary'], 'colors': f['colors']} for f in fixtures]
    (OUT/'summary.json').write_text(json.dumps(summary, default=encode, indent=2)+'\n')
    compact = {'scope': result['scope'], 'source_sha256': result['source_sha256'],
               'source_checks': source, 'negative_controls': negatives,
               'fixture_count': len(fixtures), 'periodic_order_rows': len(catalogue),
               'periodic_color_rows': len(color_rows),
               'hexweave_hole_representatives': holes,
               'fixtures': [{'name': f['name'], 'parameters': f['parameters'], **f['summary'],
                             'patterns': [{'pattern': c['pattern'], 'valid': c['valid'],
                                           'distinct_colors': len(c['used_colors'])} for c in f['colors']]}
                            for f in fixtures]}
    (OUT/'compact-summary.json').write_text(json.dumps(compact, default=encode, indent=2)+'\n')
    print(json.dumps({key: value for key, value in compact.items()
                      if key not in ('fixtures', 'hexweave_hole_representatives')}, indent=2))


if __name__ == '__main__':
    main()
