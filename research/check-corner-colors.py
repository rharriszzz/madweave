#!/usr/bin/env python3
"""Independent integrated-color checker; no model/producer/runtime imports.

First verifies supplied reference geometry neutrally through the independent
region checker, then checks complete actual RGBA/slot coverage against formulas
and stable component overrides. Continuity conflicts are diagnoses, not a reason
to accept incorrectly rendered assignment data. Batch mode caches geometry only.
"""
import copy,json,re,runpy,sys,math
from pathlib import Path
from functools import lru_cache
base=runpy.run_path(str(Path(__file__).with_name('check-corner-certificate.py')))
require=base['require']
def rgb(value):
 m=re.fullmatch(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)',value)
 require(m is not None,'Invalid RGB');out=tuple(map(int,m.groups()));require(max(out)<=255,'Invalid RGB range');return out
def alpha(x):require(type(x) in (int,float) and 0<=x<=1,'Invalid opacity');return x
def quantized_alpha(opacity):
 x=alpha(opacity)*1e12;n=math.floor(x)
 # Match nearest/ties-up without an addition that can round a just-below-half
 # fraction to a tie (unlike JS Math.round, floor(x+.5) has that pitfall).
 return (n+(x-n>=.5))/1e12
def rgba(color,opacity):
 a=quantized_alpha(opacity);c=rgb(color);return (*c,a) if a else (0,0,0,0)
@lru_cache(maxsize=128)
def geometry(raw):
 c=json.loads(raw);c['pattern']=None
 for piece in c['pieces']:piece['color']=0
 return base['validate'](c)
def validate(case,c):
 counts=geometry(json.dumps(c,sort_keys=True));p=c['parameters'];palette=case['palette'];opacity=case['opacity'];m=case['material']
 require(len(palette)==len(opacity)==8,'Palette coverage');[rgba(a,b) for a,b in zip(palette,opacity)]
 require(set(m)=={'pattern','overrides'},'Material fields');pattern=m['pattern'];require(pattern is None or type(pattern) is int and 0<=pattern<5,'Formula')
 owner={tuple(a):min(':'.join(map(str,b)) for b in g['pieces']) for g in c['components'] for a in g['pieces']}
 require(set(m['overrides'])<=set(owner.values()),'Unknown custom component')
 require(all(type(a) is int and 0<=a<8 for a in m['overrides'].values()),'Custom slot')
 actual={tuple(a['id']):a for a in case['colors']};require(len(actual)==len(case['colors']) and set(actual)==set(owner),'Missing/duplicated material color coverage')
 expected={}
 for key in owner:
  j,d,s=key;e,t=base['rotate'](d,s,j*(p['alpha']//60));z=t+p['k'][e]+p['C']*(3-e)
  label=0 if pattern is None else [e,z%3,e+z%3,z//3,z%3+z//3][pattern]%3
  slot=m['overrides'].get(owner[key],label);expected[key]=rgba(palette[slot],opacity[slot]);a=actual[key]
  require(a['slot']==slot and rgb(a['rgb'])==rgb(palette[slot]) and quantized_alpha(a['opacity'])==quantized_alpha(opacity[slot]),f'Wrong material color at {key}')
 conflicts=[dict(left=e['left'],right=e['right']) for e in c['joins'] if expected[tuple(e['left'])]!=expected[tuple(e['right'])]]
 return dict(geometry='Validated',counts=counts,colorStatus='Invalid' if conflicts else 'Validated',conflicts=conflicts,distinctColors=len(set(expected.values())))
if __name__=='__main__':
 try:
  data=json.load(open(sys.argv[1]))
  if 'cases' in data:result=[validate(a,data['certificates'][a['certificateId']]) for a in data['cases']]
  else:result=validate(data,data['certificate'])
  print(json.dumps(result))
 except (ValueError,KeyError,TypeError,IndexError) as error:print(json.dumps(dict(status='Invalid',witness=str(error))));sys.exit(1)
