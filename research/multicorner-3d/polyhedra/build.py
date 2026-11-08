#!/usr/bin/env python3
"""Connected paper nets and POV-Ray models of triangular regular polyhedra."""
import argparse
import base64
from collections import Counter, defaultdict
import html
import io
import itertools
import json
import math
from pathlib import Path
import shutil
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'research/output/triangular-polyhedra'
SOLIDS = ('tetrahedron', 'octahedron', 'icosahedron')
TILE_WIDTH, TILE_HEIGHT = 2 * math.sqrt(3), 6


def add(a, b): return [x + y for x, y in zip(a, b)]
def sub(a, b): return [x - y for x, y in zip(a, b)]
def mul(a, k): return [x * k for x in a]
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def length(a): return math.sqrt(dot(a, a))
def cross(a, b):
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
def near(a, b): return length(sub(a, b)) < 1e-8
def pov(v): return '<' + ','.join(f'{x:.12g}' for x in v) + '>'
def rotate(q, angle):
    c, s = math.cos(angle), math.sin(angle)
    return [c*q[0]-s*q[1], s*q[0]+c*q[1]]


def solid_geometry(name):
    """Unit-edge, centered vertices, outward faces, and a workshop-friendly fold tree."""
    if name == 'tetrahedron':
        vertices = dict(zip('ABCD', ([1,1,1], [1,-1,-1], [-1,1,-1], [-1,-1,1])))
        vertices = {k: mul(q, 1/(2*math.sqrt(2))) for k,q in vertices.items()}
        faces = {f'F{i+1}': list(f) for i,f in enumerate(itertools.combinations(vertices, 3))}
        parents = {f: 'F1' for f in list(faces)[1:]}
    elif name == 'octahedron':
        r = 1/math.sqrt(2)
        vertices = {'N': [0,0,r], 'S': [0,0,-r]}
        vertices.update({f'E{i}': [r*math.cos(i*math.pi/2), r*math.sin(i*math.pi/2), 0] for i in range(4)})
        faces = {}
        for i in range(4):
            faces[f'T{i}'] = ['N', f'E{i}', f'E{(i+1)%4}']
            faces[f'D{i}'] = ['S', f'E{i}', f'E{(i+1)%4}']
        parents = {f'T{i}': f'T{i-1}' for i in range(1,4)}
        parents.update({f'D{i}': f'T{i}' for i in range(4)})
    elif name == 'icosahedron':
        r = 1/(2*math.sin(math.pi/5))
        z = math.sqrt(1-(2*r*math.sin(math.pi/10))**2)/2
        pole = z + math.sqrt(1-r*r)
        vertices = {'N': [0,0,pole], 'S': [0,0,-pole]}
        for i in range(5):
            for ring,angle,height in [('U', i*2*math.pi/5, z), ('L', (i+.5)*2*math.pi/5, -z)]:
                vertices[f'{ring}{i}'] = [r*math.cos(angle), r*math.sin(angle), height]
        faces = {}
        for i in range(5):
            j = (i+1)%5
            faces[f'B{i}'] = [f'U{i}', f'U{j}', f'L{i}']
            faces[f'C{i}'] = [f'U{j}', f'L{i}', f'L{j}']
            faces[f'T{i}'] = ['N', f'U{i}', f'U{j}']
            faces[f'D{i}'] = ['S', f'L{i}', f'L{j}']
        parents = {f'C{i}': f'B{i}' for i in range(5)}
        parents.update({f'B{i}': f'C{i-1}' for i in range(1,5)})
        parents.update({f'T{i}': f'B{i}' for i in range(5)})
        parents.update({f'D{i}': f'C{i}' for i in range(5)})
    else:
        raise ValueError('Unknown solid: ' + name)
    for face in faces.values():
        a,b,c = (vertices[v] for v in face)
        if dot(cross(sub(b,a), sub(c,a)), add(add(a,b),c)) < 0:
            face.reverse()
    return vertices, faces, parents


