# Researcher-grade technique entries

**Date:** 2026-05-12
**Status:** Draft — pending user review
**Supersedes:** Depth floor for technique entries in `plan-final.md` §3 / §7

## 1. Motivation

`plan-final.md` §31 defines the entry depth as "medium deep-dive": math, implementation sketch, tradeoffs, ablation results, adopting models. Current entries (MLA at 117 lines, GQA at 151 lines, RoPE at 173 lines) meet that spec faithfully.

In practice that depth now reads as too thin for the intended reader. The fix is not a UI change — it is a content-depth shift toward what a researcher reproducing the method from a paper would want to read in one place, top to bottom.

## 2. Target reader

A researcher (or strong practitioner) reading the entry to internalize the method well enough to teach it, critique it, or reimplement its math correctly. Not a passive learner; not a copy-paste engineer.

Implication: the depth budget goes into the math derivation and the empirical evidence — not into runnable reference code, hyperparameter tables, or kernel-level engineering details. Code stays a sketch.

## 3. Entry template

Each technique entry has four body sections plus the existing adoption list and summary box. Eyebrow tags (`§ N · short label`) mark divisions as today.

### § 1 · Premise (~50 lines)

- Open with the problem in concrete numbers — bytes per token, GB per context window, FLOPs per pass, whatever quantifies the bottleneck this technique addresses.
- Place the technique in lineage: name the predecessors, state what each got wrong or where each stalls.
- Close with a one-sentence preview of the contribution.

### § 2 · Derivation (~100 lines) — new

The load-bearing section of the new template.

- Begin from the prerequisite formulation (e.g., for MLA, the MHA equations; for RoPE, the unrotated dot-product form).
- Walk the transformation step by step. Every symbol is annotated on first appearance: dimension and role.
- For each non-obvious design choice, answer "why this and not the obvious alternative?" — the prose has to defend the design, not just describe it.
- Include geometric, spectral, or information-theoretic intuition where it applies (RoPE's rotation reading; RMSNorm's projection-onto-sphere reading; MoE routing as load-balanced assignment).
- Close with parameter count and computational complexity expressed in named variables (H, d_h, d_c, L, T, ...).

### § 3 · Reference implementation (~25–35 lines, sketch)

Unchanged in style from `plan-final.md` §10.

- PyTorch-style pseudocode, ≤30 lines, no imports.
- Goal: illustrate the load-bearing mechanical difference vs. the baseline.
- Tensor-shape comments where they clarify (`# [B, T, H, d_h]`).
- Not runnable; not a reproduction reference.

### § 4 · Empirical evidence (~60 lines) — upgraded

- Cite multiple ablations, not only the introducing paper. Where independent reproductions exist, cite them.
- Tables and figures are referenced by number, not paraphrased.
- Where scaling behavior or hyperparameter sensitivity is publicly studied, summarize the curve.
- "No public sensitivity study" is an acceptable conclusion when it is the truth.

### Adoption list + Summary box

Unchanged. Per-adoption configuration (e.g., MLA's `d_c = 512, d_R = 64`) continues to live in `adopted_by[].notes`, not in a separate Hyperparameters section.

### Total

~235–285 lines per entry. Meaningfully deeper than the current ~150-line floor, with the additional depth concentrated in § 2 Derivation.

## 4. Content guardrails

Length without substance is worse than thin entries. Four rules apply:

1. **Every claim cites a source.** Numbers, behavior claims, "X diverges if you skip Y" — all need a paper section / table / figure number or a public implementation link. No folklore.
2. **No restating the same idea twice.** Derivation explains the math once; Empirical evidence does not re-explain it. Each section adds new information.
3. **Closed-model policy (plan §9) still applies.** If a section would require speculation about GPT-x / Claude / Gemini internals, omit it.
4. **"I don't know" is allowed.** If an Empirical evidence section has no public study to cite beyond the introducing paper, the section says so explicitly. Thin and honest beats long and fabricated.

## 5. Parallel subagent orchestration

The migration runs across ~50 entries via parallel subagents.

**Unit of work.** One subagent per entry. Not per category — entries within a category vary in source-paper complexity and shouldn't share a subagent's context.

**Subagent brief.** Each subagent receives:
- Path to the current entry file (existing frontmatter, adoption list, summary)
- Path to this spec (the section template + guardrails)
- arXiv ID(s) and any companion tech reports / repos to read
- An explicit "do NOT" list: no hyperparameter section, no engineering-pitfalls section, no speculation about closed models, no restating the derivation in empirical evidence

**Concurrency.** Batches of ~5 subagents in parallel. Each batch goes through review before the next batch starts.

**Per-entry review checkpoint.** For each completed entry, the orchestrator checks:
- Section length within budget
- Every numeric claim has an inline citation
- Empirical section cites at least one source beyond the introducing paper
- "I don't know" used where data is thin, not fabricated

**Migration order.** Flagship entries first (MLA, GQA, RoPE, RMSNorm, SwiGLU, DeepSeekMoE, YaRN, SWA, MoE aux-loss-free) — these are most-linked and have well-documented sources. Long-tail entries (Sparse-MoE 2017, BigBird, Landmark Attention) go last.

**Failure handling.** A subagent that can't produce a section to spec (e.g., no public derivation depth for a 2017 paper) produces a shorter section that says so explicitly. The entry is shorter than budget; that's fine.

**Worktree isolation.** Each batch runs in `isolation: "worktree"` so subagents can't stomp on each other or on the working tree.

## 6. Validation & CI

`scripts/validate-content.ts` enforces the new bar on every PR.

**Schema checks (existing, kept).**
Frontmatter conformance, `adopted_by[].source_url` presence, closed-model policy.

**New checks.**
- All four body sections (`§ 1 Premise`, `§ 2 Derivation`, `§ 3 Reference implementation`, `§ 4 Empirical evidence`) present by eyebrow tag.
- § 2 Derivation has ≥3 display equations (`$$...$$`) — a heuristic against suspiciously thin derivations.
- § 4 Empirical evidence has ≥1 inline link to a paper that is not the entry's own `paper_url` — catches the "only cited the original" failure mode.
- Total body line count within 200–600.

**Soft warnings (don't block, just flag in CI output).**
- Long stretches of prose without a citation.
- A section that is <30% of its target budget.

**Not checked.**
- Citation accuracy — humans verify in review.
- Math correctness — same.

## 7. Out of scope (explicit)

- Hyperparameter / defaults section. Per-adoption configs stay in `adopted_by[].notes`.
- Engineering & pitfalls section (fp16/bf16 notes, fused-kernel notes, memory layout). Not part of this depth bar.
- UI changes (progressive disclosure, in-page anchor nav, sub-pages). Entries remain single linear scrolls.
- Runnable reference code, sanity-check harnesses, reproduction notebooks.
- Migration of model spec sheets — this spec is for technique entries only.

## 8. Open questions

None at draft time. Implementation plan will be written by the writing-plans skill after this spec is approved.
