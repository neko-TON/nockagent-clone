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

def hoof(x, y, w=22, h=19, light=None):
    """One flat shape, held off the cannon by a hair. Uniswap's drawing has no
    outlines anywhere — where it needs an edge it leaves a gap instead, and the
    gap is real transparency so whatever is behind shows through."""
    return ('<path d="M%.1f %.1f h%.1f l%.1f %.1f q0 5 -5 5 h-%.1f q-5 0 -5 -5 z" '
            'fill="%s"/>' % (x - w / 2, y + 2.5, w, 2.0, h, w - 4, PINK))

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

# The Uniswap unicorn is drawn in exactly one colour — #FF37C7, the same pink
# this site already uses for --accent — with no gradient, no stroke and no
# second tone anywhere. All of its detail is negative space: the eye, the jaw,
# the gaps between mane strands are holes in the pink, not marks on top of it.
# So the whole palette here collapses to one value, and the only tonal move
# left is opacity on the off-side legs, without which the far pair merges into
# the near pair and the horse loses its legs.
PINK = "#ff37c7"
# The far pair was held back with opacity, which on a near-black page turns
# pink into a muddy maroon — the one thing the reference palette never does.
# So they stay full-strength and a gap separates them instead, which is how
# the reference separates everything else.
LIMB, CAP, DARK, FAR = PINK, PINK, PINK, "1"

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
    <!-- The whole horse is one colour, so anything that overlaps anything else
         simply disappears — the mane sank into the neck the moment the
         gradients came off. The reference solves this the same way every flat
         mark does: it does not overlap, it leaves air. These are those gaps,
         cut as black strokes through the finished silhouette, which is far
         less brittle than trying to author forty non-overlapping outlines. -->
    <mask id="bodyCut" maskUnits="userSpaceOnUse" x="50" y="-60" width="490" height="500">
      <rect x="50" y="-60" width="490" height="500" fill="#fff"/>
      <g stroke="#000" stroke-width="5.5" fill="none" stroke-linecap="round">
        <!-- under each mane strand, so the strands read as strands -->
        <path d="M431 62 C 403 62, 373 83, 349 113 C 329 139, 313 173, 303 207"/>
        <path d="M421 87 C 399 101, 375 129, 357 161 C 343 187, 333 213, 329 235"/>
        <path d="M401 131 C 381 151, 363 179, 351 207 C 343 229, 337 249, 335 265"/>
        <path d="M375 189 C 359 209, 345 233, 337 257 C 332 273, 330 287, 330 297"/>
        <!-- shoulder, girth and haunch: without these the near foreleg and the
             barrel are one shape and the horse loses its legs -->
        <path d="M320 170 C 330 196, 330 222, 320 246"/>
        <path d="M154 246 C 192 265, 250 271, 312 259"/>
        <path d="M198 238 C 190 258, 186 278, 188 296"/>
        <!-- jaw -->
        <path d="M429 86 C 437 111, 453 131, 475 143"/>
        <!-- and between each near leg and the far one behind it -->
        <path d="M338 252 C 344 292, 342 344, 341 400"/>
        <path d="M206 250 C 186 290, 200 346, 202 400"/>
      </g>
    </mask>
    <mask id="headCut" maskUnits="userSpaceOnUse" x="398" y="14" width="122" height="170">
      <rect x="398" y="14" width="122" height="170" fill="#fff"/>
      <!-- The eye is a hole, and it has to be a big one. In the reference the
           eye is the largest piece of negative space on the head — it is what
           makes the thing a character rather than a silhouette. -->
      <ellipse id="eye" cx="447" cy="92" rx="10.5" ry="12" transform="rotate(-16 447 92)" fill="#000"/>
      <circle cx="487" cy="152.5" r="4.2" fill="#000"/>
      <path d="M419 52 L413 30 L431 47 Z" fill="#000"/>
    </mask>
    <!-- Two notches, each biting in from the trailing edge and stopping short
         of the leading one. Cut all the way across — as the first pass did —
         and the horn stops being a horn and becomes three floating shards. -->
    <mask id="hornCut" maskUnits="userSpaceOnUse" x="420" y="-28" width="64" height="90">
      <rect x="420" y="-28" width="64" height="90" fill="#fff"/>
      <path d="M458 30 L446.5 34.5 L448.5 38.5 L459 34 Z" fill="#000"/>
      <path d="M465 10 L455.5 14 L457.5 18 L466 14 Z" fill="#000"/>
    </mask>
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

  <g id="nk-rig" mask="url(#bodyCut)">

    <!-- ================= tail =================
         Three separate strands with air between them, each wide at the dock
         and tapering to a point. The old tail was three near-identical shapes
         stacked with a gradient each, which only reads as a tail because of
         the shading; strip the shading and it is one blob. In the reference
         every hair group is its own ribbon and the gaps are the drawing. -->
    <g>
      <path d="M128 158 C 98 174, 72 214, 62 260 C 52 306, 58 352, 78 380
               C 74 340, 78 296, 96 258 C 112 224, 126 194, 136 178 Z" fill="{PINK}"/>
      <path d="M142 172 C 118 194, 98 232, 92 274 C 86 314, 90 350, 104 372
               C 102 334, 108 298, 122 266 C 134 238, 146 216, 152 198 Z" fill="{PINK}"/>
      <path d="M156 190 C 138 214, 126 246, 122 282 C 118 312, 122 338, 132 356
               C 130 324, 136 296, 146 270 C 156 246, 164 226, 168 210 Z" fill="{PINK}"/>
    </g>

    <!-- ================= off-side legs ================= -->
    <g opacity="{FAR}">
{leg(HIND_O, HIND_W, DARK, DARK)}
      {hoof(216, 391, 20, 17)}
{leg(FORE_O, FORE_W, DARK, DARK)}
      {hoof(349, 391, 20, 17)}
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
          fill="{PINK}"/>
    <!-- The shading, the muscle highlights and the two contour grooves that
         used to live here are gone. Flat means flat: one tone, and the
         silhouette carries the form. Where an edge is genuinely needed it is
         cut as a gap in #bodyCut, not drawn as a line on top. -->

    <!-- ================= neck: crest above, throat hollow below ========== -->
    <path d="M312 146
             C 330 114, 358 86, 394 70
             C 408 64, 420 61, 428 62
             L 432 104
             C 420 108, 404 118, 390 130
             C 372 145, 356 166, 344 188
             C 338 200, 334 210, 332 218
             C 330 194, 322 168, 312 146 Z"
          fill="{PINK}"/>

    <!-- ================= head =================
         Everything that used to be a dark mark here is a hole now: eye,
         nostril, inner ear. A mask rather than an even-odd subpath, because
         the eye still has to blink and a mask lets that one shape keep its own
         transform. The skull has to be inside the masked group with the rest —
         left outside it, the eye punched a hole in nothing. -->
    <g mask="url(#headCut)">
      <path d="M424 56
               C 444 52, 460 62, 468 80
               C 476 100, 486 124, 494 142
               C 499 154, 495 164, 484 166
               C 472 168, 459 160, 451 148
               C 438 130, 426 110, 420 92
               C 415 78, 416 62, 424 56 Z"
            fill="{PINK}"/>
      <path d="M472 138 C 486 138, 496 146, 496 155 C 496 164, 486 168, 475 166
               C 466 164, 460 157, 462 149 C 464 142, 467 139, 472 138 Z" fill="{PINK}"/>
      <path d="M418 58 L410 24 L436 50 Z" fill="{PINK}"/>
      <path d="M439 54 L442 26 L456 50 Z" fill="{PINK}"/>
    </g>
    <!-- the glint, sitting inside the eye hole -->
    <circle cx="450" cy="87" r="3" fill="{PINK}"/>

    <!-- ================= horn =================
         Longer and thinner than a real horn, which is how the reference draws
         it, and the spiral is three notches cut out of the pink rather than
         four lines ruled across it. -->
    <path d="M426 56 L452 48 L477 -22 Z" fill="{PINK}" mask="url(#hornCut)"/>
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

    <!-- ================= mane =================
         Four calligraphic strands off the crest, each thick at the root and
         run out to a point, with real gaps between them. This is the single
         most recognisable thing about the reference mascot — its mane is a
         set of brush strokes, not a shaded mass — and it is the reason the
         logo still reads as a unicorn at 20px. -->
    <g>
      <path d="M430 60 C 402 58, 372 78, 348 108 C 326 136, 310 170, 300 204
               C 314 186, 330 168, 346 156 C 362 128, 388 92, 412 72
               C 421 65, 427 61, 430 60 Z" fill="{PINK}"/>
      <path d="M420 84 C 398 96, 374 124, 356 156 C 340 184, 330 210, 326 232
               C 336 212, 350 190, 364 174 C 372 148, 390 116, 406 96
               C 411 90, 416 86, 420 84 Z" fill="{PINK}"/>
      <path d="M400 128 C 380 146, 362 174, 350 202 C 340 226, 334 246, 332 262
               C 340 244, 352 224, 364 210 C 370 188, 382 162, 394 142
               C 397 136, 399 130, 400 128 Z" fill="{PINK}"/>
      <path d="M374 186 C 358 204, 344 228, 336 252 C 330 270, 328 284, 328 294
               C 334 278, 342 262, 350 250 C 355 232, 364 210, 372 194
               C 373 191, 374 187, 374 186 Z" fill="{PINK}"/>
    </g>

    <!-- ================= near fore leg, planted ================= -->
{leg(FORE, FORE_W, LIMB, CAP)}
      {hoof(325, 391)}

    <!-- ================= pawing fore leg — the page rebuilds this shape ==== -->
    <g id="nk-leg">
      <path class="nk-leg-shape" d="{ribbon(FORE, FORE_W)}" fill="{PINK}"/>
      <g class="nk-leg-caps"></g>
      <g id="nk-hoof" transform="translate(325 391)">
        <path d="M-11 2.5 h22 l2 19 q0 5 -5 5 h-18 q-5 0 -5 -5 z" fill="{PINK}"/>
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
