#!/usr/bin/env python3
"""Numerical examples of the documented inverse and circle chord bound.

Research checks only; this does not implement application picking or flattening.
"""
import json
import math


def run():
    tau=2*math.pi
    p=(2.75,-4.25);center=(-1.5,3.25);offset=(17,-9)
    A=((1.2,.3),(-.2,1.7));det=A[0][0]*A[1][1]-A[0][1]*A[1][0]
    worst=0;count=0
    for m,alpha in ((4,tau/3),(2,tau/3),(8,tau/6)):
        f=tau/(m*alpha)
        for phi0 in (-2.4,.73,6.4):
            for j in range(m):
                for local in (1e-7,alpha/7,alpha-1e-7):
                    for r in (.2,2.5,6):
                        angle=phi0+f*(j*alpha+local)
                        chart=(center[0]+r*math.cos(angle),center[1]+r*math.sin(angle))
                        screen=tuple(sum(A[i][q]*chart[q] for q in range(2))+offset[i] for i in range(2))
                        dx,dy=screen[0]-offset[0],screen[1]-offset[1]
                        recovered=((A[1][1]*dx-A[0][1]*dy)/det,(A[0][0]*dy-A[1][0]*dx)/det)
                        x,y=recovered[0]-center[0],recovered[1]-center[1]
                        psi=(math.atan2(y,x)-phi0)%tau
                        owner=int(psi/(f*alpha));theta=psi/f-owner*alpha
                        rr=math.hypot(x,y)
                        canonical=(p[0]+rr*math.cos(theta),p[1]+rr*math.sin(theta))
                        expected=(p[0]+r*math.cos(local),p[1]+r*math.sin(local))
                        error=math.dist(canonical,expected)
                        assert owner==j and error<1e-11
                        worst=max(worst,error);count+=1
    circles=[]
    R=6;epsilon=min(.75/1000,.25/4.2)
    for f in (.75,1.5,3,6):
        step=min(math.pi/f,math.sqrt(8*epsilon/(R*f*f)))
        sagitta=R*(1-math.cos(f*step/2))
        assert sagitta<=epsilon*(1+1e-9)
        circles.append({'R':R,'f':f,'reference_angle_step':step,'error_bound':epsilon,'sagitta':sagitta})
    return {'inverse_cases':count,'maximum_reference_coordinate_error':worst,
            'nonzero_reference_center':p,'nonzero_display_center':center,
            'display_rotations':[-2.4,.73,6.4],'screen_matrix':A,'circle_examples':circles,
            'boundary_policy':'Analytic half-open ownership; these round trips test interiors near rays, not floating-point snapping on exact rays.'}


if __name__=='__main__':print(json.dumps(run(),indent=2))
