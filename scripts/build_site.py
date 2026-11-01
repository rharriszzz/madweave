#!/usr/bin/env python3
"""Copy the explicit public site files into dist/, without a package install."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = (
    'index.html', 'guide.html', 'editor.html', 'site.css', 'editor.js',
    'madweave.js', 'madweave.svg', 'madweave_init.svg', 'madweave_small.png',
    'cp1.png', 'cp2.png', 'cp3.png', 'cp4.png', 'cp5.png',
    'MadWeaver.html', 'madweave.html', 'HandbookOfTriaxialWeaves.html',
    'madweave.css', 'madweave_stars_tile_small.png', 'convert.txt',
)


def build(output=None):
    output = Path(output) if output is not None else ROOT / 'dist'
    if output.is_symlink() or output.resolve() == ROOT or ROOT.is_relative_to(output.resolve()):
        raise ValueError('Unsafe output directory')
    output.mkdir(parents=True, exist_ok=True)
    # Remove only known previous build files; refuse to publish unexpected contents.
    unexpected = {p.name for p in output.iterdir()} - set(PUBLIC_FILES) - {'.nojekyll'}
    if unexpected:
        raise ValueError(f'Unexpected files in output directory: {sorted(unexpected)}')
    for name in PUBLIC_FILES:
        source = ROOT / name
        if source.is_symlink() or not source.is_file():
            raise ValueError(f'Invalid publication source: {name}')
        destination = output / name
        if destination.is_symlink():
            raise ValueError(f'Symlinked publication target: {name}')
        shutil.copyfile(source, destination)
    marker = output / '.nojekyll'
    if marker.is_symlink():
        raise ValueError('Symlinked publication marker')
    marker.touch()
    return output


if __name__ == '__main__':
    result = build()
    print(f'Built {len(PUBLIC_FILES) + 1} public files in {result}')
