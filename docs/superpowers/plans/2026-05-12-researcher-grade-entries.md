# Researcher-Grade Technique Entries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 55 technique entries in `src/content/techniques/` from the current ~150-line "medium deep-dive" depth to ~235–285 lines following the four-section template defined in `docs/superpowers/specs/2026-05-12-researcher-grade-entries-design.md`.

**Architecture:** TDD-update the content validator with new structural checks, then dispatch parallel subagents (worktree-isolated, batches of ≤5) per entry. Pilot batch first (3 flagship entries) to verify the subagent brief before scaling.

**Tech Stack:** Astro 5 + MDX, vitest, plain TypeScript validator (`scripts/validate-content.ts`).

---

## Phase 1: Validator Updates (TDD)

The new validator enforces the structural bar so subagents can't drift.

### Task 1.1: Add fixture for a "good" entry

**Files:**
- Create: `tests/fixtures/techniques/good-entry.mdx`

- [ ] **Step 1: Create fixture matching the spec template**

```mdx
---
title: "Test Entry"
abbreviation: "TE"
category: "attention"
year: 2024
month: 1
introduced_by: "Test"
paper_title: "Test"
arxiv_id: "2401.00001"
paper_url: "https://arxiv.org/abs/2401.00001"
status: "production-adopted"
problem_solved: "Test."
predecessors: []
successors: []
adopted_by: []
figure_component: null
figure_caption: null
summary: "Test."
tags: []
last_verified: "2026-05-12"
difficulty: "intermediate"
facets: []
---

<p class="section-eyebrow">§ 1 · Premise</p>
## Premise

Lorem ipsum. See [other paper](https://arxiv.org/abs/2305.13245).

<p class="section-eyebrow">§ 2 · Derivation</p>
## Derivation

$$a = b$$
$$c = d$$
$$e = f$$

<p class="section-eyebrow">§ 3 · Reference implementation</p>
## Reference implementation

\`\`\`python
def x(): pass
\`\`\`

<p class="section-eyebrow">§ 4 · Empirical evidence</p>
## Empirical evidence

See [another paper](https://arxiv.org/abs/2407.21783) Table 1.
```

- [ ] **Step 2: Commit**

```bash
git add tests/fixtures/techniques/good-entry.mdx
git commit -m "Add fixture for researcher-grade entry structure"
```

### Task 1.2: Write failing tests for new validator checks

**Files:**
- Create: `tests/validate-content-structure.test.ts`

