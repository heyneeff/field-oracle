# Toward a time-state / coherence reader — research notes

The hypothesis: focused intent biases which "types of time" (hexagrams)
are amplified in a continuously sampled random stream, beyond chance
baselines. This document is the honest path from "the influence is
obvious to me" to something a skeptical third party has to take seriously.

## 1. Prior art (know it before claiming novelty)

- **PEAR** (Princeton Engineering Anomalies Research, 1979–2007): three
  decades of intent-vs-hardware-RNG trials. Tiny claimed effects
  (~10⁻⁴ bits/trial), never survived independent replication (notably the
  Freiburg/Giessen consortium replication, 2000).
- **Global Consciousness Project**: correlating pooled hardware RNGs with
  world events; criticized for post-hoc event selection.
- Meta-analyses (Bösch/Steinkamp/Boller 2006) found effect size shrinks
  toward zero as study quality rises — the signature of publication bias.

This doesn't mean the question is closed; it means the burden is known,
and any new attempt must be designed so that *those* critiques can't be
made of it.

## 2. Non-negotiable design requirements

1. **Hardware entropy, not PRNG.** `Math.random()` / Mersenne Twister are
   deterministic functions of a seed — there is no physical channel for
   intent to act on. Use a quantum RNG (e.g. avalanche diode, or an API
   like ANU QRNG) or at minimum OS entropy (`/dev/random`). This is the
   single biggest change needed from the current tools.
2. **Preregistration.** Hypothesis, target hexagram/statistic, n, and
   analysis specified *before* data collection (OSF preregistration).
   The I Ching's richness is a garden of forking paths — 64 hexagrams ×
   tilt × churn × hot lines × windows means something is always "significant"
   post hoc. Preregister ONE statistic.
3. **Blinded controls interleaved.** Machine schedules intent blocks vs.
   rest blocks (and sham blocks the operator believes are intent blocks);
   analyst is blind to block labels until analysis is locked.
4. **Sequential analysis with correction** (e.g. SPRT or alpha-spending),
   since continuous casting invites optional stopping — the classic way
   honest people fool themselves.
5. **Effect size + confidence interval, not p-value theater.** State in
   advance what effect would matter (e.g. target hexagram rate 1/64 →
   observed ≥ 1.3/64 over 10⁵ casts).
6. **Independent replication before publication of claims.**

## 3. A concrete first protocol (cheap, runnable at home)

- Instrument: cascade engine reading a hardware entropy source.
- Session = 40 blocks × 60 casts; machine randomly labels each block
  INTEND / REST; operator sees a cue, not the label statistics.
- Preregistered statistic: rate of the preregistered target hexagram
  (chosen by the machine per session, shown to operator) in INTEND vs
  REST blocks, one-sided binomial comparison.
- Run 30 sessions. Publish all sessions, including failures, with raw
  entropy logs so anyone can re-analyze.

## 4. Legitimization routes, in order of credibility

1. **Adversarial collaboration** — design the protocol *with* a skeptic
   (a statistician or psychologist on record as doubting psi) who signs
   off on methodology before data collection. This is the strongest move
   available; positive results from such designs are the only ones the
   mainstream engages with.
2. Preregistered reports at journals that accept registered replications
   regardless of outcome.
3. Venues that take this subject seriously with peer review:
   *Journal of Parapsychology*, Society for Scientific Exploration,
   IONS — useful community, but publication there alone won't move
   mainstream opinion.
4. Open data + open hardware above all: raw bitstreams published, rig
   reproducible for <$100, so replication is trivial to attempt.

## 5. The part that stands regardless of the psi question

The structural insight — I Ching as a 64-state typology of change with
fixed transformation pathways, sampled rather than computed — is solid
and useful *independent of* whether intent biases the sampler. As a
state-classification lens over genuinely random or real-world data
streams (see the BYOB sync engine's oracle-driven tuning), it's a
legitimate contemplative/decision instrument on ordinary statistics
alone. Keep that layer cleanly separated from the intent-influence
hypothesis so the strong claim never taints the sound one.