def recipe(solid, weave, offset=(3,0), edge_mm=40, center='sixfold'):
    if weave not in ('madweave','hexweave'):
        raise ValueError('Unknown weave')
    if len(offset) != 2 or any(type(k) is not int for k in offset) or offset == (0,0) or list(offset) == [0,0]:
        raise ValueError('Offset must be a nonzero integer lattice pair')
    if not math.isfinite(edge_mm) or edge_mm <= 0:
        raise ValueError('Edge length must be positive and finite')
    if center not in ('sixfold','threefold'):
        raise ValueError('Unknown center family')
    if center == 'threefold' and solid != 'octahedron':
        raise ValueError('Threefold centers support the octahedron in this construction; use sixfold for tetrahedron/icosahedron')
    vertices, faces, parents = solid_geometry(solid)
    root = next(f for f in faces if f not in parents)
    positions = {root: dict(zip(faces[root], [(0,0),(1,0),(0,1)]))}
    while len(positions) < len(faces):
        before = len(positions)
        for child,parent in parents.items():
            if child in positions or parent not in positions:
                continue
            common = set(faces[child]) & set(faces[parent])
            assert len(common) == 2
            a,b = sorted(common)
            old = next(v for v in faces[parent] if v not in common)
            new = next(v for v in faces[child] if v not in common)
            coord = positions[parent]
            other = tuple(sub(add(coord[a],coord[b]),coord[old]))
            positions[child] = {a:coord[a], b:coord[b], new:other}
        if len(positions) == before:
            raise ValueError('Disconnected fold tree')
    m,n = offset
    v = [math.sqrt(3)*(2*m+n), 3*n]
    w = rotate(v, math.pi/3)
    side = length(v)
    origin = ([0,0] if center == 'sixfold' else
              ([1/math.sqrt(3),1] if weave=='madweave' else [math.sqrt(3),1]))
    panels = []
    for fid,names in faces.items():
        coords = [positions[fid][vtx] for vtx in names]
        ref = [add(origin,add(mul(v,i),mul(w,j))) for i,j in coords]
        panels.append(dict(id=fid, sheet='S0', vertices=names, lattice=coords,
                           ref=ref, xyz=[mul(vertices[k], side) for k in names]))
    uses = defaultdict(list)
    for panel in panels:
        for i in range(3):
            j = (i+1)%3
            va,vb = panel['vertices'][i], panel['vertices'][j]
            uses[tuple(sorted((va,vb)))].append((panel['id'], i if va<vb else j, j if va<vb else i))
    joins = []
    fold_count = tape_count = 0
    for edge,sides in sorted(uses.items()):
        assert len(sides) == 2
        a,b = sides
        retained = parents.get(a[0]) == b[0] or parents.get(b[0]) == a[0]
        if retained:
            fold_count += 1
            jid = f'F{fold_count:02}'
        else:
            tape_count += 1
            jid = f'S{tape_count:02}'
        joins.append(dict(id=jid, kind='fold' if retained else 'tape', vertices=list(edge), a=list(a), b=list(b)))
    corners = Counter(v for face in faces.values() for v in face)
    return dict(recipe=solid, weave=weave, center=center, offset=list(offset),
                edge_mm=edge_mm, side=side, mm_per_pitch=edge_mm/side,
                panels=panels, joins=joins, corners=[dict(id=v, faces=count, beta=count*60) for v,count in corners.items()],
                pattern=dict(source='madweave.js', C=1 if weave=='madweave' else 0, hand=False, alternate=False,
                             showC=[True,True,True] if weave=='madweave' else [False,True,False],
                             showD=[True,True,True], pitch=1, width=.75, ink='#75aeb8',
                             opening=('small hexagon' if weave=='madweave' else
                                      ('large hexagon' if center=='sixfold' else 'triangle -y')),
                             origin=origin, opening_lattice_basis=[[2*math.sqrt(3),0],[math.sqrt(3),3]],
                             tile=[0,0,TILE_WIDTH,TILE_HEIGHT]))


