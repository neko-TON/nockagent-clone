#!/usr/bin/env python3
"""Stop tables for every glow on the site.

Why this file exists instead of hand-written gradients:

A two-stop `radial-gradient(pink, transparent)` ramps alpha down *linearly* and
then simply stops. Alpha is continuous at the rim but its slope is not — it
drops from constant to zero in one step. Lateral inhibition in the retina
differentiates exactly that, so a slope discontinuity is seen as a faint ring:
a Mach band. That ring is why a soft gradient still reads as a pasted disc.

So every kernel here satisfies f(1)=0 AND f'(1)=0. The glow runs out of light
instead of running into an edge.

  area(t)  = (1-t^2)^3            the poly6 kernel; f'(0)=0 too, so the core is
                                  a soft pool rather than a spike. For anything
                                  with size: the body aura, the ground pools.
  point(t) = windowed Lorentzian  a tight core over a long tail, which is what
             + a little poly6     a small bright source actually looks like.
                                  For the horn tip and struck coins.

Colour drifts along the radius as well. A real bloom is hottest and least
saturated at the core and keeps its hue in the halo, so these run
near-white -> brand pink -> violet rather than one colour fading out. The drift
does more for "this is light" than the falloff does.
"""

# core -> mid -> rim, as (position, #rrggbb)
RAMP = ((0.0, "#ffe9fa"), (0.35, "#ff37c7"), (1.0, "#7850ff"))       # brand pink
VIOLET = ((0.0, "#efe4ff"), (0.35, "#7850ff"), (1.0, "#4322a8"))
ROSE = ((0.0, "#fff0f4"), (0.35, "#ff5a8c"), (1.0, "#b03cd8"))


def _hex(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def hue(t, ramp=RAMP):
    """sRGB colour at radius t along the ramp."""
    for (p0, c0), (p1, c1) in zip(ramp, ramp[1:]):
        if t <= p1 or p1 == 1.0:
            k = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
            a, b = _hex(c0), _hex(c1)
            return tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
    raise AssertionError


def area(t):
    return (1 - t * t) ** 3


def point(t):
    w = (1 - t * t) ** 2                      # window: forces f(1)=f'(1)=0
    core = 1.0 / (1.0 + (t / 0.085) ** 2)     # tight bright centre
    return 0.80 * core * w + 0.20 * area(t)


def stops(kernel, peak, n=12, ramp=RAMP):
    """[(offset 0..1, (r,g,b), alpha)] — peak is the alpha at the centre."""
    out = []
    for i in range(n):
        t = i / (n - 1)
        out.append((t, hue(t, ramp), round(kernel(t) * peak, 4)))
    return out


def svg(gid, kernel, peak, n=12, ramp=RAMP, extra=""):
    body = "\n".join(
        '      <stop offset="%s%%" stop-color="#%02x%02x%02x" stop-opacity="%g"/>'
        % (round(t * 100, 1), c[0], c[1], c[2], a)
        for t, c, a in stops(kernel, peak, n, ramp))
    return ('    <radialGradient id="%s" cx="50%%" cy="50%%" r="50%%"%s>\n%s\n'
            '    </radialGradient>' % (gid, extra, body))


def css(kernel, peak, n=12, ramp=RAMP):
    return ", ".join(
        "rgba(%d,%d,%d,%g) %s%%" % (c[0], c[1], c[2], a, round(t * 100, 1))
        for t, c, a in stops(kernel, peak, n, ramp))


if __name__ == "__main__":
    # The whole point is the slope the gradient carries into its own rim: that
    # is what the eye turns into a ring. Compare against the two-stop ramp
    # these replace, sampled the same way.
    n = 12
    linear = 1.0 / (n - 1)
    for name, k in (("area", area), ("point", point)):
        s = [a for _, _, a in stops(k, 1.0, n)]
        last = s[-2] - s[-1]
        print("%-6s terminal slope %.4f vs linear %.4f  -> %.0fx shallower"
              % (name, last, linear, linear / last))
    print()
    for label, peak, ramp in (("wash-pink  ", 0.115, RAMP),
                              ("wash-violet", 0.085, VIOLET),
                              ("wash-rose  ", 0.062, ROSE),
                              ("hero-orb   ", 0.300, RAMP)):
        print(label, ":", css(area, peak, 10, ramp))
        print()
