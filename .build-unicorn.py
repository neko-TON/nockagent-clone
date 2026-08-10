#!/usr/bin/env python3
"""Emit mascot-unicorn.svg.

The legs are the reason the old drawing read as a toy: they were constant-width
strokes with pale circles at the joints. A real leg is a tapered column — heavy
forearm, narrow cannon, a bulge at the fetlock — so the shapes here are built as
ribbons that carry a width per joint, and the joint caps are drawn in the same
tone as the limb so they round the silhouette instead of beading it.
"""
import math, re, glob, os
from importlib.util import spec_from_file_location, module_from_spec

# .glowkit.py is dot-prefixed like the other build scripts, so it cannot be
# imported by name — load it by path.
_here = os.path.dirname(os.path.abspath(__file__))
_spec = spec_from_file_location("glowkit", os.path.join(_here, ".glowkit.py"))
glowkit = module_from_spec(_spec)
_spec.loader.exec_module(glowkit)

# ---------------------------------------------------------------- ribbon
def ribbon(pts, widths):
    """Closed outline around a polyline whose thickness varies per point."""
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        px, py = pts[i - 1] if i else pts[i]
        nx_, ny_ = pts[i + 1] if i + 1 < len(pts) else pts[i]
        dx, dy = nx_ - px, ny_ - py
        ln = math.hypot(dx, dy) or 1.0
        ox, oy = -dy / ln * widths[i] / 2, dx / ln * widths[i] / 2
        left.append((x + ox, y + oy))
        right.append((x - ox, y - oy))
    pathpts = left + right[::-1]
    d = "M%.1f %.1f " % pathpts[0]
    d += " ".join("L%.1f %.1f" % p for p in pathpts[1:])
    return d + " Z"

def caps(pts, widths, fill):
    """Same-tone discs at the joints: they round the column, not decorate it."""
    return "\n      ".join(
        '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (x, y, w / 2, fill)
        for (x, y), w in zip(pts, widths))

def leg(pts, widths, fill, cap):
    return ('    <path d="%s" fill="%s"/>\n      %s'
            % (ribbon(pts, widths), fill, caps(pts, widths, cap)))

def hoof(x, y, w=22, h=19, light="#e3b4f0"):
    """Hooves flare toward the ground and sit slightly forward of the pastern."""
    return ('<path d="M%.1f %.1f h%.1f l%.1f %.1f q0 5 -5 5 h-%.1f q-5 0 -5 -5 z" '
            'fill="#2b1d42" stroke="%s" stroke-width="1.4"/>'
            % (x - w / 2, y, w, 2.0, h, w - 4, light))

# ---------------------------------------------------------------- skeleton
# near fore: elbow, knee, fetlock, pastern
FORE   = [(322, 244), (328, 312), (326, 372), (325, 396)]
FORE_W = [36, 21, 15, 13]
# near hind: stifle, hock, fetlock, pastern — the hock kicks back, and that
# zig-zag is the single strongest "this is a horse" signal in a silhouette
HIND   = [(190, 240), (156, 312), (176, 374), (178, 396)]
HIND_W = [50, 24, 15, 13]
# off-side pair, held back in tone so the near legs read first
FORE_O   = [(348, 246), (352, 314), (350, 374), (349, 396)]
HIND_O   = [(224, 244), (196, 314), (214, 374), (216, 396)]

LIMB, CAP, DARK = "url(#limbG)", "#6b4f95", "#4a3568"

# ---------------------------------------------------------------- glyphs
POOL = []
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), "logos", "*.svg"))):
    sym = os.path.basename(f)[:-4]
    src = open(f, encoding="utf-8").read()
    g = re.search(r'<g transform="translate\([^"]+\)[^"]*"[^>]*>(.*?)</g>', src, re.S)
    if not g:
        continue
    paths = re.findall(r'<path d="[^"]+"\s*/>', g.group(1))
    if paths:
        POOL.append((sym, "".join(paths)))

glyph_defs = "\n".join('    <g id="gl-%s">%s</g>' % (s, p) for s, p in POOL)

RADII = [20, 17, 21, 16, 18, 15]