def check(model):
    """Check closed solid, isometric unfolding, one simple net, and pattern symmetries."""
    panels = {p['id']:p for p in model['panels']}
    edge_uses = defaultdict(list)
    cells, point_names = set(), {}
    for p in panels.values():
        if len(p['vertices']) != 3 or len(p['ref']) != 3:
            raise ValueError('Expected triangular faces')
        for i,j in [(0,1),(1,2),(2,0)]:
            if abs(length(sub(p['ref'][i],p['ref'][j]))-model['side']) > 1e-8:
                raise ValueError('Irregular paper triangle')
            if abs(length(sub(p['xyz'][i],p['xyz'][j]))-model['side']) > 1e-8:
                raise ValueError('Stretched solid face')
            edge_uses[tuple(sorted((p['vertices'][i],p['vertices'][j])))].append((p['vertices'][i],p['vertices'][j]))
        cell = tuple(sorted(tuple(q) for q in p['lattice']))
        if cell in cells:
            raise ValueError('Overlapping net triangles')
        cells.add(cell)
        for coord,ref,name in zip(p['lattice'],p['ref'],p['vertices']):
            # All unfolded triangles must be cells of the same unit triangular tiling.
            if any(type(k) is not int for k in coord):
                raise ValueError('Noninteger lattice coordinate')
            m,n = model['offset']
            v = [math.sqrt(3)*(2*m+n),3*n]
            expected = add(model['pattern']['origin'],add(mul(v,coord[0]),mul(rotate(v,math.pi/3),coord[1])))
            if not near(ref,expected):
                raise ValueError('Inconsistent net lattice mapping')
            q = tuple(coord)
            if q in point_names and point_names[q] != name:
                raise ValueError('Unintended contact between net vertices')
            point_names[q] = name
            normals = ([0,1],[-math.sqrt(3)/2,-.5],[math.sqrt(3)/2,-.5])
            k = [round(dot(nn,ref)) for nn in normals]
            if any(abs(dot(nn,ref)-kk)>1e-8 for nn,kk in zip(normals,k)):
                raise ValueError('Corner not at a pattern opening')
            if model['center']=='sixfold' and any(kk%3 for kk in k):
                raise ValueError('Corner not at the selected sixfold opening')
            residues = [1,2,0] if model['weave']=='madweave' else [1,1,1]
            if model['center']=='threefold' and [kk%3 for kk in k] != residues:
                raise ValueError('Corner not at the selected threefold opening')
    if any(len(v)!=2 or v[0]!=tuple(reversed(v[1])) for v in edge_uses.values()):
        raise ValueError('Not a closed oriented manifold')
    vertex_names = {v for p in panels.values() for v in p['vertices']}
    if len(vertex_names)-len(edge_uses)+len(panels) != 2:
        raise ValueError('Expected sphere Euler characteristic')
    actual_counts = Counter(v for p in panels.values() for v in p['vertices'])
    for c in model['corners']:
        if c['beta'] != actual_counts[c['id']]*60:
            raise ValueError('Incorrect corner angle')
    retained, adjacency, used = set(), {p:set() for p in panels}, set()
    registrations, angles = [], []
    for join in model['joins']:
        fa,i,j = join['a']; fb,k,l = join['b']
        a,b = panels[fa],panels[fb]
        if not near(a['xyz'][i],b['xyz'][k]) or not near(a['xyz'][j],b['xyz'][l]):
            raise ValueError('Unclosed assembled join')
        for fid,u,vv in [(fa,i,j),(fb,k,l)]:
            half = (fid,tuple(sorted((u,vv))))
            if half in used:
                raise ValueError('Multiply used face edge')
            used.add(half)
        u,other = sub(a['ref'][j],a['ref'][i]),sub(b['ref'][l],b['ref'][k])
        angle = math.atan2(u[0]*other[1]-u[1]*other[0],dot(u,other))
        steps = round(angle/(math.pi/3))
        if abs(angle-steps*math.pi/3)>1e-8 or (model['center']=='threefold' and steps%2):
            raise ValueError('Join does not use the selected opening symmetry')
        shift = sub(b['ref'][k],rotate(a['ref'][i],angle))
        origin = model['pattern']['origin']
        lattice_shift = sub(shift,sub(origin,rotate(origin,angle)))
        if any(abs(dot(nn,lattice_shift)/3-round(dot(nn,lattice_shift)/3))>1e-8 for nn in normals):
            raise ValueError('Join translation changes pattern phase')
        registrations.append(dict(id=join['id'], rotation_degrees=steps*60, translation=shift))
        if join['kind']=='fold':
            if not near(a['ref'][i],b['ref'][k]) or not near(a['ref'][j],b['ref'][l]):
                raise ValueError('Disconnected retained fold')
            adjacency[fa].add(fb); adjacency[fb].add(fa)
            retained.update([(fa,tuple(sorted((i,j)))),(fb,tuple(sorted((k,l))))])
        na = cross(sub(a['xyz'][1],a['xyz'][0]),sub(a['xyz'][2],a['xyz'][0]))
        nb = cross(sub(b['xyz'][1],b['xyz'][0]),sub(b['xyz'][2],b['xyz'][0]))
        angles.append(math.degrees(math.acos(max(-1,min(1,-dot(na,nb)/length(na)/length(nb))))))
    if len(used) != len(panels)*3:
        raise ValueError('Missing face edge pairing')
    todo, reached = [next(iter(panels))], set()
    while todo:
        f = todo.pop()
        if f not in reached:
            reached.add(f); todo.extend(adjacency[f]-reached)
    if len(reached)!=len(panels) or len(retained)//2 != len(panels)-1:
        raise ValueError('Expected one connected tree of retained folds')
    boundary = defaultdict(list)
    count = 0
    for p in panels.values():
        for i in range(3):
            j = (i+1)%3
            if (p['id'],tuple(sorted((i,j)))) in retained:
                continue
            a,b = tuple(p['lattice'][i]),tuple(p['lattice'][j])
            boundary[a].append(b); boundary[b].append(a); count += 1
    if any(len(v)!=2 for v in boundary.values()):
        raise ValueError('Cut boundary is not a simple loop')
    todo, seen = [next(iter(boundary))], set()
    while todo:
        q = todo.pop()
        if q not in seen:
            seen.add(q); todo.extend(boundary[q])
    if len(seen)!=len(boundary):
        raise ValueError('More than one cut boundary')
    return dict(vertices=len(vertex_names), edges=len(edge_uses), faces=len(panels),
                euler_characteristic=2, paper_components=1, cut_boundary_loops=1,
                cut_boundary_segments=count, overlapping_triangles=0,
                folds=len(retained)//2, tape_pairs=len(model['joins'])-len(retained)//2,
                interior_dihedral_degrees=sum(angles)/len(angles),
                corners=model['corners'], pattern_registrations=registrations)