- [ ] **Step 1: Write tests against helper functions exported by `scripts/validate-content.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { checkEntryStructure, type StructureIssue } from "../scripts/validate-content";

const goodEntry = `<p class="section-eyebrow">§ 1 · Premise</p>
prose with [link](https://arxiv.org/abs/x).
<p class="section-eyebrow">§ 2 · Derivation</p>
$$a$$ $$b$$ $$c$$
<p class="section-eyebrow">§ 3 · Reference implementation</p>
code
<p class="section-eyebrow">§ 4 · Empirical evidence</p>
See [paper](https://arxiv.org/abs/y).`;

describe("checkEntryStructure", () => {
  it("accepts a well-formed entry", () => {
    const issues = checkEntryStructure(goodEntry, "https://arxiv.org/abs/2401.00001");
    expect(issues).toEqual([]);
  });

  it("flags missing § 2 Derivation", () => {
    const body = goodEntry.replace(/§ 2 · Derivation[^§]*/, "");
    const issues = checkEntryStructure(body, "https://arxiv.org/abs/2401.00001");
    expect(issues.some((i) => i.message.includes("§ 2"))).toBe(true);
  });

  it("flags derivation with < 3 display equations", () => {
    const body = goodEntry.replace(/\$\$a\$\$ \$\$b\$\$ \$\$c\$\$/, "$$a$$");
    const issues = checkEntryStructure(body, "https://arxiv.org/abs/2401.00001");
    expect(issues.some((i) => i.message.includes("3 display equations"))).toBe(true);
  });

  it("flags § 4 with no non-self citation", () => {
    const body = goodEntry.replace("https://arxiv.org/abs/y", "https://arxiv.org/abs/2401.00001");
    const issues = checkEntryStructure(body, "https://arxiv.org/abs/2401.00001");
    expect(issues.some((i) => i.message.includes("non-original"))).toBe(true);
  });

  it("flags body line count outside 200..600", () => {
    const shortBody = "tiny";
    const issues = checkEntryStructure(shortBody, "https://arxiv.org/abs/2401.00001");
    expect(issues.some((i) => i.message.includes("line count"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/validate-content-structure.test.ts`
Expected: FAIL (function not exported).

### Task 1.3: Implement `checkEntryStructure` in the validator

**Files:**
- Modify: `scripts/validate-content.ts` (add export at top, call from `validate()`)

- [ ] **Step 1: Add the exported function**

Insert near top of file after the imports:

```typescript
export type StructureIssue = { message: string };

export function checkEntryStructure(body: string, paperUrl: string): StructureIssue[] {
  const issues: StructureIssue[] = [];
  const sections = ["§ 1 · Premise", "§ 2 · Derivation", "§ 3 ·", "§ 4 · Empirical evidence"];
  for (const s of sections) {
    if (!body.includes(s)) issues.push({ message: `missing section eyebrow "${s}"` });
  }

  const derivStart = body.indexOf("§ 2 · Derivation");
  const derivEnd = body.indexOf("§ 3 ·", derivStart + 1);
  if (derivStart >= 0 && derivEnd > derivStart) {
    const deriv = body.slice(derivStart, derivEnd);
    const eqs = (deriv.match(/\$\$[\s\S]+?\$\$/g) ?? []).length;
    if (eqs < 3) issues.push({ message: `§ 2 Derivation has ${eqs} display equation(s); need ≥3` });
  }

  const empStart = body.indexOf("§ 4 · Empirical evidence");
  if (empStart >= 0) {
    const emp = body.slice(empStart);
    const links = [...emp.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]!);
    const nonSelf = links.filter((u) => !paperUrl || !u.includes(paperUrl.replace(/^https?:\/\//, "")));
    if (nonSelf.length === 0) {
      issues.push({ message: "§ 4 Empirical evidence has no non-original-paper citation link" });
    }
  }

  const bodyLines = body.split("\n").filter((l) => l.trim() !== "").length;
  if (bodyLines < 200 || bodyLines > 600) {
    issues.push({ message: `body line count ${bodyLines} outside expected range 200..600` });
  }

  return issues;
}
```

- [ ] **Step 2: Call it from `validate()` loop over techniques**

Inside `validate()`, after the existing per-technique checks (right before "// 3. Reporting"), add:

```typescript
for (const t of techniques) {
  const text = fs.readFileSync(t.file, "utf8");
  const bodyMatch = text.match(/^---[\s\S]*?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1]! : "";
  const paperUrl = String(t.data.paper_url ?? "");
  for (const s of checkEntryStructure(body, paperUrl)) {
    issues.push({ file: rel(t.file), message: s.message });
  }
}
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run tests/validate-content-structure.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-content.ts tests/validate-content-structure.test.ts
git commit -m "Add structural validator for researcher-grade entries"
```

### Task 1.4: Mark validator as "info-only" until pilot ships

The validator will fail loudly on all 55 existing entries. Until they're migrated, we need it to print warnings without exiting non-zero — otherwise CI blocks every PR.

- [ ] **Step 1: Convert structural issues to warnings**

Modify the call site in `validate()`:

```typescript
for (const t of techniques) {
  const text = fs.readFileSync(t.file, "utf8");
  const bodyMatch = text.match(/^---[\s\S]*?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1]! : "";
  const paperUrl = String(t.data.paper_url ?? "");
  for (const s of checkEntryStructure(body, paperUrl)) {
    warnings.push(`[structure] ${rel(t.file)}: ${s.message}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/validate-content.ts
git commit -m "Treat structural issues as warnings until migration completes"
```

---

## Phase 2: Pilot Migration

Three flagship entries via parallel subagents to verify the brief produces researcher-grade depth.

### Task 2.1: Dispatch pilot subagents (parallel, isolated worktrees)

**Files:**
- Modify: `src/content/techniques/attention/mla.mdx`
- Modify: `src/content/techniques/attention/gqa.mdx`
- Modify: `src/content/techniques/normalization/rmsnorm.mdx`

- [ ] **Step 1: Dispatch three Agent calls in a single message, each with `isolation: "worktree"`**

Each subagent receives this brief verbatim, with `<ENTRY>` filled in:

```
You are rewriting one MDX technique entry in the llm-arch-kb repo to a deeper depth.

INPUTS
- Current entry: src/content/techniques/<category>/<ENTRY>.mdx
- Spec: docs/superpowers/specs/2026-05-12-researcher-grade-entries-design.md (READ THIS FIRST)
- The paper(s) cited in frontmatter `arxiv_id` and `paper_url`

OUTPUT
- Rewrite the entry body (everything after the frontmatter `---` closer).
- Preserve frontmatter and adoption_list verbatim. Update `last_verified: 2026-05-12`.
- Body must have exactly four eyebrow sections in this order:
  § 1 · Premise (~50 lines)
  § 2 · Derivation (~100 lines, ≥3 display equations, every symbol annotated)
  § 3 · Reference implementation (~25–35 lines, PyTorch-style pseudocode sketch)
  § 4 · Empirical evidence (~60 lines, ≥1 link to a non-original paper)
- Preserve the trailing <Summary>...</Summary> block; update the prose if useful but keep it ≤4 lines.
- Total body line count: 200–600.

GUARDRAILS
- Every claim cites a source (paper section/table/figure or implementation link).
- No restating the same idea in two sections.
- Closed-model policy: no speculation about GPT-x / Claude / Gemini internals.
- "I don't know" is allowed: if § 4 has no public study beyond the introducing paper, say so explicitly.

DO NOT
- Add a Hyperparameters section.
- Add an Engineering & pitfalls section.
- Make the reference code runnable (no imports, no main block).
- Modify the frontmatter beyond `last_verified`.

DELIVERABLE
- The updated MDX file written in place. Report the final body line count.
```

Dispatch:

```python
# Conceptual — actual dispatch is three parallel Agent tool calls
Agent(description="Migrate MLA entry to researcher-grade depth",
      isolation="worktree",
      prompt="<brief with ENTRY=mla, category=attention>")
Agent(description="Migrate GQA entry to researcher-grade depth",
      isolation="worktree",
      prompt="<brief with ENTRY=gqa, category=attention>")
Agent(description="Migrate RMSNorm entry to researcher-grade depth",
      isolation="worktree",
      prompt="<brief with ENTRY=rmsnorm, category=normalization>")
```

### Task 2.2: Pull each worktree's changes into a review branch

- [ ] **Step 1: For each subagent's returned worktree path, cherry-pick or merge the entry change into a `migration/pilot` branch on main repo**

```bash
git checkout -b migration/pilot
# For each worktree:
#   git -C <worktree> log -1 --pretty=format:%H
#   git cherry-pick <commit-sha>
```

### Task 2.3: Audit each pilot entry against the spec checklist

- [ ] **Step 1: For each of the 3 entries, manually verify:**
  - All 4 sections present by eyebrow tag
  - § 2 Derivation has ≥3 `$$...$$` blocks
  - § 4 Empirical evidence cites at least one paper that is not the entry's own `paper_url`
  - Body line count is in [200, 600]
  - No speculation about closed models
  - No restated content between sections

- [ ] **Step 2: Run `pnpm validate-content` and confirm only the pilot-3 are without structural warnings**

- [ ] **Step 3: Run `pnpm test` and `pnpm check`**

- [ ] **Step 4: Run `pnpm build` and confirm the entries render**

### Task 2.4: Merge pilot to main

- [ ] **Step 1:**

```bash
git checkout main
git merge migration/pilot
git commit -m "Migrate MLA / GQA / RMSNorm to researcher-grade depth (pilot)"
```

---

## Phase 3: Remaining Flagship Batch

Six more flagship entries: RoPE, SwiGLU, DeepSeekMoE, YaRN, sliding-window, aux-loss-free.

### Task 3.1: Dispatch 6 subagents in parallel, worktree-isolated

- [ ] **Step 1: Same brief as Phase 2, 6 entries:**
  - `src/content/techniques/positional/rope.mdx`
  - `src/content/techniques/ffn-moe/swiglu.mdx`
  - `src/content/techniques/ffn-moe/deepseek-moe.mdx`
  - `src/content/techniques/positional/yarn.mdx`
  - `src/content/techniques/attention/sliding-window.mdx`
  - `src/content/techniques/ffn-moe/aux-loss-free.mdx`

### Task 3.2: Audit and merge

- [ ] **Step 1: Same checklist as Phase 2.3**
- [ ] **Step 2: Merge to main**

---

## Phase 4: Long-Tail Migration

The remaining ~46 entries in batches of 5.

### Task 4.1–4.10: Migrate in batches

For each batch of 5:
- [ ] **Step 1: Dispatch 5 subagents in parallel with the same brief**
- [ ] **Step 2: Audit each against the spec checklist**
- [ ] **Step 3: Merge batch to main**

Batches (in suggested order — high-traffic first):

1. `mha`, `mqa`, `flash-attention`, `linear-attention`, `dsa`
2. `layernorm`, `qk-norm`, `norm-placement`, `olmo2-post-norm`, `sandwich-ln`
3. `gemma3-norm-everywhere`, `ngpt`, `alibi`, `sinusoidal`, `nope`
4. `decoupled-rope`, `position-interpolation`, `ntk-aware-rope`, `longrope`, `streaming-llm`
5. `landmark-attention`, `activation-beacon`, `memorizing-transformers`, `compressive-transformer`, `longnet`
6. `gelu`, `ffn-relu`, `geglu`, `reglu`, `mixtral-moe`
7. `kimi-k2-moe`, `gshard`, `switch-transformer`, `sparse-moe`, `bigbird`
8. `lightning-attention`, `linformer`, `performer`, `reformer`, `sparse-transformer`
9. `residual-overview`, `rezero`, `deepnet`, `normformer`, `hyper-connections`
10. `dynamic-hc` (1 entry — solo dispatch or pair with another straggler)

---

## Phase 5: Final QA + plan-final.md Update

### Task 5.1: Flip validator from warnings back to errors

- [ ] **Step 1: Modify `scripts/validate-content.ts` to push structural issues to `issues[]` instead of `warnings[]`**

```typescript
for (const s of checkEntryStructure(body, paperUrl)) {
  issues.push({ file: rel(t.file), message: s.message });
}
```

- [ ] **Step 2: Run `pnpm validate-content` and confirm it exits zero**

### Task 5.2: Update plan-final.md §31 to reference the new spec

- [ ] **Step 1: In `plan-final.md` at line 31, replace the "medium deep-dive" depth description with a pointer to the new spec**

Old line 31:
```
- **Authoritative catalog** of meaningful architectural innovations in decoder-only LLMs (2017–present) at "medium deep-dive" depth — math, simple implementation sketch, tradeoffs, ablation results, and which **disclosed** production models adopt it.
```

New:
```
- **Authoritative catalog** of meaningful architectural innovations in decoder-only LLMs (2017–present) at researcher-grade depth — see `docs/superpowers/specs/2026-05-12-researcher-grade-entries-design.md` for the section template.
```

- [ ] **Step 2: Run full QA**

```bash
pnpm qa
```

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-content.ts plan-final.md
git commit -m "Enforce researcher-grade structural validator; update plan-final"
```
