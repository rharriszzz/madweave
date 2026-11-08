#!/usr/bin/env python3
"""Optional native Mac regression: Selenium 4.52, Safari or installed Firefox.

Run separately from unittest discovery. No personal browser profile is loaded.
Safari's uniquely named downloads are moved immediately into the artifact folder.
"""
import argparse
import contextlib
import functools
import http.server
import json
import os
from pathlib import Path
import re
import sys
import threading
import time
import traceback
import uuid
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from build_site import build

from selenium import webdriver
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.remote.file_detector import UselessFileDetector
from selenium.webdriver.support.ui import Select, WebDriverWait


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class NativeTestServer(http.server.ThreadingHTTPServer):
    request_queue_size = 64


class NativeCheck:
    def __init__(self, args, base):
        self.args, self.base = args, base
        self.out = args.output.resolve() / args.browser
        self.out.mkdir(parents=True, exist_ok=True)
        self.prefix = 'madweave-native-' + uuid.uuid4().hex
        self.pending = []
        self.results = {'browser': args.browser, 'checks': [], 'files': []}
        self.driver = None
        self.restart()

    def restart(self):
        if self.driver:
            self.driver.quit()
        if self.args.browser == 'safari':
            self.driver = webdriver.Remote(self.args.webdriver_url, options=webdriver.SafariOptions())
            self.downloads = Path.home() / 'Downloads'
        else:
            home = self.out / ('app-data-' + uuid.uuid4().hex)
            for folder in ('Documents', 'Downloads', 'Library/Application Support',
                           'Library/Caches', 'Library/Preferences'):
                (home / folder).mkdir(parents=True, exist_ok=True)
            options = webdriver.FirefoxOptions()
            options.binary_location = '/Applications/Firefox.app/Contents/MacOS/firefox'
            options.add_argument('-headless')
            options.set_preference('browser.download.folderList', 2)
            options.set_preference('browser.download.dir', str(self.out))
            options.set_preference('browser.helperApps.neverAsk.saveToDisk', 'text/html,image/svg+xml')
            service = Service(str(self.args.geckodriver), env={**os.environ, 'CFFIXED_USER_HOME': str(home)},
                              log_output=str(self.out / 'driver.log'))
            self.driver = webdriver.Firefox(service=service, options=options)
            self.downloads = self.out
        self.driver.file_detector = UselessFileDetector()
        self.driver.set_page_load_timeout(40)
        if self.args.browser == 'safari':
            screen = self.driver.execute_script('return {x:screen.availLeft||0,y:screen.availTop||0,width:screen.availWidth,height:screen.availHeight}')
            # Safari dispatches real native input. Keep the entire automation
            # window on screen, including after fresh-session window cascading.
            self.driver.set_window_rect(x=screen['x'], y=screen['y'],
                                        width=min(1280, screen['width']),
                                        height=min(1100, screen['height']))
            self.results['screen'] = screen
        else:
            self.driver.set_window_size(1280, 1100)
        self.wait = WebDriverWait(self.driver, 35)
        self.results['version'] = self.driver.capabilities['browserVersion']

    def js(self, script, *args):
        return self.driver.execute_script(script, *args)

    def check(self, name, condition=True):
        assert condition, name
        self.results['checks'].append(name)
        print(name, flush=True)

    def ready(self):
        self.wait.until(lambda _: self.js('return !!window.MadWeaveEditor && !document.getElementById("save-project").disabled'))

    def state(self):
        # Older Marionette rounds numbers in returned WebDriver objects.
        # Preserve the exact application's JSON, rather than relaxing equality.
        return json.loads(self.js('return JSON.stringify(MadWeaveEditor.capture())'))

    def visit(self, url):
        self.driver.get(url)
        self.js('document.documentElement.style.scrollBehavior="auto"')

    @contextlib.contextmanager
    def svg(self):
        frame = self.driver.find_elements(By.ID, 'weave')
        if frame:
            self.driver.switch_to.frame(frame[0])
        try:
            yield
        finally:
            self.driver.switch_to.default_content()

    def press(self, name, click=True):
        close = self.driver.find_elements(By.ID, 'close-settings')
        if close and close[0].is_displayed():
            close[0].click()
        framed = bool(self.driver.find_elements(By.ID, 'weave'))
        with self.svg():
            element = self.driver.find_element(By.ID, 'cbutton' + name)
            self.js('arguments[0].scrollIntoView({behavior:"instant",block:"center"})', element)
            if not framed and click:
                # Element Click also waits for a standalone SVG's navigation.
                element.click()
                return
            point = self.js('''const b=arguments[0].getBoundingClientRect(),
              f=window.frameElement?.getBoundingClientRect();
              return {x:b.x+b.width/2+(f?.x||0),y:b.y+b.height/2+(f?.y||0)};''', element)
        # Dispatch in the top-level viewport. A mode button hides its own
        # iframe on mousedown; older Marionette cannot send mouseup into that
        # now-hidden document through Element Click, despite changing mode.
        self.point(**point, click=click)

    def select(self, identifier, value):
        element = self.driver.find_element(By.ID, identifier)
        self.js('arguments[0].scrollIntoView({behavior:"instant",block:"center"})', element)
        Select(element).select_by_value(str(value))

    def click(self, identifier):
        element = self.driver.find_element(By.ID, identifier)
        self.js('arguments[0].scrollIntoView({behavior:"instant",block:"center"})', element)
        element.click()

    def point(self, x, y, click=False):
        action = ActionBuilder(self.driver)
        action.pointer_action.move_to_location(round(x), round(y))
        if click:
            action.pointer_action.pointer_down()
            action.pointer_action.pointer_up()
        action.perform()

    def slider(self, name, value):
        frame = self.driver.find_element(By.ID, 'weave')
        self.js('arguments[0].scrollIntoView({behavior:"instant",block:"start"})', frame)
        point = self.js('''const f=document.getElementById('weave'),w=f.contentWindow,
          e=w.document.getElementById('cbutton'+arguments[0]),r=f.getBoundingClientRect(),
          p=new w.DOMPoint(arguments[1],.5).matrixTransform(e.getScreenCTM());
          return {x:r.x+p.x,y:r.y+p.y};''', name, value)
        self.point(**point, click=True)

    def mode(self, name):
        self.press('ViewFlat' if name == 'planar' else 'ViewCorner')
        self.wait.until(lambda _: self.js('return MadWeaveEditor.mode') == name)

    def open_more(self):
        if not self.driver.find_element(By.ID, 'save-project').is_displayed():
            self.press('ViewMore')

    def download(self, identifier, name):
        self.open_more()
        filename = self.prefix + '-' + name
        source = self.downloads / filename
        self.pending.append(source)
        # Keep the actual browser download mechanism, changing only its name.
        self.js('''window.nativeDownloadName=arguments[0];
          if(!window.nativeAnchorClick){window.nativeAnchorClick=HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click=function(){if(this.download)this.download=window.nativeDownloadName;
          return window.nativeAnchorClick.call(this);};}''', filename)
        button = self.driver.find_element(By.ID, identifier)
        self.js('arguments[0].scrollIntoView({behavior:"instant",block:"center"})', button)
        point = self.js('const b=arguments[0].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}', button)
        self.point(**point)  # Finish legitimate hover selection before capture.
        before = self.state()
        self.click(identifier)
        self.wait.until(lambda _: source.is_file() and source.stat().st_size > 0)
        target = self.out / name
        if source != target:
            source.replace(target)
        self.results['files'].append({'name': name, 'bytes': target.stat().st_size})
        if identifier == 'save-project':
            match = re.search(r'<script\b[^>]*id="madweave-project"[^>]*>(.*?)</script>', target.read_text(), re.S)
            assert match and json.loads(match[1]) == before, 'Saved complete state differs from the design'
        return target, before

    def import_file(self, path):
        self.open_more()
        self.driver.find_element(By.ID, 'project-file').send_keys(str(path.resolve()))
        self.wait.until(lambda _: self.driver.find_element(By.ID, 'export-status').text.startswith('Opened '))
        self.ready()

    def paint_flat(self):
        frame = self.driver.find_element(By.ID, 'weave')
        self.js('arguments[0].scrollIntoView({behavior:"instant",block:"start"})', frame)
        point = self.js('''const f=document.getElementById('weave'),r=f.getBoundingClientRect(),
          b=f.contentDocument.getElementById('stripsCover').getBoundingClientRect();
          return {x:r.x+b.x+b.width*.5,y:r.y+b.y+b.height*.5};''')
        self.point(**point)
        time.sleep(.45)  # Original selector explicitly requires a 400 ms dwell.
        self.point(point['x'] + 1, point['y'])
        index = self.js('return MadWeaveEditor.planar.contentWindow.mouseStripIndex')
        assert index >= 0, 'Native hover did not select a strip'
        self.point(point['x'] + 1, point['y'], click=True)
        return index

    def paint_end(self):
        frame = self.driver.find_element(By.ID, 'weave')
        self.js('arguments[0].scrollIntoView({behavior:"instant",block:"start"})', frame)
        point = self.js('''const c=MadWeaveEditor.corner,m=c.state.model;
          for(const [position,poly]of m.polygons){
            const mean=[0,1].map(i=>poly.reduce((s,p)=>s+p[i],0)/poly.length);
            const q=poly.map(p=>p.map((x,i)=>x*.95+mean[i]*.05)).find(p=>Math.hypot(...p)>m.R+.01);
            if(!q)continue;const world=m.map(q,m.parts.get(position).id[0]),hits=m.pick(world);
            if(!hits.length)continue;const p=new DOMPoint(...world).matrixTransform(c.host.querySelector('.material-cells').getScreenCTM()),r=c.frame.getBoundingClientRect();
            return {x:p.x+r.x,y:p.y+r.y,key:c.state.keys[hits[0].strip]};}''')
        assert point, 'No extended strip end found'
        self.point(point['x'], point['y'], click=True)
        self.check('Native painting selects a whole strip from its extended end',
                   self.state()['design']['material']['overrides'].get(point['key']) == self.state()['design']['selectedColor'])

    def artwork(self, name):
        path, state = self.download('export', name)
        root = ET.parse(path).getroot()
        assert not any(e.tag.split('}')[-1] in ('script', 'image', 'foreignObject') for e in root.iter())
        assert not any(k.lower().startswith('on') for e in root.iter() for k in e.attrib)
        assert not any(e.get('id') in ('buttons', 'viewButtons', 'tools', 'documentations') for e in root.iter())
        for e in root.iter():
            for key, value in e.attrib.items():
                if key.split('}')[-1] == 'href':
                    assert value.startswith('#'), value
        if state['active'] == 'corner':
            meta = json.loads(next(e.text for e in root.iter() if e.get('id') == 'corner-artwork-info'))
            for key in ('palette', 'opacity', 'material', 'construction'):
                assert meta[key] == state['design'][key], key
        self.check('Static SVG is standalone and preserves artwork data: ' + name)

    def round_trip(self, label):
        saved, before = self.download('save-project', label + '.html')
        self.restart()
        self.visit(saved.as_uri())
        self.ready()
        self.check('Fresh native session restores the complete ' + label + ' state', self.state() == before)
        # Test-only CSP blocks HTTP(S), including child frames and image/script loads.
        text = saved.read_text().replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src data: blob: \'unsafe-inline\'; connect-src \'none\'; frame-src \'self\' about: data: blob:">', 1)
        offline = self.out / (label + '-network-blocked.html')
        offline.write_text(text)
        self.restart()
        self.visit(offline.as_uri())
        self.ready()
        self.check('Network-blocked file restores the complete ' + label + ' state', self.state() == before)
        blocked = self.driver.execute_async_script('''const done=arguments[0];
          document.addEventListener('securitypolicyviolation',e=>done(e.blockedURI.startsWith('https:')),{once:true});
          fetch('https://rharriszzz.github.io/madweave/').catch(()=>{});''')
        assert blocked, 'Offline CSP negative control did not block the request'
        self.press('C6')
        if before['active'] == 'corner':
            self.paint_end()
        else:
            index = self.paint_flat()
            assert self.state()['design']['stripColors'][index] == 6
        again, changed = self.download('save-project', label + '-resaved.html')
        assert changed != before
        self.restart()
        self.visit(again.as_uri())
        self.ready()
        self.check('Native offline edits survive another save and fresh session: ' + label, self.state() == changed)
        self.artwork(label + '-artwork.svg')
        self.visit(self.base + 'editor.html?view=svg&panel=controls')
        self.ready()
        self.import_file(saved)
        self.check('Open Project restores the complete ' + label + ' state', self.state() == before)
        self.artwork(label + '-imported-artwork.svg')

    def run(self):
        self.visit('https://rharriszzz.github.io/madweave/')
        self.check('Published landing page loads', bool(self.driver.find_elements(By.TAG_NAME, 'h1')))
        self.visit('https://rharriszzz.github.io/madweave/madweave.svg')
        self.wait.until(lambda _: self.driver.find_elements(By.ID, 'cbuttonViewCorner'))
        self.check('Published original SVG has restored bottom controls')
        self.visit(self.base + 'madweave.svg')
        self.wait.until(lambda _: self.driver.find_elements(By.ID, 'cbuttonViewCorner'))
        self.press('ViewCorner')
        self.ready()
        self.wait.until(lambda _: self.js('return MadWeaveEditor.mode') == 'corner')
        self.check('Original SVG transfers to integrated Corner mode')
        self.mode('planar')
        for size in range(1, 9):
            self.press('SC' + str(size))
            assert self.state()['design']['baseSize'] == size
        for spacing in range(4):
            self.press('Sep' + str(spacing))
            assert self.state()['design']['separation'] == spacing
        self.press('SC2')
        self.press('Sep1')
        self.press('C7')
        index = self.paint_flat()
        assert self.state()['design']['stripColors'][index] == 7
        self.press('SC3')
        assert 7 not in self.state()['design']['stripColors']
        self.check('Flat resizing resets manual strip colors as documented')
        self.press('SC2')
        self.press('C7')
        self.paint_flat()
        self.press('I')
        hidden = self.paint_flat()
        assert self.state()['design']['stripVisibility'][hidden] is False
        self.press('V')
        visible = self.paint_flat()
        assert self.state()['design']['stripVisibility'][visible] is True
        self.press('C7')
        self.slider('OB', .37)
        self.slider('HB', .12)
        for name in ('VD1', 'VH2', '-', 'X', 'C', 'Lines'):
            self.press(name)
        self.check('Flat sizes, spacings, native painting, visibility, opacity and order controls')
        planar = self.state()
        self.round_trip('planar')
        self.mode('corner')
        corner = self.state()
        self.mode('planar')
        self.check('Mode round trip retains the separate planar design', self.state() == planar)
        self.mode('corner')
        self.check('Mode round trip retains the separate corner design', self.state() == corner)
        self.press('C7')
        self.paint_end()
        for size in range(1, 9):
            old = self.state()['design']['material']['overrides']
            self.press('SC' + str(size))
            assert self.js('return MadWeaveEditor.corner.state.model.p.size') == size
            keys = self.js('return MadWeaveEditor.corner.state.keys')
            overrides = self.state()['design']['material']['overrides']
            assert all(overrides.get(k) == v for k, v in old.items() if k in keys)
        for spacing, width in enumerate(('100/107', '100/133', '5/9', '1/3')):
            old = self.state()['design']['material']['overrides']
            self.press('Sep' + str(spacing))
            assert self.js('return MadWeaveEditor.corner.state.model.p.W_over_P') == width
            keys = self.js('return MadWeaveEditor.corner.state.keys')
            assert all(self.state()['design']['material']['overrides'].get(k) == v for k, v in old.items() if k in keys)
        self.check('Corner size 1–8 and four spacings retain surviving strip colors')
        self.press('SC2')
        self.press('Lines')
        for name in ('-', 'X', 'C', 'VD0', 'I', 'CC2'):
            with self.svg():
                element = self.driver.find_element(By.ID, 'cbutton' + name)
                assert element.get_attribute('aria-disabled') == 'true'
                assert element.get_attribute('tabindex') == '-1'
            # Moving across material can legitimately change hover selection.
            # Settle on the disabled control before comparing a click's effect.
            self.press(name, click=False)
            before = self.state()
            self.press(name)
            assert self.state() == before
        self.check('Unavailable corner controls are dimmed, untabbable, and do not change the model')
        self.press('ViewAngle')
        assert self.driver.find_element(By.ID, 'corner-beta').is_displayed()
        palette = self.state()['design']['palette']
        for beta in range(60, 721, 60):
            self.select('corner-beta', beta)
            self.click('corner-apply')
            assert self.js('return MadWeaveEditor.corner.state.model.p.beta') == beta
            assert self.state()['design']['palette'] == palette
            assert self.state()['design']['view']['edges'] is True
        self.check('All twelve native angle selections preserve palette and edge settings')
        self.select('corner-beta', 480)
        self.click('corner-apply')
        self.click('close-settings')
        for member in range(3):
            self.press('VH' + str(member))
            self.press('ViewMore')
            self.click('corner-apply')
            assert self.js('return MadWeaveEditor.corner.state.model.p.member') == member
            self.click('close-settings')
        self.check('All three hexweave classes stage and apply through original buttons')
        self.press('C7')
        self.paint_end()
        self.slider('OB', .42)
        with self.svg():
            element = self.driver.find_element(By.ID, 'cbuttonOB')
            self.js('arguments[0].focus()', element)
            old = self.state_in_frame_opacity()
            element.send_keys(Keys.ARROW_RIGHT)
        assert abs(self.state()['design']['opacity'][7] - min(1, old + .02)) < 1e-6
        with self.svg():
            element = self.driver.find_element(By.ID, 'cbuttonC6')
            self.js('arguments[0].focus()', element)
            element.send_keys(Keys.ENTER)
        assert self.state()['design']['selectedColor'] == 6
        self.check('Corner palette Enter and opacity arrow-key activation')
        count = self.js('return MadWeaveEditor.corner.state.model.parts.size')
        self.slider('OB', 0)
        # Pixel rounding at the slider edge may leave a tiny positive opacity.
        # The supported keyboard action reaches the exact clamped endpoint.
        with self.svg():
            element = self.driver.find_element(By.ID, 'cbuttonOB')
            self.js('arguments[0].focus()', element)
            element.send_keys(Keys.ARROW_LEFT)
        assert self.state()['design']['opacity'][6] == 0
        self.check('Zero-opacity material remains present', self.js('return MadWeaveEditor.corner.state.model.parts.size') == count)
        self.round_trip('corner-hexweave')
        if self.driver.find_element(By.ID, 'close-settings').is_displayed():
            self.click('close-settings')
        self.driver.save_screenshot(str(self.out / 'editor.png'))
        self.results['windowSamples'] = []
        for width in (390, 320):
            self.driver.set_window_size(width, 950)
            self.results['windowSamples'].append(self.js('return {requested:arguments[0],innerWidth,innerHeight}', width))
            assert self.js('return document.documentElement.scrollWidth<=innerWidth')
            with self.svg():
                # Hit rectangles are intentionally opacity=0: Selenium treats
                # those as undisplayed even when their visible groups render.
                self.wait.until(lambda _: self.driver.find_element(By.ID, 'gbuttonViewMore').is_displayed())
                assert self.driver.find_element(By.ID, 'gbuttonSC8').is_displayed()
        self.check('Restored SVG controls remain available at narrow window sizes')
        if self.args.browser == 'safari':
            screen = self.results['screen']
            self.driver.set_window_size(min(1280, screen['width']), min(1100, screen['height']))
        else:
            self.driver.set_window_size(1280, 1100)
        self.import_file(ROOT / 'research/evidence/corner-stage3a-worked/01-self-23.corner.html')
        assert self.state()['active'] == 'corner'
        self.import_file(ROOT / 'research/evidence/corner-integration-worked/editable.html')
        assert self.state()['active'] == 'corner'
        self.import_file(ROOT / 'madweave.svg')
        assert self.state()['active'] == 'planar'
        self.check('Original SVG, Stage 3A and earlier integrated editable examples import without modifying originals')

    def state_in_frame_opacity(self):
        return float(self.js('return currentOpacity'))

    def close(self):
        if self.driver:
            self.driver.quit()
        for path in self.pending:
            if path.parent != self.out and path.is_file():
                path.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', choices=('safari', 'firefox'), default='safari')
    parser.add_argument('--webdriver-url', default='http://127.0.0.1:4445')
    parser.add_argument('--geckodriver', type=Path, default=ROOT / 'test-results/geckodriver')
    parser.add_argument('--output', type=Path, default=ROOT / 'test-results/mac-native')
    args = parser.parse_args()
    build()
    server = NativeTestServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
    # Serve the exact built artifact under its GitHub Pages subpath.
    class Handler(QuietHandler):
        def translate_path(self, path):
            if path.startswith('/madweave/'):
                self.path = self.path.removeprefix('/madweave')
                path = self.path
            return super().translate_path(path)
    server.RequestHandlerClass = functools.partial(Handler, directory=str(ROOT / 'dist'))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    check = None
    try:
        check = NativeCheck(args, f'http://127.0.0.1:{server.server_port}/madweave/')
        check.run()
        check.results['passed'] = True
    except Exception:
        if check:
            check.results['passed'] = False
            check.results['failure'] = traceback.format_exc()
            with contextlib.suppress(Exception):
                check.results['status'] = check.js('return document.getElementById("export-status")?.textContent')
                check.results['url'] = check.driver.current_url
                check.results['state'] = check.state()
                check.driver.save_screenshot(str(check.out / 'failure.png'))
        traceback.print_exc()
        return 1
    finally:
        if check:
            try:
                check.close()
            finally:
                (check.out / 'results.json').write_text(json.dumps(check.results, indent=2) + '\n')
        server.shutdown()
        server.server_close()
        thread.join()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
