import math, importlib.util
import numpy as np
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['svg.hashsalt'] = 'madweave-hat-advice'
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
# Advisory diagram and arithmetic checks only; not an application or POV-Ray model.
R=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('stage',R/'research/single-corner-stage1.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
sq=math.sqrt(3); P=1.;L=12*sq;H=6.;w=4.
A=np.array([[0.,0.],[L,0.],[L/2,sq*L/2]])
N=np.array([[0,1],[-sq/2,-.5],[sq/2,-.5]])
t=np.array([(A[(i+1)%3]-A[i])/L for i in range(3)]);o=np.array([[u[1],-u[0]] for u in t])
O=np.array([A[i]+w*o[i]-sq*w*t[i] for i in range(3)])
for i in range(3):
 j=(i+1)%3
 assert np.allclose(O[j],A[j]+w*o[i]+sq*w*t[i])
 assert np.isclose(np.linalg.norm(O[j]-O[i]),L+2*sq*w)
 k=np.rint(N@A[i]).astype(int); shift=np.rint(N@(H*o[i])).astype(int)
 assert np.allclose(N@A[i],k) and np.allclose(N@(H*o[i]),shift)
 assert all(x%3==0 for x in k) and all(x%3==0 for x in shift)
 for d in range(3):
  for s in range(-12,13):
   dd=(d+1)%3;ss=s+k[dd]-k[d]
   assert m.color(1,d,s,0)==m.color(1,dd,ss,0)
   assert m.color(1,d,s,0)==m.color(1,d,s-shift[d],0)
   for e in range(3):
    if d==e:continue
    for z in range(-3,4):
     ee=(e+1)%3;zz=z+k[ee]-k[e]
     assert m.above(s,d,z,e,0,0,0)==m.above(ss,dd,zz,ee,0,0,0)
     assert m.above(s,d,z,e,0,0,0)==m.above(s-shift[d],d,z-shift[e],e,0,0,0)
 print('site',i,'crown k',k.tolist(),'wall bottom shift',shift.tolist())
# Isometries: wall q=A_i+u*t_i+v*o_i -> (A_i+u*t_i,H-v), brim identity at z=0.
for i in range(3):
 j=(i+1)%3
 for u in [0,L/3,L]:
  for v in [0,H/2,H]:
   q=A[i]+u*t[i]+v*o[i];X=np.r_[A[i]+u*t[i],H-v]
   assert np.isclose(np.linalg.norm(q-A[i]),np.linalg.norm(X-np.r_[A[i],H]))
print('Passed: lengths, outer closure, wall metric, crown rotation and bottom translation order/class-color checks.')
print('Angles crown=240, brim=480; total interior defect=0; outer boundary turns=360.')
fig=plt.figure(figsize=(15,6)); ax=fig.add_subplot(121)
colors=['#b7d7eb','#e1c5e8','#f4dbb0'];off=np.array([L+24,0])
ax.add_patch(Polygon(A,facecolor='#d8ead0',edgecolor='black'))
ax.text(*A.mean(axis=0),'T',ha='center',fontsize=13)
for i in range(3):
 j=(i+1)%3;quad=np.array([A[i],A[j],A[j]+H*o[i],A[i]+H*o[i]])
 ax.add_patch(Polygon(quad,facecolor=colors[i],edgecolor='black'))
 ax.plot(*np.array([A[i],A[j]]).T,'--',color='#286f39',lw=2)
 ax.text(*quad.mean(axis=0),f'W{i}',ha='center')
 ax.text(*(A[i]-.6*o[i]),f'A{i}',fontsize=10)
 ax.text(*(A[i]+H*o[i]),f'B{i}',fontsize=9)
 ax.text(*(A[j]+H*o[i]),f'B{j}',fontsize=9)
 brim=np.array([A[i],A[j],O[j],O[i]])+off
 ax.add_patch(Polygon(brim,facecolor=colors[i],edgecolor='none'))
 ax.text(*brim.mean(axis=0),f'R{i}',ha='center')
 ax.text(*(A[i]+off),f'B{i}',fontsize=10)
 ax.text(*(O[i]+off),f'O{i}',fontsize=10)
ax.plot(*np.vstack([O,O[0]]).T+off[:,None],color='black');ax.plot(*np.vstack([A,A[0]]).T+off[:,None],color='black')
ax.text(*(A.mean(axis=0)+off),'cut out',ha='center');ax.set_aspect('equal');ax.autoscale_view();ax.margins(.12);ax.axis('off');ax.set_title('2D: cap sheet S0 and brim sheet S1\nSolid = cut boundary; dashed green = retained fold')
ax=fig.add_subplot(122,projection='3d');from mpl_toolkits.mplot3d.art3d import Poly3DCollection
polys=[np.c_[A,np.full(3,H)]];cs=['#d8ead0']
for i in range(3):
 j=(i+1)%3
 polys.append(np.array([np.r_[A[i],H],np.r_[A[j],H],np.r_[A[j],0],np.r_[A[i],0]]));cs.append(colors[i])
 polys.append(np.c_[np.array([A[i],A[j],O[j],O[i]]),np.zeros(4)]);cs.append(colors[i])
 ax.text(*np.r_[A[i],H+.6],f'A{i}');ax.text(*np.r_[A[i],-.6],f'B{i}');ax.text(*np.r_[O[i],0],f'O{i}')
ax.add_collection3d(Poly3DCollection(polys,facecolors=cs,edgecolors='#444',linewidths=.7,alpha=1));ax.auto_scale_xyz(O[:,0],O[:,1],[0,H]);ax.set_box_aspect((np.ptp(O[:,0]),np.ptp(O[:,1]),H));ax.view_init(elev=26,azim=-65);ax.set_axis_off();ax.set_title('3D candidate: triangular cap and flat brim\nPanel colors are labels, not the printed weave')
fig.tight_layout();fig.savefig(R/'research/multicorner-3d/hat-candidate.svg', metadata={'Date': None})
