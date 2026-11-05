#!/usr/bin/env python3
"""Measure tree.png; prepare figures for the planning prompt, not a cone feature.

Optional forensic dependencies: numpy, scipy, Pillow, matplotlib.
Run tree-reference-render.cjs first for the historical replay and endpoint data.
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from scipy.optimize import least_squares

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'research/output/tree-forensics'
OUT.mkdir(parents=True, exist_ok=True)
image = np.asarray(Image.open(ROOT / 'tree.png').convert('RGB')).astype(float)
center = np.array([217.5, 227.5])  # Pixel-index coordinates; screen origin (218,228).
color = np.array([149, 168, 161])  # Exact gray from the historical source palette.
points = []
for y in range(275, 411):
    x = int(np.flatnonzero((image[y] == color).all(axis=1))[0])
    # The pixel immediately outside the solid-gray run is an antialiased mixture.
    background, edge = image[y, x-3], image[y, x-1]
    direction = color-background
    coverage = np.clip(np.dot(edge-background, direction) /
                       max(np.dot(direction, direction), 1e-9), 0, 1)
    points.append([x-.5-coverage, y])
points = np.asarray(points)
relative = points-center
radius = np.linalg.norm(relative, axis=1)
phi = np.arctan2(relative[:, 1], relative[:, 0])
# A line at 120 degrees in the recovered reference frame has constant normal b.
# Display rotation / angular-branch changes permute the three canonical families.
def normal_coordinate(f):
    return radius*np.sin(phi/f-2*np.pi/3)

def residual(parameters):
    f, b = parameters
    return normal_coordinate(f)-b

# Start from a scan, rather than assuming the desired fraction in the fit.
scan = np.linspace(.3, 1.8, 1501)
initial = min(scan, key=lambda f: np.var(normal_coordinate(f)))
fit = least_squares(residual, [initial, np.mean(normal_coordinate(initial))],
                    bounds=([.3, -300], [1.8, 300]))
# Also let the center move, starting from the bitmap midpoint rather than the
# recovered opening. One edge constrains its center less tightly than f.
def joint_residual(parameters):
    cx, cy, f, b = parameters
    relative = points-[cx, cy]
    r = np.linalg.norm(relative, axis=1)
    phi = np.arctan2(relative[:, 1], relative[:, 0])
    return r*np.sin(phi/f-2*np.pi/3)-b

joint = least_squares(joint_residual, [217.5, 217.5, .75, 137],
                      bounds=([190, 190, .6, 100], [240, 245, .9, 180]),
                      max_nfev=3000, ftol=1e-13, xtol=1e-13, gtol=1e-13)
candidates = []
for f in [.5, 2/3, .75, .8, 6/7, 1, 4/3, 1.5]:
    normal = normal_coordinate(f)
    candidates.append({'f': f, 'meanNormal': float(normal.mean()),
                       'rmsFromStraightLine': float(np.std(normal))})
report = {'pixelIndexOrigin': center.tolist(), 'curvePixelRows': [275, 410],
          'curvePoints': len(points), 'fittedMultiplier': float(fit.x[0]),
          'fittedLineNormal': float(fit.x[1]),
          'rmsFromStraightLine': float(np.sqrt(np.mean(fit.fun**2))),
          'jointCenterFit': {'pixelIndexOrigin': joint.x[:2].tolist(),
                             'fittedMultiplier': float(joint.x[2]),
                             'rmsFromStraightLine': float(np.sqrt(np.mean(joint.fun**2)))},
          'candidates': candidates, 'samplePoints': points[5::20].tolist(),
          'method': 'Left long edge of outer gray trunk strip; inverse angular map; fit a constant line normal.'}
assert abs(fit.x[0]-.75) < .001
assert report['rmsFromStraightLine'] < .3

caps = json.loads((OUT / 'endcaps.json').read_text())
upper = caps['upper']
assert len(upper) == 24
# Independent track count: 24 upper-half ends versus the ordinary 18 for six
# strips in each of three planar families. Do not count the incomplete bottom.
report['upperHalfCount'] = {'observedTracks': len(upper), 'ordinaryPlanarTracks': 18,
                           'paperAngleRatio': len(upper)/18,
                           'codeMultiplier': 18/len(upper)}
(OUT / 'curve-analysis.json').write_text(json.dumps(report, indent=2)+'\n')

fig, axes = plt.subplots(1, 2, figsize=(12, 7))
ax = axes[0]
ax.imshow(image.astype('uint8'))
ax.plot(*center, '+', color='red', markersize=12, markeredgewidth=2)
ax.annotate('center approx. (218, 228)', center, xytext=(235, 252), color='red',
            arrowprops={'arrowstyle': '->', 'color': 'red'})
ax.plot(points[:, 0], points[:, 1], color='blue', linewidth=2, label='measured long edge')
for i, cap in enumerate(upper, 1):
    # Endpoint geometry uses CSS pixel corners, whereas imshow uses pixel indices.
    x, y = np.array(cap['screenPoint'])-.5
    ax.plot(x, y, 'o', color='black', markersize=2)
    ax.annotate(str(i), (x, y), xytext=(3, -2), textcoords='offset points',
                color='black', fontsize=7)
ax.axhline(center[1], color='red', alpha=.35, linewidth=1)
ax.set_title('Reference: long edge, center, and 24 upper ends')
ax.set_xlim(-5, 440)
ax.set_ylim(440, -5)
ax.legend(loc='lower right', fontsize=8)
ax = axes[1]
for f in [2/3, .75, .8, 1]:
    values = normal_coordinate(f)
    ax.plot(points[:, 1], values-values.mean(), label=f'f={f:.6g}')
ax.axhline(0, color='black', linewidth=.5)
ax.set_xlabel('Row along the measured edge in tree.png')
ax.set_ylabel('Recovered line normal minus its mean (pixels)')
ax.set_title('A straight recovered edge has constant normal')
ax.legend()
fig.tight_layout()
fig.savefig(OUT / 'reference-measurements.png', dpi=160)
plt.close(fig)

comparison = json.loads((OUT / 'angle-comparison.json').read_text())
fig, axes = plt.subplots(3, 3, figsize=(12, 12))
axes.flat[0].imshow(image.astype('uint8'))
axes.flat[0].set_title('tree.png: reference')
for ax, row in zip(axes.flat[1:], comparison['results']):
    ax.imshow(Image.open(OUT / ('angle-'+row['label']+'.png')))
    ax.set_title(f"f={row['label']}; mean channel error {row['meanChannelError']:.2f}")
for ax in axes.flat:
    ax.axis('off')
fig.tight_layout()
fig.savefig(OUT / 'angle-comparison.png', dpi=120)
plt.close(fig)
print(json.dumps(report, indent=2))