def net_svg(model, tile_png):
    """Rotate the entire printed sheet for page fit, keeping weave/face offset intact."""
    edge_angle = math.atan2(3*model['offset'][1], math.sqrt(3)*(2*model['offset'][0]+model['offset'][1]))
    def bounds(angle):
        points = [rotate(q,-angle) for p in model['panels'] for q in p['ref']]
        return min(q[0] for q in points), max(q[0] for q in points), min(q[1] for q in points), max(q[1] for q in points)
    choices = [(edge_angle+i*math.pi/6,bounds(edge_angle+i*math.pi/6)) for i in range(12)]
    # The icosahedron's repeated belt runs along a different edge from the root's.
    # Fit the whole sheet, rather than assuming that root edge is horizontal.
    angle,(left,right,low,high) = min(choices,key=lambda item:
        ((item[1][1]-item[1][0]) < (item[1][3]-item[1][2])-1e-8,
         round((item[1][1]-item[1][0])*(item[1][3]-item[1][2]),8),
         round(item[1][3]-item[1][2],8),choices.index(item)))
    mm = model['mm_per_pitch']
    margin = 4/mm
    left -= margin; right += margin; low -= margin; high += margin
    width,height = right-left,high-low
    if width*mm > 259 or height*mm > 166:
        raise ValueError('Net exceeds one A4/Letter landscape page at this edge length; reduce --edge-mm')
    raster, crop = paper_raster(model,tile_png)
    encoded = base64.b64encode(raster).decode()
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*mm:.6f}mm" height="{height*mm:.6f}mm" viewBox="{left} {-high} {width} {height}" role="img">',
         f'<title>{model["weave"]} {model["recipe"]}, offset {model["offset"]}</title>',
         f'<rect x="{left}" y="{-high}" width="{width}" height="{height}" fill="white"/>', '<defs>',
         '<clipPath id="paper">'+''.join('<polygon points="'+' '.join(f'{x:.10g},{y:.10g}' for x,y in p['ref'])+'"/>' for p in model['panels'])+'</clipPath>', '</defs>',
         f'<g transform="scale(1,-1) rotate({-math.degrees(angle)})">']
    def poly(q): return ' '.join(f'{x:.10g},{y:.10g}' for x,y in q)
    s.append(f'<image x="{crop[0]}" y="{crop[1]}" width="{crop[2]-crop[0]}" height="{crop[3]-crop[1]}" preserveAspectRatio="none" clip-path="url(#paper)" href="data:image/png;base64,{encoded}"/>')
    panels = {p['id']:p for p in model['panels']}
    for join in model['joins']:
        sides = [join['a']] if join['kind']=='fold' else [join['a'],join['b']]
        for fid,i,j in sides:
            panel = panels[fid]
            a,b = panel['ref'][i],panel['ref'][j]
            is_fold = join['kind']=='fold'
            dash = f' stroke-dasharray="{2/mm} {1.1/mm}"' if is_fold else ''
            s.append(f'<path d="M {poly([a])} L {poly([b])}" fill="none" stroke="{"#b52c27" if is_fold else "#202020"}" stroke-width="{.24/mm}"{dash}/>')
            if not is_fold:
                mid = mul(add(a,b),.5)
                center = mul(add(add(panel['ref'][0],panel['ref'][1]),panel['ref'][2]),1/3)
                inset = sub(center,mid)
                pos = add(mid,mul(inset,2.8/mm/length(inset)))
                s.append(label_svg(join['id'],pos,angle,2.7/mm))
    for p in model['panels']:
        center = mul(add(add(p['ref'][0],p['ref'][1]),p['ref'][2]),1/3)
        s.append(label_svg(p['id'],center,angle,2.5/mm))
    s.append('</g></svg>')
    return '\n'.join(s)+'\n', dict(width_mm=width*mm,height_mm=height*mm,page_rotation_degrees=-math.degrees(angle))


