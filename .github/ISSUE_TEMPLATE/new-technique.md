---
name: New technique entry
about: Propose a new technique (positional, normalization, residual, FFN/MoE, attention, long-context).
title: "[technique] <Name (abbreviation)>"
labels: ["new-technique"]
---

Thanks for proposing a new technique. Please fill in the checklist below — every
field maps to the Zod schema in `src/content/config.ts`. The validator in CI
will refuse any entry missing required fields.

## Bibliography & identity

- [ ] **Title:** <full descriptive name>
- [ ] **Abbreviation:** <short form used in code / hover labels>
- [ ] **Category:** one of `positional`, `normalization`, `residual`, `ffn-moe`, `attention`, `long-context`
- [ ] **Subcategory:** (optional) e.g. `rope-variant`, `sparse-attention`, ...
- [ ] **Year:** 4-digit, must be between 2010 and the current year
- [ ] **Month:** 1–12 (optional, but improves timeline placement)
- [ ] **Introduced by:** lead authors (e.g. "Su, Lu, et al.")
- [ ] **Paper title:** verbatim from the paper
- [ ] **arXiv ID:** e.g. `2104.09864`
- [ ] **Paper URL:** must be a valid URL (arXiv abs page preferred)

## Substance

- [ ] **Status:** one of `foundational`, `production-adopted`, `research`, `deprecated`
- [ ] **Problem solved:** one-sentence statement of what hurt before this technique
- [ ] **Summary:** 1–2 paragraphs (MDX body) — math + tiny PyTorch-flavored pseudo-code preferred
- [ ] **Tags:** open-vocabulary keywords (optional)
- [ ] **Facets:** (optional) one or more of `efficiency`, `training-stability`, `kv-cache`, `long-context`, `inference-only`, `hardware-aware`, `parameter-free`, `quality`, `routing`
- [ ] **Difficulty:** (optional) one of `intro`, `intermediate`, `advanced`
- [ ] **Prerequisites:** (optional) slugs of prerequisite technique entries

## Lineage

- [ ] **Predecessors:** slugs of techniques this builds on (e.g. `positional/sinusoidal`)
- [ ] **Successors:** slugs of techniques that supersede or extend this one (optional — usually filled in later)

## Adoption (citation policy §9)

For each adopting model, add an entry with **all three** fields:

- [ ] **model:** slug of a model in `src/content/models/` (the validator enforces this resolves)
- [ ] **source_url:** primary citation URL (model card / tech report / paper section)
- [ ] **notes:** (optional) short note disambiguating the role (e.g. "every layer", "decoder only")

Entries missing `source_url` will fail CI.

## Tradeoffs and cost (all optional)

- [ ] **tradeoffs.pros / cons / when_to_use / when_to_avoid:** short bullet lists
- [ ] **cost.params_overhead / flops_overhead / kv_cache_overhead / inference_only:** terse comparisons vs the baseline
- [ ] **ablations:** array of `{ paper, baseline, metric, delta, notes? }` entries
- [ ] **open_questions:** bullet list of unresolved empirical/theoretical questions

## Figure (optional)

- [ ] **figure_component:** filename in `src/components/figures/` (e.g. `RopeRotor`); must exist
- [ ] **figure_caption:** plain text caption

## Provenance

- [ ] **last_verified:** YYYY-MM-DD (today's date when frontmatter is finalized)
- [ ] **order:** (optional) numeric override for chronological-tie-breaks

---

Once you open a PR, `pnpm qa` will run the schema validator, type-check the
MDX, and build the site. `pnpm check:links` is recommended if you added new
URLs.
