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
# Stylised, not anatomical. Five rounds of trying to draw a correct horse in
# flat colour produced five chunky horses: realism is what the reference is
# NOT doing, and a naturalistic body carries no elegance once the shading that
# was describing it comes off. So the proportions are pushed instead —
# legs at 61% of total height against a real horse's ~52%, and a barrel 39%
# deep against ~48%. Exaggeration is what makes a flat mark read as graceful.
FORE   = [(322, 196), (330, 290), (326, 368), (325, 396)]
FORE_W = [46, 25, 18, 15]
# near hind: stifle, hock, fetlock, pastern — the hock kicks back, and that
# zig-zag is the single strongest "this is a horse" signal in a silhouette
HIND   = [(185, 190), (150, 285), (172, 368), (176, 396)]
HIND_W = [60, 29, 20, 17]
# off-side pair, separated from the near pair by a gap rather than by tone
FORE_O   = [(346, 198), (352, 292), (350, 369), (349, 396)]
HIND_O   = [(215, 194), (190, 288), (208, 369), (211, 396)]

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
    '            transform="translate(325 410) scale(0)"/>' % (r * 2.3)
    for r in RADII)

# A dark ring outside the pink rim. The coins are dark discs and the unicorn
# is now bright pink, so wherever a coin crossed the body it stopped reading as
# an object in front of the horse and started reading as a hole punched in it.
# On the black background the ring costs nothing — it is the same value as the
# page. On the horse it is the whole difference between a coin and a wound.
coins = "\n".join(
    '    <g class="nk-coin" transform="translate(325 410) scale(0)" opacity="0">\n'
    '      <circle r="%.1f" fill="none" stroke="#141018" stroke-width="3.6"/>\n'
    '      <circle r="%d" fill="url(#coinFace)" stroke="#ff37c7" stroke-width="2.2"/>\n'
    '      <circle r="%.1f" fill="none" stroke="#fc72ff" stroke-width="1.1" opacity="0.5"/>\n'
    '      <g transform="scale(%.3f) translate(-12 -12)" fill="#ffe9fa">\n'
    '        <use class="nk-glyph" href="#gl-%s"/>\n'
    '      </g>\n'
    '    </g>' % (r + 2.9, r, r - 6.5, (r * 1.16) / 24, POOL[i % len(POOL)][0])
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
      <g stroke="#000" fill="none" stroke-linecap="round">
        <!-- Only three gaps now, and each one separates two whole masses.
             The previous pass ran a thin stroke under every mane strand and
             across the girth and haunch, and at size those read as scratches
             scribbled on the animal rather than as drawing. Where the mane and
             the tail needed to read, the answer was to reshape them so they
             overhang the silhouette — not to score lines into it. -->
        <path d="M152 158 C 138 186, 134 218, 142 246" stroke-width="8"/>
        <!-- and between each near leg and the far one behind it -->
        <path d="M338 222 C 344 272, 342 336, 341 400" stroke-width="5"/>
        <path d="M206 200 C 186 262, 197 336, 200 400" stroke-width="5"/>
      </g>
    </mask>
    <mask id="headCut" maskUnits="userSpaceOnUse" x="396" y="-4" width="112" height="146">
      <rect x="396" y="-4" width="112" height="146" fill="#fff"/>
      <!-- The eye is a hole, and it has to be a big one. In the reference the
           eye is the largest piece of negative space on the head — it is what
           makes the thing a character rather than a silhouette. -->
      <ellipse id="eye" cx="446" cy="66" rx="9" ry="10.5" transform="rotate(-16 446 66)" fill="#000"/>
      <circle cx="484" cy="118" r="3.8" fill="#000"/>
      <path d="M418 28 L411 6 L430 25 Z" fill="#000"/>
      <!-- The jaw gap belongs here, not in #bodyCut. #bodyCut sits on an
           ancestor that does not rotate, so with the head nodding the gap
           stayed put while the jaw swung through it — cutting the cheek in
           the wrong place at one end of the nod and not at all at the other.
           #headCut is referenced from inside the rotating group, so it
           follows the head. -->
      <path d="M424 60 C 431 84, 445 104, 466 116" stroke="#000" stroke-width="5"
            fill="none" stroke-linecap="round"/>
    </mask>
    <!-- Two notches, each biting in from the trailing edge and stopping short
         of the leading one. Cut all the way across — as the first pass did —
         and the horn stops being a horn and becomes three floating shards. -->
    <mask id="hornCut" maskUnits="userSpaceOnUse" x="414" y="-52" width="70" height="96">
      <rect x="414" y="-52" width="70" height="96" fill="#fff"/>
      <path d="M452 8 L440.5 12.5 L442.5 16.5 L453 12 Z" fill="#000"/>
      <path d="M460 -12 L450.5 -8 L452.5 -4 L461 -8 Z" fill="#000"/>
    </mask>
{glyph_defs}
  </defs>

  <style>
    @keyframes blink{{0%,95%,100%{{transform:scaleY(1)}}97.5%{{transform:scaleY(.08)}}}}
    #eye{{transform-box:fill-box;transform-origin:center;animation:blink 6.5s ease-in-out infinite}}

    /* Wind. Each strand pivots about its own root on the crest, so the hair
       swings from where it is attached instead of sliding around — which is
       what the alternative, morphing the path data, would have looked like,
       at the price of re-tessellating four paths sixty times a second.

       A rotation about an arbitrary point without touching transform-origin:
       translate to the pivot, rotate, translate back. On an SVG element a CSS
       px is one user unit, so these are the same numbers as the path data.

       One duration for all four with the delay staggered down the neck, which
       is what makes it a travelling wave rather than four strands flapping in
       unison. Amplitude falls off toward the shoulder, where a real mane is
       shorter and heavier. */
    @keyframes w1{{0%,100%{{transform:translate(420px,34px) rotate(-2.1deg) translate(-420px,-34px)}}
                   50%{{transform:translate(420px,34px) rotate(2.3deg) translate(-420px,-34px)}}}}
    @keyframes w2{{0%,100%{{transform:translate(400px,50px) rotate(-1.8deg) translate(-400px,-50px)}}
                   50%{{transform:translate(400px,50px) rotate(2deg) translate(-400px,-50px)}}}}
    @keyframes w3{{0%,100%{{transform:translate(376px,70px) rotate(-1.5deg) translate(-376px,-70px)}}
                   50%{{transform:translate(376px,70px) rotate(1.7deg) translate(-376px,-70px)}}}}
    @keyframes w4{{0%,100%{{transform:translate(350px,92px) rotate(-1.1deg) translate(-350px,-92px)}}
                   50%{{transform:translate(350px,92px) rotate(1.3deg) translate(-350px,-92px)}}}}
    /* the tail answers the same wind, at half the amplitude and off-tempo —
       a still tail beside a moving mane looks broken */
    @keyframes wt{{0%,100%{{transform:translate(152px,150px) rotate(-1.2deg) translate(-152px,-150px)}}
                   50%{{transform:translate(152px,150px) rotate(1.2deg) translate(-152px,-150px)}}}}

    /* Standing dead still between paws is the other half of looking fake.
       This is a breath and a weight shift, nothing more: a fraction of a
       percent of vertical scale about the ground line, and a pixel of sway,
       on two periods that do not divide into each other so the pair never
       repeats the same combination twice in a row.

       It lives on a wrapper because the strike writes its own transform
       attribute to #nk-rig for the impact dip — a CSS transform on the same
       element would silently win and the dip would vanish. */
    @keyframes idle{{0%{{transform:translate(0,0) scaleY(1)}}
                     50%{{transform:translate(-1.1px,-0.6px) scaleY(1.006)}}
                     100%{{transform:translate(0,0) scaleY(1)}}}}
    #nk-idle{{transform-origin:296px 420px;transform-box:view-box;
      animation:idle 5.3s cubic-bezier(.45,0,.55,1) infinite;animation-play-state:paused}}
    svg.nk-live #nk-idle{{animation-play-state:running}}

    #nk-mane path,#nk-tail{{animation-duration:6.4s;animation-timing-function:cubic-bezier(.45,0,.55,1);
      animation-iteration-count:infinite;animation-direction:alternate;animation-play-state:paused}}
    .w1{{animation-name:w1;animation-delay:0s}}
    .w2{{animation-name:w2;animation-delay:-.4s}}
    .w3{{animation-name:w3;animation-delay:-.8s}}
    .w4{{animation-name:w4;animation-delay:-1.2s}}
    #nk-tail{{animation-name:wt;animation-duration:8.2s;animation-delay:-2s}}
    /* only while the mascot is actually on screen — the strike loop already
       gates itself the same way and toggles this class */
    svg.nk-live #nk-mane path,svg.nk-live #nk-tail{{animation-play-state:running}}

    @media (prefers-reduced-motion:reduce){{
      #eye{{animation:none}}
      #nk-mane path,#nk-tail,#nk-idle{{animation:none}}
    }}
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

  <g id="nk-idle">
  <g id="nk-rig">
  <g mask="url(#bodyCut)">

    <!-- ================= tail =================
         Three separate strands with air between them, each wide at the dock
         and tapering to a point. The old tail was three near-identical shapes
         stacked with a gradient each, which only reads as a tail because of
         the shading; strip the shading and it is one blob. In the reference
         every hair group is its own ribbon and the gaps are the drawing. -->
    <g id="nk-tail">
      <path d="M146 146
               C 122 168, 100 208, 88 254
               C 76 300, 74 342, 84 372
               C 86 336, 94 300, 106 270
               C 98 302, 96 332, 100 356
               C 110 320, 122 288, 134 262
               C 130 292, 130 316, 134 336
               C 142 300, 152 264, 158 232
               C 164 200, 166 170, 162 152 Z" fill="{PINK}"/>
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

    <!-- ================= barrel =================
         The old one was 232 long by 152 deep sitting on 139 of visible leg:
         a ratio of 1.5 on a body that should be nearer 1.8, standing on legs
         shorter than it was deep. That is the whole reason it read as a blob
         on sticks, and no amount of colour was going to fix it.

         This one is 248 by 148 with 152 of leg under it — leg length about
         equal to barrel depth, which is what a horse actually is. The
         underline is deliberately not a symmetric arc: deepest at the girth
         a third back from the chest, then rising to a tucked flank. That
         slant is most of what makes a horse look like a horse. -->
    <!-- ================= body and neck, one outline =================
         These used to be two paths that overlapped: the neck's crest cut
         across the barrel's topline at about seventy degrees and left a hard
         notch at the withers — visible as a wedge of background bitten out of
         the shoulder. Two curves can be made to meet tangentially, but it is
         a fragile thing to hand-tune and it drifts the moment either shape
         moves.

         So there is no junction any more. One outline runs from the poll,
         down the throat, along the belly, up over the croup, forward across
         the back, and up the crest — and the withers is just a place on it.
         Continuity is a property of the path now rather than something two
         shapes have to agree about.

         Two edges still do opposite things, which is the whole of a horse's
         neck: the crest bows out over the top, the throat bows *in* below
         the jaw. -->
    <path d="M430 31
             L 436 76
             C 418 86, 398 106, 384 122
             C 368 142, 352 164, 344 186
             C 342 200, 340 212, 332 220
             C 318 230, 288 236, 254 238
             C 214 240, 174 234, 152 220
             C 140 208, 134 190, 138 172
             C 142 154, 156 143, 178 136
             C 212 127, 252 122, 284 118
             C 302 112, 314 102, 326 90
             C 344 68, 364 48, 386 37
             C 402 30, 418 28, 430 31 Z"
          fill="{PINK}"/>
    <!-- The shading, the muscle highlights and the two contour grooves that
         used to live here are gone. Flat means flat: one tone, and the
         silhouette carries the form. Where an edge is genuinely needed it is
         cut as a gap in #bodyCut, not drawn as a line on top. -->

    <!-- ================= neck =================
         Convex along the crest, concave under the throat. The old one was
         near-parallel top and bottom, which is why it read as a tube. -->


    <!-- ================= head =================
         Everything that used to be a dark mark here is a hole now: eye,
         nostril, inner ear. A mask rather than an even-odd subpath, because
         the eye still has to blink and a mask lets that one shape keep its own
         transform. The skull has to be inside the masked group with the rest —
         left outside it, the eye punched a hole in nothing. -->
    <!-- head, horn and the horn's light in one group so the nod carries all
         three. The eye/nostril/ear cuts live in a userSpaceOnUse mask on the
         inner group, and a userSpaceOnUse mask resolves in the coordinate
         system the referencing element sits in — so it rotates with an
         ancestor transform and the eye stays in the skull. Verified rather
         than assumed. -->
    <g id="nk-head">
    <g mask="url(#headCut)">
      <path d="M424 32
               C 441 28, 454 38, 460 53
               C 466 69, 474 89, 480 105
               C 485 116, 480 126, 469 128
               C 458 130, 448 122, 442 110
               C 433 93, 425 76, 420 61
               C 416 48, 417 36, 424 32 Z"
            fill="{PINK}"/>
      <path d="M470 104 C 483 104, 492 111, 492 119 C 492 127, 483 131, 473 129
               C 465 127, 459 121, 461 114 C 463 107, 466 105, 470 104 Z" fill="{PINK}"/>
      <path d="M417 34 L408 2 L434 28 Z" fill="{PINK}"/>
      <path d="M438 30 L442 4 L455 28 Z" fill="{PINK}"/>
    </g>
    <!-- the glint, sitting inside the eye hole -->
    <circle cx="449" cy="61" r="2.7" fill="{PINK}"/>

    <!-- ================= horn =================
         Longer and thinner than a real horn, which is how the reference draws
         it, and the spiral is three notches cut out of the pink rather than
         four lines ruled across it. -->
    <path d="M421 33 L447 24 L474 -46 Z" fill="{PINK}" mask="url(#hornCut)"/>
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
    </g><!-- /nk-head -->

  </g><!-- /masked body -->

    <!-- ================= mane =================
         Four calligraphic strands off the crest, each thick at the root and
         run out to a point, with real gaps between them. This is the single
         most recognisable thing about the reference mascot — its mane is a
         set of brush strokes, not a shaded mass — and it is the reason the
         logo still reads as a unicorn at 20px.

         Deliberately OUTSIDE the mask. No gap in #bodyCut touches the mane,
         and a child animating inside a masked group makes the browser redo
         the mask every frame — the wind would have been charging the whole
         body for something only four paths are doing. -->
    <!-- A mane drawn on the neck is a mane you cannot see: same colour, inside
         the same outline. It has to leave the silhouette. These three sweep
         back off the crest into the open dark above the withers, which is the
         only empty space adjacent to the neck — and a mane blown back happens
         to be what the reference does with its own strands. -->
    <g id="nk-mane">
      <!-- Lengths deliberately uneven and strand 3 crossing under strand 2.
           Four parallel ribbons ending on one diagonal read as a blade; hair
           does not do that. -->
      <path class="w1" d="M420 30
               C 358 22, 250 36, 180 58
               C 158 65, 144 70, 138 74
               C 158 72, 192 67, 222 64
               C 300 55, 382 43, 414 39
               C 418 36, 420 32, 420 30 Z" fill="{PINK}"/>
      <path class="w2" d="M402 46
               C 352 46, 274 62, 212 86
               C 192 94, 174 101, 168 106
               C 188 101, 214 95, 238 90
               C 300 78, 360 64, 396 56
               C 400 52, 402 50, 402 46 Z" fill="{PINK}"/>
      <path class="w3" d="M378 64
               C 322 68, 244 88, 176 110
               C 154 117, 138 123, 132 127
               C 154 122, 184 114, 212 107
               C 282 90, 346 76, 372 72
               C 376 70, 378 67, 378 64 Z" fill="{PINK}"/>
      <path class="w4" d="M352 88
               C 312 92, 262 106, 224 120
               C 212 124, 204 127, 200 129
               C 216 125, 236 120, 254 116
               C 296 106, 336 96, 348 93
               C 351 91, 352 90, 352 88 Z" fill="{PINK}"/>
    </g>

    <!-- ================= pawing fore leg — the page rebuilds this shape ====
         There used to be a second, static copy of this same leg drawn right
         here, from the same FORE skeleton, and it never moved. So the horse
         always had a foreleg standing on the ground: when the pawing limb
         lifted, the copy stayed behind. That is the leg that "stays put at
         the moment of impact" — not a fault in the animation, a duplicate
         underneath it. The animated one is the near fore; four legs total. -->
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

  </g><!-- /nk-idle -->

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