def paper_raster(model,tile_png):
    """One image for the entire paper domain, avoiding PDF bitmap-pattern tessellation."""
    points = [q for p in model['panels'] for q in p['ref']]
    x0,y0 = min(q[0] for q in points), min(q[1] for q in points)
    x1,y1 = max(q[0] for q in points), max(q[1] for q in points)
    tile = Image.open(io.BytesIO(tile_png)).convert('RGB')
    start_x,start_y = math.floor(x0/TILE_WIDTH)*TILE_WIDTH, math.floor(y0/TILE_HEIGHT)*TILE_HEIGHT
    nx,ny = math.ceil((x1-start_x)/TILE_WIDTH)+1,math.ceil((y1-start_y)/TILE_HEIGHT)+1
    repeated = Image.new('RGB',(nx*tile.width,ny*tile.height))
    for i,j in itertools.product(range(nx),range(ny)):
        repeated.paste(tile,(i*tile.width,j*tile.height))
    size = (math.ceil((x1-x0)*64),math.ceil((y1-y0)*64))
    # Keep the exact geometric tile periods; rounding each tile width accumulates phase error.
    sx,sy = tile.width/TILE_WIDTH, tile.height/TILE_HEIGHT
    coefficients = (sx*(x1-x0)/size[0],0,(x0-start_x)*sx,
                    0,sy*(y1-y0)/size[1],(y0-start_y)*sy)
    image = repeated.transform(size,Image.Transform.AFFINE,coefficients,Image.Resampling.BICUBIC)
    buffer = io.BytesIO(); image.save(buffer,format='PNG')
    return buffer.getvalue(),[x0,y0,x1,y1]


