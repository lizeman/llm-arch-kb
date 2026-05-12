# Figure audit notes — Track C

**Date:** 2026-05-11
**Spec:** `docs/superpowers/specs/2026-05-11-website-improvements-design.md` §2.3
**Plan:** `docs/superpowers/specs/2026-05-11-website-improvements-plan.md` Track C

Each entry is an issue I noticed while auditing a figure that I chose **not** to fix in
this track — either because the issue is a deeper math claim (where silently rewriting
would be worse than leaving the present behavior) or because the fix is out of scope
(e.g. a visual chrome change that would belong to a later polish pass).

## Deferred issues

### `src/components/figures/AlibiSlopes.tsx` — figcaption formula
Lines ~202–207 (the inline figcaption).
The figcaption states `m_h = 2^(-8h/H)`. In the canonical ALiBi schedule, head 0 has
slope `2^(-8/H)` (i.e. effectively the 1-indexed formula `m_h = 2^(-8(h+1)/H)` if h is
0-indexed), not `2^(-8h/H)` which would give head 0 a slope of 1. The code is correct;
the on-screen numeric values are correct; only the inline formula written next to the
figure simplifies the schedule. Writing pass / Track D should reconcile.

### `src/components/figures/AttentionSinks.tsx` — cache-size readout for pos < sinks
Lines ~104–108.
The statistic `cache size: sinks + min(W, pos − sinks + 1) tokens` underflows to less
than `sinks` when the position slider is dragged below the sinks count — the formula
implicitly assumes `pos ≥ sinks`. The visual cell coloring is correct (only `t ≤ pos`
tokens render as live), but the statistic gives a misleading number for the edge case.
A correct formula is `min(sinks, pos+1) + max(0, min(W, pos − sinks + 1))`.

### `src/components/figures/DsaIndexer.tsx` — seed slider has very weak effect
Lines ~15–27.
`indexerScore` mixes six fixed "needle" Gaussian peaks plus seed-dependent noise scaled
by 0.25 of the per-bucket noise floor. The peak positions dominate the score function,
so the "query seed" slider only nudges which 30-something keys end up just under the
top-K cutoff. Caption says "regenerate score pattern"; visually the change is subtle.
Either rework the score function to make the seed dominant, or relax the caption to
say "perturb the score noise".

### `src/components/figures/AlibiSlopes.tsx` — slopes bar visual scale
Line ~143: `const h = s * slopePxScale * 8;` — the `* 8` is documented as "emphasize
visually" but with steep-slope heads (head 0 at H=4: slope ≈ 0.594) the bar ends up
~285 px tall, well above the panel intent. Clamping or recomputing maxBar would be a
modest improvement; not a render bug.

### `src/components/figures/RopeBaseSweep.tsx` — figcaption inline computation
Line ~148 of the figcaption: the inline expression
`data().filter((d, _, a) => d.rotations >= 1 && Math.abs(Math.pow(10, 4) - 10000) < 1).length`
is misleading. `Math.abs(Math.pow(10, 4) - 10000)` is always 0, so the filter reduces to
`d.rotations >= 1` for the **current** base, not for base 10000 specifically. The
adjacent `fastCount()` / `slowCount()` render the same numbers so the user does see a
plausible count, but the prose claims it represents base-10000. Writing pass should
rephrase or compute against a fixed base.

### `src/components/figures/MhaMqaGqaMla.tsx` — units in cache readout
Line ~155–157: the on-screen text shows `(cache() * 2 / 1024).toFixed(1)} KB`. The
multiplication by 2 is the fp16 bytes-per-element factor, but the variable name `cache`
elsewhere is in **elements**. This works numerically but a future maintainer might
double-apply the factor. Renaming `cache → cacheElements` and computing
`cacheBytes = cacheElements * 2` once would make this safer; not a current bug.

## Decorative-chrome / Calm-Editorial observations (out of scope for Track C)

Per `plan-final.md` §3.4 anti-patterns, future-polish candidates:

- `src/components/figures/AuxLossFreeBias.tsx` — buttons use inline style attributes
  with `border-radius: 2px`. Plan-final §3.4 allows 2px but discourages adding chrome.
  The buttons would benefit from the shared `.controls button` styling once any common
  style exists.
- `src/components/figures/SlidingWindow.tsx`, `BigBirdSparse.tsx`, `NoPeOrder.tsx`,
  `LongnetDilated.tsx` — all use a soft `#fafaf7` grid background behind the matrix.
  This is fine but is one of the few uses of a non-`--accent` decorative color in the
  figures; consider unifying to a single token.

## Fixed in Track C

(Recorded here for tracing; see the individual commits.)

1. `RopeRotor.tsx` arc sweep direction (commit `3f9636a`).
2. `LandmarkAttention.tsx` SVG title color reference (commit `f5f493a`).
3. `MemorizingKnn.tsx` SVG title color reference (commit `567da1a`).
4. `QkNormLogits.tsx` slider aria-label string interpolation (commit `91b6fd3`).
5. `RopeBaseSweep.tsx` log-scale y-axis label for v=1 (commit `6854a17`).
6. `SandwichVsPre.tsx` non-deterministic initial vector (commit `7333b3c`).
7. `YarnBands.tsx` swapped fast/slow band annotations (commit `a2d1af6`).
