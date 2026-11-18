"""Replay the captured SVG matrix in an installed Edge or Firefox browser."""
import argparse
import json
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('browser', choices=('edge', 'firefox'))
    parser.add_argument('url')
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    if args.browser == 'edge':
        options = webdriver.EdgeOptions()
        options.add_argument('--headless=new')
        browser = webdriver.Edge(options=options)
    else:
        options = webdriver.FirefoxOptions()
        options.add_argument('-headless')
        browser = webdriver.Firefox(options=options)
    with browser:
        browser.get(args.url)
        raw = WebDriverWait(browser, 600).until(
            lambda d: d.execute_script("return document.querySelector('#results')?.textContent")
        )
        results = json.loads(raw)
        report = {'version': browser.capabilities['browserVersion'], 'rows': results}
    args.output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(report['version'], results['production'])
    for row in results.values():
        assert (row['cases'], row['samples']) == (163, 90350), 'Incomplete matrix'
    assert results['production']['samplesOverFour'] == 0, 'Production seam exceeded tolerance'


if __name__ == '__main__':
    main()