def label_svg(text, pos, angle, size):
    # Counter-rotate annotation only; printed pattern rotates with the whole net.
    return (f'<text transform="translate({pos[0]},{pos[1]}) rotate({math.degrees(angle)}) scale(1,-1)" '
            f'font-family="sans-serif" font-size="{size}" text-anchor="middle" dominant-baseline="middle" '
            f'fill="#171717" stroke="white" stroke-width="{size*.2}" paint-order="stroke">{html.escape(text)}</text>')


def scene(model):
    size = max(length(p) for panel in model['panels'] for p in panel['xyz'])
    s = ['#version 3.7;', 'global_settings { assumed_gamma 1 }',
         'background { color rgb 1 }',
         f'camera {{ orthographic location {pov([size*3,size*2,size*2.5])} look_at 0 sky z right x*{size*2.7} up y*{size*2.7} }}',
         f'light_source {{ {pov([-size*3,-size*4,size*6])} color rgb .8 }}',
         f'light_source {{ {pov([size*4,size*2,size])} color rgb .4 }}',
         '#declare Paper = texture { uv_mapping pigment { image_map { png "pattern.png" gamma 2.2 interpolate 2 } } finish { ambient .2 diffuse .8 } };']
    for p in model['panels']:
        uv = [[q[0]/TILE_WIDTH,1-q[1]/TILE_HEIGHT] for q in p['ref']]
        s.append(f'// {p["id"]}: original paper coordinates, repeated periodic tile')
        s.append('mesh2 { vertex_vectors { 3, '+','.join(map(pov,p['xyz']))+
                 ' } uv_vectors { 3, '+','.join(map(pov,uv))+
                 ' } face_indices { 1, <0,1,2> } texture { Paper } double_illuminate }')
    return '\n'.join(s)+'\n'


def print_page(model, report):
    title = f'{model["weave"].title()} {model["recipe"]}'
    m,n = model['offset']
    return f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>{title}</title>
