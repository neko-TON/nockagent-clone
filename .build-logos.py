#!/usr/bin/env python3
"""Rebuild logos/*.svg from pristine Simple Icons paths.

Do not "optimise" the path data here. A previous pass rounded coordinates with
a regex that matched `\\d+\\.\\d+`, which in SVG path syntax happily spans two
adjacent numbers written without leading zeros: in `-.6.234` it grabbed `6.234`
and in `-.046.525` it grabbed `046.525`, rewriting a 0.046 step as a 46-unit
jump inside a 24-unit box. Every mark was silently deformed. The saving was
800 bytes across the set. It is not worth touching.
"""
import re, os

HERE = os.path.dirname(os.path.abspath(__file__))
# Sources are cached in .si-cache rather than fetched here: this Python has no
# CA bundle, and pinning the copies makes the build reproducible offline.
CACHE = os.path.join(HERE, ".si-cache")

# ticker -> simple-icons slug, and the rim dash that separates them in a row
BRAND = {
    "NVDA": ("nvidia", "3 5"),   "AAPL": ("apple", "6 4"),    "TSLA": ("tesla", "2 4"),
    "COIN": ("coinbase", "9 4"), "AMZN": ("amazon", "5 3"),   "GOOGL": ("google", "7 5"),
    "META": ("meta", "3 8"),     "AMD": ("amd", "8 3"),       "NFLX": ("netflix", "4 3"),
    "BTC":  ("bitcoin", "5 5"),  "ETH": ("ethereum", "6 6"),
}
# no mark in the set (Microsoft was removed upstream) — these keep a ticker chip
TYPO = {"MSFT": "4 6", "AVGO": "6 6", "USDG": "10 4"}

CHIP_HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" role="img" aria-label="{sym}">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="72%">
      <stop offset="0%" stop-color="#2e2233"/>
      <stop offset="70%" stop-color="#1c1420"/>
      <stop offset="100%" stop-color="#141018"/>
    </radialGradient>
  </defs>
  <circle cx="20" cy="20" r="19" fill="url(#g)" stroke="#4a3350" stroke-width="1.4"/>
  <circle cx="20" cy="20" r="19" fill="none" stroke="#ff37c7" stroke-width="1.4"
          stroke-dasharray="{dash}" opacity="0.45"/>
  <path d="M8 13 A19 19 0 0 1 27 4" stroke="#fc72ff" stroke-width="1.2" fill="none" opacity="0.28"/>
'''

def fetch(sym):
    return open(os.path.join(CACHE, sym + ".svg"), encoding="utf-8").read()

def fit(sym):
    return {2: (17, "-0.3"), 3: (14, "-0.4"), 4: (11, "-0.5"), 5: (9, "-0.6")}[len(sym)]

written = []
for sym, (slug, dash) in sorted(BRAND.items()):
    paths = re.findall(r'<path d="([^"]+)"', fetch(sym))
    if not paths:
        raise SystemExit("no path for " + sym)
    body = "".join('<path d="%s"/>' % d for d in paths)      # verbatim, untouched
    svg = (CHIP_HEAD.format(sym=sym, dash=dash) +
           '  <g transform="translate(9.8 9.8) scale(0.85)" fill="#ffe9fa">\n'
           '    %s\n  </g>\n</svg>\n' % body)
    open(os.path.join(HERE, "logos", sym + ".svg"), "w", encoding="utf-8").write(svg)
    written.append(sym)

for sym, dash in sorted(TYPO.items()):
    fs, ls = fit(sym) if sym != "USDG" else (15, "-0.4")
    label = "$" if sym == "USDG" else sym
    svg = (CHIP_HEAD.format(sym=sym, dash=dash) +
           '  <text x="20" y="20" dy="0.36em" text-anchor="middle"\n'
           "        font-family=\"'Helvetica Neue',Helvetica,Arial,sans-serif\"\n"
           '        font-weight="700" font-size="%s" letter-spacing="%s" fill="#ffe9fa">%s</text>\n'
           "</svg>\n" % (fs, ls, label))
    open(os.path.join(HERE, "logos", sym + ".svg"), "w", encoding="utf-8").write(svg)
    written.append(sym)

print("rebuilt:", " ".join(sorted(written)))