# The coins carry their own light, but the halos live in a sibling group rather
# than inside each coin: one screen-blended group for all six costs one
# transparency group per frame instead of six, and the coin faces themselves
# must stay out of it — screening a dark disc erases it.
# area, not point: the point kernel keeps its light in a very tight core, and
# on a coin that core sits behind the opaque face where none of it is visible —
# all you get is the weak tail. The area kernel puts the light at the rim,
# which is where a glowing disc actually shows it.
halos = "\n".join(
    '    <circle class="nk-halo" r="%.1f" fill="url(#pool)" opacity="0"\n'
    '            transform="translate(325 410) scale(0)"/>' % (r * 2.0)
    for r in RADII)

coins = "\n".join(
    '    <g class="nk-coin" transform="translate(325 410) scale(0)" opacity="0">\n'
    '      <circle r="%d" fill="url(#coinFace)" stroke="#ff37c7" stroke-width="2.2"/>\n'
    '      <circle r="%.1f" fill="none" stroke="#fc72ff" stroke-width="1.1" opacity="0.5"/>\n'
    '      <g transform="scale(%.3f) translate(-12 -12)" fill="#ffe9fa">\n'
    '        <use class="nk-glyph" href="#gl-%s"/>\n'
    '      </g>\n'
    '    </g>' % (r, r - 6.5, (r * 1.16) / 24, POOL[i % len(POOL)][0])
    for i, r in enumerate(RADII))

