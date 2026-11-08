"""Validate fabrication topology and registration against the captured editor print."""
import copy
import importlib.util
import itertools
import io
import math
from pathlib import Path
import unittest
from PIL import Image

spec = importlib.util.spec_from_file_location('triangular_polyhedra_build',Path(__file__).with_name('build.py'))
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def stable_pixel(im,q,tile=True):
    if tile:
        x,y = (q[0]%build.TILE_WIDTH)/build.TILE_WIDTH*im.width, (q[1]%build.TILE_HEIGHT)/build.TILE_HEIGHT*im.height
    else:
        x,y = (q[0]+12)*64, (q[1]+12)*64
    x,y = int(x),int(y)
    if not tile and not (1 <= x < im.width-1 and 1 <= y < im.height-1):
        return None
    pixels = [im.getpixel(((x+dx)%im.width,(y+dy)%im.height)) for dx,dy in itertools.product((-1,0,1),repeat=2)]
    if any(max(c[i] for c in pixels)-min(c[i] for c in pixels)>2 for i in range(3)):
        return None
    return im.getpixel((x,y))


class PolyhedraTests(unittest.TestCase):
    def test_closed_solids_and_connected_nets(self):
        for solid,counts in [('tetrahedron',(4,6,4,3,3)),('octahedron',(6,12,8,7,5)),('icosahedron',(12,30,20,19,11))]:
            for weave,offset in itertools.product(('madweave','hexweave'),[(3,0),(2,1),(1,2),(-2,1),(1,-3)]):
                with self.subTest(solid=solid,weave=weave,offset=offset):
                    result = build.check(build.recipe(solid,weave,offset))
                    self.assertEqual(tuple(result[k] for k in ['vertices','edges','faces','folds','tape_pairs']),counts)
                    self.assertEqual(result['paper_components'],1)
                    self.assertEqual(result['cut_boundary_loops'],1)
                    self.assertEqual(result['overlapping_triangles'],0)

    def test_threefold_octahedron_and_other_solid_rejection(self):
        for weave,offset in itertools.product(('madweave','hexweave'),[(3,0),(2,1),(1,2),(-2,1)]):
            report = build.check(build.recipe('octahedron',weave,offset,center='threefold'))
            self.assertTrue(all(c['beta']==240 for c in report['corners']))
            self.assertTrue(all(r['rotation_degrees']%120==0 for r in report['pattern_registrations']))
        for solid in ['tetrahedron','icosahedron']:
            with self.assertRaisesRegex(ValueError,'Threefold centers'):
                build.recipe(solid,'madweave',center='threefold')

    def test_damaged_geometry_and_pairings_rejected(self):
        model = build.recipe('icosahedron','madweave')
        damaged = copy.deepcopy(model); damaged['panels'][0]['xyz'][0][0] += .2
        with self.assertRaisesRegex(ValueError,'Stretched'):
            build.check(damaged)
        damaged = copy.deepcopy(model); damaged['joins'].pop()
        with self.assertRaisesRegex(ValueError,'Missing face edge'):
            build.check(damaged)
        damaged = copy.deepcopy(model); next(j for j in damaged['joins'] if j['kind']=='fold')['kind']='tape'
        with self.assertRaisesRegex(ValueError,'connected tree'):
            build.check(damaged)
        damaged = copy.deepcopy(model); damaged['corners'][0]['beta']=360
        with self.assertRaisesRegex(ValueError,'corner angle'):
            build.check(damaged)

    def test_invalid_offset_and_size_rejected(self):
        for offset in [(0,0),(1.2,0)]:
            with self.assertRaisesRegex(ValueError,'integer lattice pair'):
                build.recipe('tetrahedron','madweave',offset)
        for edge in [0,-10,float('nan'),float('inf')]:
            with self.assertRaisesRegex(ValueError,'positive and finite'):
                build.recipe('tetrahedron','madweave',edge_mm=edge)

    def test_actual_print_tile_repeats_original_engine(self):
        for weave in ('madweave','hexweave'):
            tile = Image.open(build.OUT/'patterns'/f'{weave}.png').convert('RGB')
            reference = Image.open(build.OUT/'patterns'/f'{weave}-reference.png').convert('RGB')
            samples, ink, white = 0,0,0
            for i,j in itertools.product(range(60),range(60)):
                q = [-9.3+i*.317,-10.2+j*.293]
                a,b = stable_pixel(tile,q),stable_pixel(reference,q,False)
                if a is not None and b is not None:
                    self.assertLessEqual(max(abs(c-d) for c,d in zip(a,b)),3,(weave,q,a,b))
                    samples += 1; white += a==(255,255,255); ink += min(a)<220
            self.assertGreater(samples,500)
            self.assertGreater(ink,100)
            self.assertGreater(white,20)
            print(weave,'periodic source-print samples:',samples)

    def test_actual_print_registration_across_all_joins(self):
        totals = {}
        for solid,weave,offset in itertools.product(build.SOLIDS,('madweave','hexweave'),[(3,0),(2,1)]):
            centers = ('sixfold','threefold') if solid=='octahedron' else ('sixfold',)
            tile = Image.open(build.OUT/'patterns'/f'{weave}.png').convert('RGB')
            for center in centers:
                model = build.recipe(solid,weave,offset,center=center)
                report = build.check(model)
                panels = {p['id']:p for p in model['panels']}
                registrations = {r['id']:r for r in report['pattern_registrations']}
                samples = 0
                for join in model['joins']:
                    r = registrations[join['id']]
                    fid,i,j = join['a']; face = panels[fid]
                    a,b = face['ref'][i],face['ref'][j]
                    tangent = build.mul(build.sub(b,a),1/model['side'])
                    normal = [-tangent[1],tangent[0]]
                    count = 0
                    for t,delta in itertools.product(range(1,100),[0,.07,-.07,.23]):
                        q = build.add(build.add(a,build.mul(build.sub(b,a),t/100)),build.mul(normal,delta))
                        other = build.add(build.rotate(q,math.radians(r['rotation_degrees'])),r['translation'])
                        x,y = stable_pixel(tile,q),stable_pixel(tile,other)
                        if x is not None and y is not None:
                            self.assertLessEqual(max(abs(c-d) for c,d in zip(x,y)),3,(solid,weave,offset,center,join['id'],q,x,y))
                            count += 1
                    self.assertGreater(count,15,join['id'])
                    samples += count
                for p in model['panels']:
                    for q in p['ref']:
                        self.assertEqual(stable_pixel(tile,q),(255,255,255),(weave,center,q))
                totals[solid,weave,tuple(offset),center] = samples
        print('Actual print join samples:',sum(totals.values()),'across',len(totals),'models')

    def test_print_raster_keeps_exact_pattern_phase(self):
        for solid,weave,center in [('icosahedron','hexweave','sixfold'),('octahedron','madweave','threefold')]:
            tile_bytes = (build.OUT/'patterns'/f'{weave}.png').read_bytes()
            tile = Image.open(io.BytesIO(tile_bytes)).convert('RGB')
            data,bounds = build.paper_raster(build.recipe(solid,weave,(2,1),center=center),tile_bytes)
            raster = Image.open(io.BytesIO(data)).convert('RGB')
            count = 0
            for i,j in itertools.product(range(1,45),repeat=2):
                q = [bounds[0]+(bounds[2]-bounds[0])*i/45,bounds[1]+(bounds[3]-bounds[1])*j/45]
                a = stable_pixel(tile,q)
                x,y = int(raster.width*i/45),int(raster.height*j/45)
                pixels = [raster.getpixel((x+dx,y+dy)) for dx,dy in itertools.product((-1,0,1),repeat=2)]
                if a is not None and all(max(c[k] for c in pixels)-min(c[k] for c in pixels)<=2 for k in range(3)):
                    self.assertLessEqual(max(abs(c-d) for c,d in zip(a,raster.getpixel((x,y)))),3)
                    count += 1
            self.assertGreater(count,500)

    def test_prints_fit_one_sheet_at_actual_size(self):
        tile = (build.OUT/'patterns/madweave.png').read_bytes()
        for solid,offset in itertools.product(build.SOLIDS,[(3,0),(2,1),(-2,1)]):
            svg,dim = build.net_svg(build.recipe(solid,'madweave',offset),tile)
            self.assertLessEqual(dim['width_mm'],259)
            self.assertLessEqual(dim['height_mm'],166)
            self.assertIn('stroke-dasharray',svg)
        with self.assertRaisesRegex(ValueError,'exceeds'):
            build.net_svg(build.recipe('icosahedron','madweave',edge_mm=100),tile)


if __name__ == '__main__':
    unittest.main()
