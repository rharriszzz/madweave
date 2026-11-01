"""Exercise the actual published files, SVG UI, reload state, and export in Chromium."""
import functools
import http.server
import tempfile
import threading
import unittest
from pathlib import Path
import xml.etree.ElementTree as ET

from playwright.sync_api import sync_playwright
from test_site import site


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.folder = tempfile.TemporaryDirectory()
        cls.output = site.build(Path(cls.folder.name) / 'madweave')
        cls.server = http.server.ThreadingHTTPServer(
            ('127.0.0.1', 0), functools.partial(QuietHandler, directory=cls.folder.name))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}/madweave/'
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.folder.cleanup()

    def setUp(self):
        self.page = self.browser.new_page(viewport={'width': 1280, 'height': 950}, accept_downloads=True)
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.on('response', lambda response: self.errors.append(f'HTTP {response.status}: {response.url}') if response.status >= 400 else None)

    def tearDown(self):
        self.page.close()
        self.assertEqual(self.errors, [])

    def open_svg(self, name='madweave_init.svg'):
        self.page.goto(self.base+name)
        self.page.wait_for_selector('#strips', state='attached')

    def reload_serialized_svg(self):
        # A fresh document resets all JS globals, unlike calling setSavedContent in place.
        saved = self.page.evaluate('new XMLSerializer().serializeToString(document.documentElement)')
        self.page.route('**/restored.svg', lambda route: route.fulfill(body=saved, content_type='image/svg+xml'))
        self.page.goto(self.base+'restored.svg')
        self.page.wait_for_function('typeof processing !== "undefined" && !processing && colorIndexArray')

    def test_original_and_fresh_design_load(self):
        for name in ('madweave.svg', 'madweave_init.svg'):
            self.open_svg(name)
            self.assertEqual(self.page.locator('path[mwColorIndex]').count(), 18)
            self.assertFalse(self.page.evaluate('processing'))

    def test_every_size_pattern_color_count_and_spacing(self):
        self.open_svg()
        for size in range(1, 9):
            self.page.locator(f'#cbuttonSC{size}').click()
            self.assertEqual(self.page.locator('path[mwColorIndex]').count(), 9*size)
        for pattern in range(5):
            self.page.locator(f'#cbuttonCP{pattern}').click()
            for count in range(1, 7):
                self.page.locator(f'#cbuttonCC{count}').click()
                self.assertTrue(self.page.evaluate('colorIndexArray.every(i => i >= 0 && i < colorCount)'))
        for spacing in range(4):
            self.page.locator(f'#cbuttonSep{spacing}').click()
            self.assertEqual(self.page.evaluate('separationIndex'), spacing)
            self.assertNotIn('NaN', self.page.locator('#svg').get_attribute('viewBox'))
        self.assertFalse(self.page.evaluate('processing'))

    def test_pointer_paints_and_individual_visibility(self):
        self.open_svg()
        self.page.locator('#cbuttonC7').click()
        # Use the real selector's mouse handlers at a point inside the weave.
        box = self.page.locator('#svg').bounding_box()
        self.page.mouse.move(box['x']+box['width']*.50, box['y']+box['height']*.50)
        # The original selector requires a short dwell plus another mouse move.
        self.page.wait_for_timeout(self.page.evaluate('timestampIntervalThreshold') + 20)
        self.page.mouse.move(box['x']+box['width']*.50+1, box['y']+box['height']*.50)
        selected = self.page.evaluate('mouseStripIndex')
        self.assertGreaterEqual(selected, 0)
        self.page.mouse.down()
        self.page.mouse.up()
        self.assertEqual(self.page.evaluate(f'colorIndexArray[{selected}]'), 7)
        self.page.evaluate('setVisibleOrHidden(document.documentElement,false);setStripColorToCurrentDefault(document.documentElement,0)')
        self.assertFalse(self.page.evaluate('visibilityIndexArray[0]'))
        self.page.evaluate('setVisibleOrHidden(document.documentElement,true);setStripColorToCurrentDefault(document.documentElement,0)')
        self.assertTrue(self.page.evaluate('visibilityIndexArray[0]'))

    def test_visibility_and_orientation_controls(self):
        self.open_svg()
        for identifier, expression in [('VD0','showD[0]'),('VH1','showC[1]'),('-','hand'),('X','alternate'),('C','starMadWeaveCenter'),('Lines','showingLines')]:
            old = self.page.evaluate(expression)
            self.page.locator('[id="cbutton'+identifier+'"]').click()
            self.assertEqual(self.page.evaluate(expression), not old)
        self.assertFalse(self.page.evaluate('processing'))

    def test_saved_visibility_spacing_and_controls_survive_rebuild(self):
        # Wide spacing used to corrupt the selection threshold during initialization.
        for spacing in range(4):
            self.open_svg()
            self.page.evaluate(f'''() => {{
                const root=document.documentElement;
                setSeparation(root,{spacing});
                toggleVisibilityD(root,1);
                toggleVisibilityH(root,2);
                setDefaultColor(root,5);
                setStripColorToCurrentDefault(root,0);
                setVisibleOrHidden(root,false);
                setStripColorToCurrentDefault(root,1);
                setDefaultColor(root,5);
                showOrHideButtons(root);
            }}''')
            before = self.page.evaluate('({viewBox:document.documentElement.getAttribute("viewBox"),showD,showC,defaultColorIndex,separationIndex,stripSpacing,hidingButtons,colors:colorIndexArray.map(Number),visible:visibilityIndexArray})')
            self.reload_serialized_svg()
            after = self.page.evaluate('({viewBox:document.documentElement.getAttribute("viewBox"),showD,showC,defaultColorIndex,separationIndex,stripSpacing,hidingButtons,colors:colorIndexArray.map(Number),visible:visibilityIndexArray})')
            self.assertEqual(after, before)
            self.page.evaluate('buildStrips(document)')
            self.assertEqual(self.page.evaluate('showD'), [True,False,True])
            self.assertEqual(self.page.locator('#GP'+self.page.evaluate('name(stripsPerDirection,stripsPerDirection)')).get_attribute('visibility'), 'hidden')

    def test_palette_sliders_change_color_and_opacity(self):
        self.open_svg()
        for identifier, expression in [('HB','currentHue'),('SB','currentSat'),('VB','currentValue'),('OB','currentOpacity')]:
            before = self.page.evaluate(expression)
            self.page.locator('#cbutton'+identifier).click(position={'x': 10, 'y': 10})
            self.assertNotEqual(self.page.evaluate(expression), before)
        self.assertTrue(self.page.evaluate(r'colorArray.every(c => /^rgb\(/.test(c))'))

    def test_export_is_self_contained_static_artwork(self):
        self.page.goto(self.base+'editor.html')
        button = self.page.get_by_role('button', name='Export artwork as SVG')
        button.wait_for()
        self.page.wait_for_function('!document.getElementById("export").disabled')
        self.page.evaluate('''() => { const d=document.getElementById('weave').contentDocument; d.defaultView.setDefaultColor(d.documentElement,7); d.defaultView.setStripColorToCurrentDefault(d.documentElement,0); }''')
        with self.page.expect_download() as event:
            button.click()
        download = event.value
        path = Path(self.folder.name)/download.suggested_filename
        download.save_as(path)
        root = ET.parse(path).getroot()
        self.assertFalse(any(e.tag.endswith('script') for e in root.iter()))
        self.assertFalse(any(a.lower().startswith('on') for e in root.iter() for a in e.attrib))
        self.assertFalse(any(e.get('id') in ('buttons','tools','documentations') for e in root.iter()))
        self.assertTrue(any(e.get('mwColorIndex') == '7' for e in root.iter()))
        for element in root.iter():
            href = element.get('{http://www.w3.org/1999/xlink}href','')
            self.assertTrue(not href or href.startswith('#'))
        self.page.goto(path.as_uri())
        self.assertEqual(self.page.locator('#strips').count(), 1)

    def test_responsive_site_and_no_javascript_content(self):
        screenshots = Path(__file__).resolve().parents[1]/'test-results'
        screenshots.mkdir(exist_ok=True)
        for width in (1280,768,390,320):
            self.page.set_viewport_size({'width':width,'height':950})
            for name in ('index.html','guide.html','editor.html'):
                self.page.goto(self.base+name)
                self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
                self.assertTrue(self.page.locator('h1').is_visible())
                self.assertTrue(self.page.evaluate('Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)'))
                if width in (1280,390) and name == 'index.html':
                    self.page.screenshot(path=str(screenshots/f'home-{width}.png'), full_page=True)
        context = self.browser.new_context(java_script_enabled=False)
        page = context.new_page()
        for name in ('index.html','guide.html'):
            page.goto(self.base+name)
            self.assertTrue(page.locator('h1').is_visible())
            self.assertGreater(page.locator('a[href="editor.html"]').count(),0)
        context.close()
