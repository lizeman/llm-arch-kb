---
name: New model spec sheet
about: Propose a new production model entry under src/content/models/.
title: "[model] <Model name>"
labels: ["new-model"]
---

Thanks for proposing a new model spec sheet. Every field below maps to the Zod
schema in `src/content/config.ts`. The validator in CI will reject entries that
violate the citation policy (§9).

## Identity

- [ ] **name:** full canonical name (e.g. "Llama 3.1 70B")
- [ ] **slug:** (optional override) defaults to the filename stem
- [ ] **organization:** e.g. "Meta", "DeepSeek", "Anthropic"
- [ ] **release_date:** YYYY-MM-DD
- [ ] **parameters_total:** human-readable size (e.g. "70B", "236B (37B active)")
- [ ] **parameters_active:** (optional) for MoE models, the active-per-token count
- [ ] **context_length:** positive integer (training-time max context)
- [ ] **open_weights:** true / false
- [ ] **parent_model:** (optional) slug of a related model this is derived from (e.g. instruct of base)

## Disclosure (citation policy §9)

- [ ] **disclosure_level:** one of `open`, `documented`, `partial`, `undisclosed`

If `undisclosed`, **every** field of the `architecture` object below MUST be
`null`. The validator enforces this.

## Architecture

For each slot, list the exact technique name used in the model. Use `null` for
unknown/undisclosed.

- [ ] **architecture.positional:** e.g. "RoPE base 500k", "ALiBi", null
- [ ] **architecture.normalization_placement:** "pre-norm", "post-norm", "sandwich", null
- [ ] **architecture.normalization_type:** "RMSNorm", "LayerNorm", null
- [ ] **architecture.qk_norm:** true / false / null
- [ ] **architecture.activation:** "SwiGLU", "GeGLU", "ReGLU", "ReLU", null
- [ ] **architecture.attention:** "MHA", "GQA-8", "MQA", "MLA", "GQA-8 + sliding-window 4k", null
- [ ] **architecture.moe:** "64 experts top-2 + 1 shared", null for dense
- [ ] **architecture.other:** array of free-form strings for one-offs (e.g. "muP init")

## Citations (required)

- [ ] **paper_url:** (optional, but preferred) URL of the tech report or paper
- [ ] **model_card_url:** (optional) HF or vendor model card URL
- [ ] **source_urls:** non-empty array of citations. **Every architectural claim must trace to at least one entry here.** Pick from: arXiv tech report, model card, official blog post, weights repo README, Open Review.

## Notes

- [ ] **notes:** (optional) short context — e.g. "GQA-2 confirmed in config.json"

---

Once you open a PR, `pnpm qa` will run the schema + citation-policy validator,
type-check, and build the site. `pnpm check:links` is recommended if you added
new URLs.
