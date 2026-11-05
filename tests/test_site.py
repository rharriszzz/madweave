import importlib.util
import hashlib
import shutil
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_site', ROOT / 'scripts/build_site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for name in ('href', 'src', 'data'):
            if name in attrs:
                self.links.append(attrs[name])


class SiteTests(unittest.TestCase):
    def test_publication_allowlist_and_internal_links(self):
        with tempfile.TemporaryDirectory() as folder:
            output = site.build(folder)
            self.assertEqual({p.name for p in output.iterdir()}, set(site.PUBLIC_FILES) | {'.nojekyll'})
            for name in site.PUBLIC_FILES:
                if not name.endswith('.html'):
                    continue
                page = Links()
                page.feed((output/name).read_text())
                for link in page.links:
                    parts = urlsplit(link)
                    if parts.scheme or parts.netloc:
                        continue
                    target = output / unquote(parts.path or name)
                    self.assertTrue(target.is_file(), (name, link))
                    if parts.fragment and target.suffix == '.html':
                        other = Links()
                        other.feed(target.read_text())
                        self.assertIn(parts.fragment, other.ids, (name, link))
            for name in ('madweave.svg', 'madweave_init.svg'):
                svg = ET.parse(output/name)
                for element in svg.iter():
                    href = element.get('{http://www.w3.org/1999/xlink}href', '')
                    if href and not href.startswith('#'):
                        self.assertTrue((output/href).is_file(), href)

    def test_published_stylesheet_is_versioned_and_editor_preview_is_level(self):
        with tempfile.TemporaryDirectory() as folder:
            output = site.build(folder)
            css = (output / 'site.css').read_bytes()
            version = hashlib.sha256(css).hexdigest()[:12]
            self.assertNotIn(b'transform:rotate(2deg)', css)
            self.assertNotIn(b'.editor-preview{transform:rotate(', css)
            for name in ('index.html', 'guide.html', 'editor.html'):
                with self.subTest(page=name):
                    html = (output / name).read_text(encoding='utf-8')
                    self.assertEqual(html.count(f'href="site.css?v={version}"'), 1)
                    self.assertNotIn('href="site.css"', html)
            # Keep editable sources simple; versioning happens at build time.
            self.assertIn('href="site.css"', (site.ROOT / 'index.html').read_text())

    def test_build_refuses_unexpected_files(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder)/'private.txt').write_text('do not publish')
            with self.assertRaises(ValueError):
                site.build(folder)

    def test_stylesheet_url_changes_when_css_content_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'source'
            source.mkdir()
            for name in site.PUBLIC_FILES:
                shutil.copyfile(site.ROOT / name, source / name)

            def stylesheet_urls(output):
                result = {}
                for name in ('index.html', 'guide.html', 'editor.html'):
                    page = Links()
                    page.feed((output / name).read_text())
                    links = [href for href in page.links if urlsplit(href).path == 'site.css']
                    self.assertEqual(len(links), 1)
                    result[name] = links[0]
                return result

            with patch.object(site, 'ROOT', source):
                before = stylesheet_urls(site.build(Path(folder) / 'before'))
                css = source / 'site.css'
                css.write_text(css.read_text() + '\n/* cache version regression */\n')
                after = stylesheet_urls(site.build(Path(folder) / 'after'))
            self.assertEqual(len(set(before.values())), 1)
            self.assertEqual(len(set(after.values())), 1)
            for name in before:
                self.assertNotEqual(before[name], after[name], name)

    def test_build_refuses_symlinked_targets(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            target = root / 'outside.txt'
            target.write_text('unchanged')
            output = root / 'public'
            output.mkdir()
            (output/'index.html').symlink_to(target)
            with self.assertRaises(ValueError):
                site.build(output)
            self.assertEqual(target.read_text(), 'unchanged')