<style>@page{{size:Letter landscape;margin:10mm}}*{{box-sizing:border-box}}body{{margin:0;font:10pt system-ui;color:#161616}}h1{{font-size:17pt;margin:0 0 2mm}}p{{margin:1.5mm 0}}.net{{display:block;margin:2mm auto}}.scale{{width:40mm;border-top:.3mm solid black;margin-top:2mm}}</style>
<h1>{title} · offset ({m},{n}) · {model['center']} centers</h1>
<p>Edge {model['edge_mm']:g} mm · {report['faces']} faces · one paper piece · {report['folds']} folds · {report['tape_pairs']} tape pairs</p>
<img class="net" style="width:{report['print']['width_mm']:.6f}mm;height:{report['print']['height_mm']:.6f}mm" src="net.svg" alt="Connected patterned net with dashed folds and paired seam labels">
<p>Cut the solid outside outline. Score and fold dashed red lines away from the patterned side. Tape matching S labels together from inside; keep the final seam accessible. No tabs to cut.</p>
<p>Print at 100% / actual size. The line below must measure 40 mm. Interior dihedral: {report['interior_dihedral_degrees']:.2f}°. Pattern opening: {model['pattern']['opening']}.</p>
<div class="scale"></div></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--solid', choices=SOLIDS, action='append')
    parser.add_argument('--weave', choices=('madweave','hexweave'), action='append')
    parser.add_argument('--offset', type=int, nargs=2, action='append', metavar=('M','N'))
    parser.add_argument('--center', choices=('sixfold','threefold'), help='Default: both applicable families')
    parser.add_argument('--edge-mm', type=float, default=40)
    parser.add_argument('--render', action='store_true')
    parser.add_argument('--povray', default='/usr/bin/povray')
    parser.add_argument('--size', type=int, default=700)
    args = parser.parse_args()
    solids = args.solid or (['octahedron'] if args.center=='threefold' else SOLIDS)
    cases = []
    for solid,weave,offset,center in itertools.product(solids,args.weave or ['madweave','hexweave'],args.offset or [(3,0),(2,1)],
                                                      [args.center] if args.center else ['sixfold','threefold']):
        if center=='threefold' and solid!='octahedron' and not args.center:
            continue
        model = recipe(solid,weave,tuple(offset),args.edge_mm,center)
        report = check(model)
        folder = f'{solid}-{weave}-{offset[0]}-{offset[1]}-{center}'
        target = OUT/folder
        target.mkdir(parents=True,exist_ok=True)
        svg, dimensions = net_svg(model,(OUT/'patterns'/f'{weave}.png').read_bytes())
        report['print'] = dimensions
        (target/'net.svg').write_text(svg)
        (target/'solid.pov').write_text(scene(model))
        (target/'construction.json').write_text(json.dumps(model,indent=2)+'\n')
        (target/'checks.json').write_text(json.dumps(report,indent=2)+'\n')
        (target/'print.html').write_text(print_page(model,report))
        shutil.copyfile(OUT/'patterns'/f'{weave}.png',target/'pattern.png')
        if args.render:
            with (target/'render.log').open('w') as log:
                subprocess.run([args.povray,'+Isolid.pov','+Oassembled.png',f'+W{args.size}',f'+H{args.size}',
                                '-D','+A0.15','+AM2','+R2'],cwd=target,stdout=log,stderr=subprocess.STDOUT,check=True)
        cases.append(dict(id=folder,solid=solid,weave=weave,offset=list(offset),center=center,
                          faces=report['faces'],folds=report['folds'],tape_pairs=report['tape_pairs'],print=dimensions))
        print(folder, ':', report['faces'],'faces,',report['folds'],'folds,',report['tape_pairs'],'tape pairs',flush=True)
    (OUT/'cases.json').write_text(json.dumps(cases,indent=2)+'\n')
    cards = []
    for c in cases:
        fid = c['id']
        assembled = (f'<img src="{fid}/assembled.png" alt="POV-Ray assembled view">'
                     if (OUT/fid/'assembled.png').is_file() else '')
        cards.append(f'''<article><h2>{c['solid'].title()} · {c['weave']} · {c['offset']} · {c['center']}</h2>
<div class="views"><a href="{fid}/print.html"><img src="{fid}/net.svg" alt="Printable net"></a>
{assembled}</div>
<p><a href="{fid}/net.pdf">Print PDF</a> · <a href="{fid}/net.svg">SVG</a> · <a href="{fid}/print.html">Print page</a> · <a href="{fid}/solid.pov">POV-Ray</a> · <a href="{fid}/construction.json">Construction</a></p></article>''')
    (OUT/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Triangular polyhedra in madweave and hexweave</title><style>body{font:17px system-ui;max-width:1200px;margin:2rem auto;padding:0 1rem;color:#172e36}h2{font-size:1.2rem}article{margin:2rem 0;border-top:1px solid #ccc}.views{display:grid;grid-template-columns:3fr 2fr;align-items:center;gap:1rem}img{width:100%;height:auto}a{color:#075d70}@media(max-width:600px){.views{grid-template-columns:1fr}}</style><h1>Printed paper polyhedra</h1><p>One-piece nets for the tetrahedron, octahedron and icosahedron, with madweave and open hexweave from the existing pattern engine. Compare aligned and skew lattice offsets. Cut the outline, fold the dashed lines, tape matching S labels inside.</p><p><a href="all-nets.pdf">Download all nets as one PDF</a>. Print at actual size; each page includes a 40 mm scale check. Each model has 40 mm edges by default. Strips are printed artwork on paper.</p>'''+''.join(cards)+'</html>')
    print(OUT/'index.html')


if __name__ == '__main__':
    main()
