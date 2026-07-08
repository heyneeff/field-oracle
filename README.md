# Field Oracle

Instruments for reading the I Ching as a **state engine** rather than a
fortune-telling device — sampling structure space (Indra's Net) at three
resolutions:

| Instrument | Samples | Reads |
|---|---|---|
| `iching` (single cast, lives at `/usr/local/bin/iching`) | a point | position |
| `cli/cast_field.py` (ensemble, default n=1000) | a field | clustering / weather |
| `cli/iching-cascade` (continuous) | a time series | drift, churn, recurrence, runs |
| `web/field-oracle.html` (FO-64 console) | a time series, visually | the same, as an instrument panel |

All four share the same mechanics: three-coin method (P(moving line) = 25%),
King Wen sequence lookup, identical hexagram math. Only the sampling
strategy differs.

## The framing

Each hexagram is one of 64 **types of time** — configurations of change —
all of which are latently present in every node of the net. A casting
method (yarrow, coins, RNG) doesn't create the hexagram; it's a map that
selects which type is currently amplified at this local node. The mapping
pathways are fixed (a given line pattern always resolves to the same
hexagram, a given moving line always transforms the same way); only the
sampling point is open. Continuous casting watches which types of time are
prevalent *now*, how strongly (coherence), and where the flow points
(transformations).

What the instruments measure, concretely:

- **Tilt** — EMA of yang fraction (baseline 50%): the field's polarity tide.
- **Churn** — moving-line rate (exact baseline 25%): how much the field is
  in transition vs. settled.
- **Recurrence / coherence** — a hexagram repeating above its 1/64 chance
  rate inside a rolling window: a type of time amplifying.
- **Hot threads** — a line position staying in motion across casts.
- **Attractor flow** — where transformed hexagrams cluster: the direction
  the field points, not just where it stands.

## Running

```
# continuous cascade in the terminal
cli/iching-cascade "question" [--interval 0.6] [--n 0] [--window 32]

# ensemble reading
python3 cli/cast_field.py "question" --n 1000

# console (FO-64) — open in a browser, no build, no dependencies
open web/field-oracle.html
```

## Honest footing

These are contemplative instruments amplified by structured randomness.
The flags (recurrence, hot lines, runs) *will* fire at their chance
baselines in a truly random stream — the reading is in whether they
cluster and persist beyond baseline, and every readout states its
baseline for exactly that reason. Claims beyond that — e.g. that intent
influences the stream — are experimental hypotheses; see
`docs/RESEARCH.md` for what testing them properly would require.
