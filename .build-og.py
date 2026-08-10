#!/usr/bin/env python3
"""Emit og.png — the 1200x630 card shown when the link is shared.

There was none, so a shared link rendered as a blank box. This is the one
image most people see before they ever load the page.

It has to be a raster: X, Telegram, Discord and Slack will not render SVG in
a card. There is no rsvg, cairo or ImageMagick here. qlmanage was the first
attempt and is the wrong tool — it renders SVG as a *document preview*, so
you get page chrome, a white mat and none of the site's fonts. This drives a
real engine instead, headless, at exactly 1200x630.

The page is built as HTML rather than SVG so it can @font-face the very woff2
files the site preloads, and reuse the site's own gradients verbatim. The
unicorn is lifted out of mascot-unicorn.svg rather than redrawn, so the card
cannot drift away from the site; its runtime-driven parts are dropped,
because in a still they sit at scale(0).
"""
import importlib.util
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BROWSER = "/Applications/Mullvad Browser.app/Contents/MacOS/mullvadbrowser"
# Both are preloaded by index.html and neither name says which is which.
# Rendered once each: 797e... is the mono.
MONO = os.path.join(HERE, "_next/static/media/797e433ab948586e-s.p.0r6juujl39pe6.woff2")
SANS = os.path.join(HERE, "_next/static/media/caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2")

spec = importlib.util.spec_from_file_location("glowkit", os.path.join(HERE, ".glowkit.py"))
glowkit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(glowkit)


def mascot():
    src = open(os.path.join(HERE, "mascot-unicorn.svg"), encoding="utf-8").read()
    src = re.sub(r"<style>.*?</style>", "", src, flags=re.S)
    for gid in ("nk-halos", "nk-coins", "nk-impact"):
        src = re.sub(r'<g id="%s".*?</g>\s*</g>' % gid, "", src, flags=re.S)
    src = re.sub(r'<ellipse id="nk-dust".*?/>', "", src, flags=re.S)
    return src.replace("<svg ", '<svg width="452" height="477" ', 1)


def css_wash(x, y, r, peak, ramp):
    return "radial-gradient(%dpx %dpx at %dpx %dpx, %s)" % (
        r, r, x, y, glowkit.css(glowkit.area, peak, 10, ramp))


HTML = """<!doctype html><meta charset="utf-8">
<style>
  @font-face{{font-family:G;src:url("file://{sans}") format("woff2");font-weight:100 900}}
  @font-face{{font-family:GM;src:url("file://{mono}") format("woff2");font-weight:100 900}}
  *{{margin:0;padding:0;box-sizing:border-box}}
  html,body{{width:1200px;height:630px;overflow:hidden}}
  body{{background:#131313;font-family:G,sans-serif;position:relative}}
  .bg{{position:absolute;inset:0;background:{w1},{w2},{w3},
       radial-gradient(120% 85% at 50% 42%, transparent 52%, rgba(0,0,0,.45) 100%)}}
  .dots{{position:absolute;inset:0;
        background-image:radial-gradient(rgba(255,255,255,.075) 1px, transparent 1px);
        background-size:26px 26px}}
  .horse{{position:absolute;right:14px;top:96px}}
  .wrap{{position:absolute;left:84px;top:64px;width:600px}}
  .mark{{display:flex;align-items:center;gap:13px}}
  .mark .n{{width:34px;height:34px;border-radius:50%;border:2px solid #ff37c7;
           display:grid;place-items:center;font-size:16px;font-weight:700;color:#ffe9fa}}
  .mark .t{{font-size:21px;font-weight:600;color:#fff}}
  h1{{margin-top:62px;font-size:60px;line-height:1.12;font-weight:500;letter-spacing:-1.4px;color:#fff}}
  h1 em{{font-style:normal;color:#ff37c7;
        text-shadow:0 0 22px rgba(255,55,199,.30),0 0 56px rgba(255,55,199,.15)}}
  p{{margin-top:24px;font-size:20px;line-height:1.55;color:#9b9b9b;max-width:520px}}
  .pills{{margin-top:30px;display:flex;gap:10px;font-family:GM,monospace;font-size:13px;color:#8c8c8c}}
  .pills span{{border:1px solid #3a2b40;border-radius:999px;padding:8px 17px;white-space:nowrap}}
  .foot{{position:absolute;left:84px;bottom:30px;font-family:GM,monospace;font-size:12.5px;
        letter-spacing:1.7px;color:#5a5a5a}}
</style>
<div class="bg"></div><div class="dots"></div>
<div class="horse">{horse}</div>
<div class="wrap">
  <div class="mark"><div class="n">N</div><div class="t">None</div></div>
  <h1>Steal the spread.<br><em>Powered by AI.</em></h1>
  <p>Say the trade in plain language. None quotes every venue, routes it, and
     hands your wallet one transaction to sign.</p>
  <div class="pills"><span>non-custodial</span><span>best net output</span><span>fails closed</span></div>
</div>
<!-- The site says this on /docs and in every app receipt. A share card that
     quietly dropped it would be the one surface implying otherwise. -->
<div class="foot">DEMONSTRATION CLONE &middot; NOT A LIVE SERVICE</div>
""".format(sans=SANS, mono=MONO, horse=mascot(),
           w1=css_wash(150, 40, 1240, 0.15, glowkit.RAMP),
           w2=css_wash(1080, 200, 1040, 0.11, glowkit.VIOLET),
           w3=css_wash(820, 640, 920, 0.08, glowkit.ROSE))

if not os.path.exists(BROWSER):
    sys.exit("no headless engine at " + BROWSER)

work = os.path.join(HERE, ".og-tmp")
os.makedirs(work, exist_ok=True)
page = os.path.join(work, "card.html")
open(page, "w", encoding="utf-8").write(HTML)
out = os.path.join(HERE, "og.png")

subprocess.run([BROWSER, "--headless", "--no-remote",
                "--profile", os.path.join(work, "prof"),
                "--window-size=1200,630", "--screenshot", out,
                "file://" + page], capture_output=True)
shutil.rmtree(work, ignore_errors=True)

if not os.path.exists(out):
    sys.exit("render produced nothing")
dims = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", out],
                      capture_output=True, text=True).stdout
print("wrote og.png", os.path.getsize(out), "bytes")
print(" ".join(dims.split()[-4:]))
