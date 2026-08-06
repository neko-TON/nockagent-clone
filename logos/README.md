# Asset icons

Each ticker renders as a chip in the site's own language — dark disc, green
rim, mint glyph — with the rim dash pattern varied per asset so a row of them
stays separable at a glance.

## Where the marks come from

The brand glyphs are from [Simple Icons](https://simpleicons.org) v13, which
is released under **CC0 1.0** (public domain). They were recoloured to the
site's mint and composed onto the chip; the paths themselves are unmodified.

The brand names and logos remain trademarks of their respective owners. They
appear here only to identify the asset a row refers to — the same use a broker
or a market-data page makes of them. Nothing here implies endorsement by, or
affiliation with, any of these companies.

## Exceptions

| Ticker | Source |
|---|---|
| `MSFT` | Typographic chip — Microsoft is not in the Simple Icons set (removed upstream), and tracing the mark by hand is not appropriate. |
| `AVGO` | Typographic chip — no icon in the set. |

Any ticker without a file here falls back to the component's own monogram, so
adding or removing an asset degrades gracefully.

## Adding one

Drop a `SYMBOL.svg` into this directory. `TokenLogo` resolves
`/logos/${SYMBOL}.svg` and falls back to the monogram if the request fails.
