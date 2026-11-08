"""Geometry, rejection witnesses and registration of the actual captured print."""
import math, unittest
from PIL import Image
import build

class HatTests(unittest.TestCase):
    def test_default_and_smaller_recipe(self):
        for side in [6,12]:
            result=build.check(build.recipe(side_units=side))
            self.assertEqual(result['matched_edges'],12)
            self.assertEqual(len(result['corners']),6)
            self.assertEqual(result['paper_components'],1)
            self.assertEqual(result['cut_boundary_loops'],1)
            self.assertEqual(result['cut_boundary_segments'],15)
            self.assertEqual(result['net_overlaps'],0)

    def test_detached_brim_rejected(self):
        model=build.recipe();next(j for j in model['joins'] if j['id']=='K0')['kind']='tape'
        with self.assertRaisesRegex(ValueError,'connected paper component'):build.flat_net_check(model)

    def test_flat_overlap_rejected(self):
        model=build.recipe();brim=next(p for p in model['panels'] if p['id']=='R0');brim['ref']=[q[:] for q in model['panels'][0]['ref']]
        with self.assertRaisesRegex(ValueError,'Overlapping net panels'):build.flat_net_check(model)

    def test_unmatched_wall_rejected(self):
        model=build.recipe();next(p for p in model['panels'] if p['id']=='W0')['xyz'][2][2]=.5
        with self.assertRaisesRegex(ValueError,'Stretch|Unclosed'):build.check(model)

    def test_wrong_angle_rejected(self):
        model=build.recipe();model['corners'][0]['beta']=300
        with self.assertRaisesRegex(ValueError,'Corner angle'):build.check(model)

    def test_unregistered_dimension_rejected(self):
        with self.assertRaises(ValueError):build.recipe(height=7)

    def test_source_pattern_across_all_six_tapes(self):
        im=Image.open(build.OUT/'pattern.png').convert('RGB')
        model=build.recipe();A=model['panels'][0]['ref'];L=model['side'];H=model['height'];N=[[0,1],[-math.sqrt(3)/2,-.5],[math.sqrt(3)/2,-.5]]
        self.assertEqual(im.size,(build.PRINT_PIXELS,build.PRINT_PIXELS))
        def pixel(q):return im.getpixel((int((q[0]-build.PRINT_MIN)*50),int((q[1]-build.PRINT_MIN)*50)))
        def safe(q):
            # Skip antialiased strip/outline boundaries, not the seam itself.
            return all(abs(abs((build.dot(n,q)+2.5+.5)%1-.5)-.375)>.09 for n in N)
        samples=0;colors=set()
        for i in range(3):
            t=build.mul(build.sub(A[(i+1)%3],A[i]),1/L);o=[t[1],-t[0]]
            prev=build.mul(build.sub(A[i],A[(i-1)%3]),1/L);op=[prev[1],-prev[0]]
            for j in range(1,200):
                v=H*j/200;q=build.add(A[i],build.mul(o,v));r=build.add(A[i],build.mul(op,v))
                # Radial brim tape D_i: the old common brim ray is translated
                # by each adjacent wall's unfolding shift in the one-piece net.
                outer=model['outer'][i];ray=build.add(A[i],build.mul(build.sub(outer,A[i]),j/200))
                a=build.add(ray,build.mul(o,H));b=build.add(ray,build.mul(op,H))
                for x,y in [(q,r),(a,b)]:
                    if safe(x) and safe(y):
                        self.assertLessEqual(max(abs(c-d) for c,d in zip(pixel(x),pixel(y))),3,(i,x,y,pixel(x),pixel(y)))
                        samples+=1;colors.add(pixel(x))
        self.assertGreater(samples,100)
        self.assertGreaterEqual(len(colors),3)
        print('Actual print seam samples:',samples)

if __name__=='__main__':unittest.main()