# The frame used to end at y=-30, twelve pixels above the horn tip. Any halo
# worth the name reaches past that, and a soft shape crossing a viewBox edge
# does not fade out — it stops dead in a straight line. Hence 26px of headroom
# up top; the CSS height is scaled by the same 496/470 so the horse itself does
# not change size. Anything luminous must stay inside x 58..528, y -56..440.
SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="58 -56 470 496" fill="none" role="img" aria-label="Unicorn pawing the ground, asset coins scattering from the hoof">
  <defs>
{glowkit.svg("aura", glowkit.area, 0.17, extra=' fx="68%" fy="30%"')}
    <linearGradient id="hide" x1="0.25" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#a07dc0"/>
      <stop offset="40%" stop-color="#6b4f95"/>
      <stop offset="100%" stop-color="#3a285c"/>
    </linearGradient>
    <linearGradient id="hideLit" x1="0.15" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#ac8acb"/>
      <stop offset="55%" stop-color="#70529b"/>
      <stop offset="100%" stop-color="#412c66"/>
    </linearGradient>
    <linearGradient id="limbG" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#8462a8"/>
      <stop offset="60%" stop-color="#553d7c"/>
      <stop offset="100%" stop-color="#3c2a5a"/>
    </linearGradient>
    <linearGradient id="mane1" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#ffe9fa"/><stop offset="100%" stop-color="#ff6ad9"/>
    </linearGradient>
    <linearGradient id="mane2" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#ff7ae0"/><stop offset="100%" stop-color="#ff37c7"/>
    </linearGradient>
    <linearGradient id="mane3" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#e857ee"/><stop offset="100%" stop-color="#a24bff"/>
    </linearGradient>
    <linearGradient id="mane4" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#b757ff"/><stop offset="100%" stop-color="#6f39c9"/>
    </linearGradient>
    <linearGradient id="hornG" x1="0" y1="1" x2="0.7" y2="0">
      <stop offset="0%" stop-color="#ff6ad9"/>
      <stop offset="50%" stop-color="#ffd9f4"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="coinFace" cx="38%" cy="32%" r="72%">
      <stop offset="0%" stop-color="#4a3552"/>
      <stop offset="68%" stop-color="#271d31"/>
      <stop offset="100%" stop-color="#181022"/>
    </radialGradient>
{glowkit.svg("pool", glowkit.area, 1.0)}
{glowkit.svg("spark", glowkit.point, 1.0)}
    <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffe9fa" stop-opacity="0"/>
      <stop offset="30%" stop-color="#ffbdee" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="70%" stop-color="#ffbdee" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#ffe9fa" stop-opacity="0"/>
    </linearGradient>
{glyph_defs}
  </defs>

  <style>
    @keyframes blink{{0%,95%,100%{{transform:scaleY(1)}}97.5%{{transform:scaleY(.08)}}}}
    #eye{{transform-box:fill-box;transform-origin:center;animation:blink 6.5s ease-in-out infinite}}
    @media (prefers-reduced-motion:reduce){{#eye{{animation:none}}}}
  </style>

  <!-- Ambient: one wide pool, reaching zero exactly at its own rim. The old
       aura ran a 58% gradient inside a 50% ellipse, so it was still at alpha
       .021 when the shape ended — a visible disc, which is what it looked
       like.

       Its focal point is pulled up and right (fx/fy on the gradient) so the
       brightest part of the pool sits under the horn. There is one light in
       this picture and it is on the horn; ambient centred on the body would
       contradict it. Using the focus rather than a second ellipse keeps the
       falloff terminating on the shape, so nothing can reach the frame edge. -->
  <ellipse cx="292" cy="204" rx="226" ry="230" fill="url(#aura)"/>

  <!-- Ground: light pools on a floor in tiers, widest and faintest first,
       offset toward the planted hoof rather than centred under nothing. -->
  <ellipse cx="268" cy="420" rx="196" ry="20" fill="url(#pool)" opacity="0.13"/>
  <ellipse cx="288" cy="421" rx="116" ry="15" fill="url(#pool)" opacity="0.15"/>
  <ellipse cx="325" cy="423" rx="58" ry="10" fill="url(#pool)" opacity="0.20"/>

  <!-- sparks, kept off the main read -->
  <g fill="#ffd9f4">
    <path d="M140 70 l3.5 9 l9 3.5 l-9 3.5 l-3.5 9 l-3.5 -9 l-9 -3.5 l9 -3.5 z" opacity="0.5"/>
    <path d="M498 104 l2.8 7 l7 2.8 l-7 2.8 l-2.8 7 l-2.8 -7 l-7 -2.8 l7 -2.8 z" opacity="0.42"/>
    <path d="M104 268 l2.4 6 l6 2.4 l-6 2.4 l-2.4 6 l-2.4 -6 l-6 -2.4 l6 -2.4 z" opacity="0.32"/>
    <path d="M482 286 l3 7.5 l7.5 3 l-7.5 3 l-3 7.5 l-3 -7.5 l-7.5 -3 l7.5 -3 z" opacity="0.36"/>
    <path d="M232 22 l2.6 6.5 l6.5 2.6 l-6.5 2.6 l-2.6 6.5 l-2.6 -6.5 l-6.5 -2.6 l6.5 -2.6 z" opacity="0.4"/>
  </g>

  <g id="nk-rig">

    <!-- ================= tail, set on at the dock ================= -->
    <g>
      <path d="M126 158 C 96 172, 70 212, 60 258 C 50 304, 56 350, 76 378
               C 70 338, 76 294, 94 256 C 110 222, 124 194, 134 178 Z" fill="url(#mane4)"/>
      <path d="M132 166 C 106 186, 84 224, 76 268 C 68 308, 72 348, 88 372
               C 84 334, 90 296, 106 262 C 120 232, 134 208, 142 190 Z" fill="url(#mane3)"/>
      <path d="M138 176 C 118 198, 102 232, 96 272 C 90 306, 94 338, 106 358
               C 102 326, 108 294, 120 266 C 132 238, 142 218, 148 202 Z" fill="url(#mane2)"/>
      <path d="M130 186 C 110 212, 96 246, 90 282" stroke="#ffe9fa" stroke-width="2" fill="none" opacity="0.32"/>
    </g>

    <!-- ================= off-side legs ================= -->
    <g opacity="0.55">
{leg(HIND_O, HIND_W, DARK, DARK)}
      {hoof(216, 391, 20, 17, "#6b4f95")}
{leg(FORE_O, FORE_W, DARK, DARK)}
      {hoof(349, 391, 20, 17, "#6b4f95")}
    </g>

    <!-- ================= near hind leg ================= -->
{leg(HIND, HIND_W, LIMB, CAP)}
      {hoof(178, 391)}

    <!-- ================= barrel: shoulder, girth, flank and croup all in one
         outline, so the masses belong to the body instead of sitting on it -->
    <path d="M120 176
             C 118 148, 140 128, 172 126
             C 206 124, 244 132, 274 138
             C 298 143, 318 152, 332 172
             C 344 189, 350 208, 348 226
             C 346 246, 334 260, 314 266
             C 292 273, 262 276, 232 272
             C 200 268, 170 260, 150 244
             C 130 228, 122 202, 120 176 Z"
          fill="url(#hide)"/>
    <!-- muscle, drawn as light along the form rather than blobs laid over it -->
    <path d="M138 168 C 158 140, 200 132, 246 140" stroke="#cfb0e4" stroke-width="3" fill="none" opacity="0.4" stroke-linecap="round"/>
    <path d="M262 142 C 292 148, 314 158, 330 176" stroke="#cfb0e4" stroke-width="2.4" fill="none" opacity="0.3" stroke-linecap="round"/>
    <path d="M156 246 C 190 264, 246 270, 306 262" stroke="#2a1a3f" stroke-width="11" fill="none" opacity="0.4" stroke-linecap="round"/>
    <!-- shoulder blade and the stifle groove -->
    <path d="M318 176 C 326 196, 326 220, 316 240" stroke="#3c2a5a" stroke-width="2.4" fill="none" opacity="0.45"/>
    <path d="M186 158 C 176 186, 174 218, 182 246" stroke="#3c2a5a" stroke-width="2.4" fill="none" opacity="0.35"/>
    <path d="M232 268 C 228 250, 228 228, 234 210" stroke="#3c2a5a" stroke-width="1.8" fill="none" opacity="0.3"/>

    <!-- ================= neck: crest above, throat hollow below ========== -->
    <path d="M312 146
             C 330 114, 358 86, 394 70
             C 408 64, 420 61, 428 62
             L 432 104
             C 420 108, 404 118, 390 130
             C 372 145, 356 166, 344 188
             C 338 200, 334 210, 332 218
             C 330 194, 322 168, 312 146 Z"
          fill="url(#hideLit)"/>
    <path d="M322 142 C 344 110, 374 84, 404 70" stroke="#cfb0e4" stroke-width="2.4" fill="none" opacity="0.35"/>

    <!-- ================= head: forehead, the dish of the nasal bone, muzzle -->
    <path d="M424 56
             C 444 52, 460 62, 468 80
             C 476 100, 486 124, 494 142
             C 499 154, 495 164, 484 166
             C 472 168, 459 160, 451 148
             C 438 130, 426 110, 420 92
             C 415 78, 416 62, 424 56 Z"
          fill="url(#hideLit)"/>
    <!-- cheekbone, then the jaw beneath it -->
    <path d="M428 86 C 436 110, 452 130, 474 142" stroke="#3c2a5a" stroke-width="2.4" fill="none" opacity="0.45"/>
    <path d="M472 138 C 486 138, 496 146, 496 155 C 496 164, 486 168, 475 166
             C 466 164, 460 157, 462 149 C 464 142, 467 139, 472 138 Z" fill="#4c3670"/>
    <circle cx="486" cy="152" r="3.4" fill="#180f22"/>
    <path d="M472 163 C 480 167, 490 166, 495 161" stroke="#180f22" stroke-width="1.7" fill="none" opacity="0.7"/>
    <!-- ears -->
    <path d="M418 58 L412 28 L434 50 Z" fill="#70529b"/>
    <path d="M417 54 L414 35 L427 48 Z" fill="#3a285c"/>
    <path d="M438 54 L440 28 L454 50 Z" fill="#5a3f85" opacity="0.85"/>
    <path d="M434 76 C 442 72, 452 73, 458 79" stroke="#3a285c" stroke-width="2.4" fill="none" opacity="0.7" stroke-linecap="round"/>
    <g id="eye">
      <ellipse cx="446" cy="90" rx="7.5" ry="9" fill="#150d1d"/>
      <circle cx="449" cy="86" r="2.7" fill="#ffe9fa"/>
      <circle cx="443" cy="94" r="1.4" fill="#ff9ae8" opacity="0.8"/>
    </g>

    <!-- ================= horn ================= -->
    <path d="M430 52 L446 48 L474 -18 Z" fill="url(#hornG)"/>
    <g stroke="#3a285c" stroke-width="1.6" opacity="0.38" stroke-linecap="round">
      <path d="M435 40 L449 36"/><path d="M441 24 L453 21"/>
      <path d="M447 8 L457 6"/><path d="M453 -6 L461 -8"/>
    </g>
    <!-- The horn tip is the one true point source in the drawing, so it gets
         what a point source gives you: a tight core over a long halo, plus the
         two streaks the eye reads as "too bright to look at". Screen-blended,
         so the mane brightens through it instead of being painted over. -->
    <g style="mix-blend-mode:screen">
      <circle cx="474" cy="-18" r="34" fill="url(#spark)" opacity="0.55"/>
      <circle cx="474" cy="-18" r="13" fill="url(#spark)" opacity="0.75"/>
      <rect x="428" y="-19.1" width="92" height="2.2" rx="1.1" fill="url(#streak)" opacity="0.7"/>
      <!-- shorter than its horizontal twin: rotated, a 92px streak would reach
           y=-64 and be sheared off by the frame at -56 -->
      <rect x="444" y="-19.1" width="60" height="2.2" rx="1.1" fill="url(#streak)" opacity="0.5"
            transform="rotate(90 474 -18)"/>
      <circle cx="474" cy="-18" r="3" fill="#ffffff" opacity="0.9"/>
    </g>

    <!-- ================= mane, laid along the crest ================= -->
    <g>
      <path d="M430 60 C 404 56, 374 74, 350 102 C 324 132, 306 170, 296 208
               C 308 198, 318 190, 328 184 C 316 214, 308 242, 304 266
               C 320 238, 336 212, 350 196 C 344 220, 340 238, 338 254
               C 354 222, 376 184, 392 150 C 408 116, 432 82, 430 60 Z" fill="url(#mane4)"/>
      <path d="M428 62 C 404 60, 377 78, 355 105 C 331 134, 315 169, 306 203
               C 317 194, 326 187, 335 182 C 324 209, 316 236, 313 256
               C 327 231, 341 208, 353 194 C 349 216, 346 232, 344 244
               C 358 216, 378 181, 392 152 C 407 120, 428 84, 428 62 Z" fill="url(#mane3)"/>
      <path d="M426 64 C 404 64, 380 82, 360 108 C 338 136, 324 168, 316 199
               C 326 191, 334 185, 342 181 C 332 205, 325 227, 322 247
               C 334 224, 346 204, 357 192 C 354 212, 351 226, 350 237
               C 362 212, 379 180, 393 154 C 406 126, 426 84, 426 64 Z" fill="url(#mane2)"/>
      <path d="M424 66 C 404 68, 383 86, 365 111 C 345 138, 332 167, 325 195
               C 334 188, 342 183, 349 180 C 340 201, 334 221, 332 239
               C 342 218, 352 200, 361 190 C 359 208, 357 220, 356 230
               C 366 208, 380 179, 394 156 C 406 132, 424 84, 424 66 Z" fill="url(#mane1)" opacity="0.9"/>
      <path d="M416 80 C 396 100, 374 132, 360 166" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.38"/>
    </g>

    <!-- ================= near fore leg, planted ================= -->
{leg(FORE, FORE_W, LIMB, CAP)}
      {hoof(325, 391)}

    <!-- ================= pawing fore leg — the page rebuilds this shape ==== -->
    <g id="nk-leg">
      <path class="nk-leg-shape" d="{ribbon(FORE, FORE_W)}" fill="url(#limbG)"/>
      <g class="nk-leg-caps"></g>
      <g id="nk-hoof" transform="translate(325 391)">
        <path d="M-11 0 h22 l2 19 q0 5 -5 5 h-18 q-5 0 -5 -5 z" fill="#2b1d42" stroke="#e3b4f0" stroke-width="1.5"/>
        <path d="M-11 0 h22 l1 5 h-24 z" fill="#fc72ff" opacity="0.45"/>
      </g>
    </g>
  </g>

  <ellipse id="nk-dust" cx="325" cy="420" rx="30" ry="8" fill="none"
           stroke="#ffd9f4" stroke-width="2.5" opacity="0"/>

  <g id="nk-impact" opacity="0" style="mix-blend-mode:screen">
    <ellipse cx="325" cy="418" rx="86" ry="22" fill="url(#pool)" opacity="0.35"/>
    <ellipse cx="325" cy="418" rx="44" ry="13" fill="url(#spark)" opacity="0.75"/>
    <g stroke="#ffe9fa" stroke-width="2.6" stroke-linecap="round" opacity="0.9">
      <path d="M292 412 L274 401"/><path d="M358 412 L376 401"/>
      <path d="M325 404 L325 386"/><path d="M305 408 L294 392"/><path d="M345 408 L356 392"/>
    </g>
  </g>

  <g id="nk-halos" style="mix-blend-mode:screen">
{halos}
  </g>

  <g id="nk-coins">
{coins}
  </g>
</svg>
'''

out = os.path.join(os.path.dirname(__file__), "mascot-unicorn.svg")
open(out, "w", encoding="utf-8").write(SVG)
print("wrote", out, "| glyphs:", len(POOL))
