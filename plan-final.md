# LLM Architecture Knowledge Base — Final Build Plan

> A chronologically-organized reference of decoder-only LLM architecture innovations. Each entry: math, simple implementation, tradeoffs, ablation results, and adopting models with citations. Built with Astro 6 + Solid islands, hosted on Cloudflare Pages, designed in the "Calm Editorial" aesthetic.

---

## 0. What this plan is, and what changed

This is the merged plan combining v1's content scope and rigor with v2's design discipline and process safeguards.

### Lesson from the v1 build attempt

The v1 plan was an excellent engineering spec and a poor design brief. It enumerated ingredients (13 color tokens, paper grain overlay, two radial gradient washes, drop caps, marginal callouts, multi-color accent system, dark synthesis blocks, equation cards with header bars, figure cards with header bars, dark code blocks with red-dot headers) without specifying composition — proportion, restraint, rhythm, what gets emphasis and what doesn't. When implemented (by Claude Code) it produced a busy, harsh result.

### What this final plan does differently

1. **Replaces the ornate "annotated paper" aesthetic with "Calm Editorial"** — three visual moves total. The design system in §3 is the non-negotiable core; the anti-pattern list in §3.4 is what to push back on Claude Code about.
2. **Preserves v1's content ambition** as the long-term roadmap (~55 entries, ~24 models across 6 categories) but ships v1 with **12 entries and 4 figures**, then scales.
3. **Adds explicit process guardrails** for working with Claude Code (§17) — visual review checkpoints, when to stop and re-plan, what to refuse.
4. **Updates tech stack**: Astro 6 (not 4), Solid (not React) for islands, plain CSS (not Tailwind), Cloudflare Pages (not GitHub Pages).
5. **Preserves v1's strict citation policy** (§9) — the §16 strict rule was a strength and stays unchanged.

**Hand this whole document to Claude Code as the source of truth.** Then build one entry at a time, with visual checkpoints between each.

---

## 1. Project goals

### Primary goals

- **Authoritative catalog** of meaningful architectural innovations in decoder-only LLMs (2017–present) at "medium deep-dive" depth — math, simple implementation sketch, tradeoffs, ablation results, and which **disclosed** production models adopt it.
- **Calm editorial design** — content reads naturally, typography carries the structure, no decorative chrome. Visual references: Stripe Press and Distill.pub.
- **Selectively interactive** — high-value techniques get an animated SVG figure with sliders/toggles (e.g., rotate RoPE angles, slide GQA group count, animate MoE routing). Most entries are prose + math + code; figures are not mandatory.
- **Comparative** — `/compare/` page renders a technique-matrix and model-matrix view.
- **Chronological** within each category so the evolution of ideas is visible.
- **Citation-disciplined** (§9 Closed-Model Policy).

### Non-goals

- Encoder, encoder-decoder, vision, multimodal-specific architectures.
- Training recipes (data, optimizer, LR schedule) — only architecture.
- Inference engines (vLLM, TRT-LLM) — only the architectural hooks they enable.
- Dark mode for v1 (post-launch toggle if desired).
- **Ornamental visual elements forbidden by §3.4** (paper texture, gradient washes, drop caps, marginal callouts, multi-color accents, dark "synthesis" blocks).
- Mermaid (drop entirely; hand-write any system diagram as SVG).

### Ship strategy — small v1, then scale

| Ship | Entries | Models | Figures | Purpose |
|---|---|---|---|---|
| **v1 ship** | 12 | 3 | 4 | Prove the design, the pipeline, and the citation system end-to-end. Get it right before scaling. |
| **v2 ship** | ~30 | ~10 | ~12 | Fill in major categories. Add Compare and Timeline pages. |
| **v3 ship (long-term v1 vision)** | ~55 | ~24 | ~30 | Full roadmap from §12 — every meaningful innovation, full model coverage. |

The v1 mistake was scaling an unsuccessful aesthetic across 47 entries. This plan makes that mistake structurally impossible: nothing scales until **one** entry is beautiful (Phase 1 in §15).

---

## 2. Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Astro 6** (Node 22+) | Static-first, MDX-native, islands; current major version with built-in Fonts API, `<ClientRouter />`, and Cloudflare-first runtime |
| Interactive islands | **Solid.js** via `@astrojs/solid-js` | Signal-based reactivity is ~6× smaller than React (~7kb vs ~45kb) and noticeably smoother for slider-driven SVG redraws |
| Content format | **MDX** | Markdown + Solid components in articles |
| Math rendering | **KaTeX** via `remark-math` + `rehype-katex` | Server-rendered, fast, free |
| Code highlighting | **Shiki 4** (Astro 6 default) | Build-time, zero runtime cost |
| Search | **Pagefind** | Build-time index, no server, works on static hosts |
| Diagrams | Hand-written SVG (Solid components for interactive; static for non-interactive) | Matches the calm aesthetic; no Mermaid runtime |
| Tables | Plain HTML `<table>` with CSS for v1 ship; **TanStack Table** for v2 when `/compare/` becomes sortable/filterable | Defer complexity until needed |
| Styling | **Plain CSS** with CSS custom properties | No Tailwind. The design is small enough that utility classes add noise without saving keystrokes |
| Fonts | **Astro 6 Fonts API**, self-hosted | Built-in subsetting, preload, `font-display: swap` |
| Hosting | **Cloudflare Pages** | Faster global CDN than GitHub Pages; Astro is now a Cloudflare project so support is first-class |
| Page transitions | `<ClientRouter />` (Astro 6) | Free cross-page smoothness; respects `prefers-reduced-motion` |
| CI / deploy | **GitHub Actions** → Cloudflare Pages | Push to main → deploy |

### Why Solid over React

The interactive figures are the perf-critical surface. Sliders driving SVG attribute updates at 60fps is exactly what Solid is optimized for: signals mutate single attributes without re-rendering trees. React works but ships more JS and reconciles more per frame. Astro's MDX still uses Astro components for layout; only the figure components themselves are Solid.

### Why no Tailwind

Tailwind shines when you have a flat utility grammar applied across many components. This site has a small number of components used many times, with a custom typographic system. Plain CSS with a small token file is shorter, semantic, and easier for Claude Code to extend without polluting class lists.

---

## 3. Design system: "Calm Editorial"

### 3.1 The three visual moves

The site has exactly three visual moves. Everything else is body text and whitespace.

1. **Typographic hierarchy.** One serif family (variable), with weight and size carrying all the emphasis. Big H1, smaller H2, body. Generous size jumps so hierarchy is unmissable.
2. **A single accent color**, used sparingly: for links, the current-page nav indicator, the section-number eyebrow, and equation labels. Nothing else.
3. **Generous whitespace.** Wide line-height, big section margins, a single comfortable content column. The page breathes.

That is the entire design. If a fourth move appears, delete one.

### 3.2 Visual references (CRITICAL — look at these, don't just read about them)

The single biggest v1 mistake was trying to recreate a visual artifact from a text description. **Do not repeat this.** Before writing any CSS, the implementer (you or Claude Code) should open these tabs and study them:

- **Stripe Press** — https://press.stripe.com/ — editorial restraint, beautiful typography, one accent color, generous whitespace. Primary aesthetic anchor for body prose.
- **Distill.pub** — https://distill.pub/2016/augmented-rnns/ is a good example — scientific content done well, interactive figures integrated calmly, math sits naturally in prose.
- **Anthropic Research** — https://www.anthropic.com/research — clean modern editorial, very little chrome, lots of breathing room.

**Hand these URLs to Claude Code along with this plan.** When in doubt about a design decision, instruct Claude Code to look at the rendered pages of these sites and match their *restraint*, not their specific colors.

### 3.3 Color tokens

```css
:root {
  /* Surfaces */
  --bg:           #fafaf7;   /* page background — warm off-white, NOT trying to look like paper */
  --bg-soft:      #f1f1ec;   /* code blocks, table headers, light surfaces */
  --border:       #e3e3dc;   /* subtle dividers, rules */

  /* Text */
  --text:         #1a1a1a;   /* body text — very dark gray, NOT pure black */
  --text-soft:    #5a5a55;   /* captions, meta, secondary info */
  --text-faint:   #8a8a85;   /* timestamps, footers */

  /* The one accent */
  --accent:       #1a4f7a;   /* deep navy — links, section eyebrows, current-page indicator */
  --accent-soft:  #e8eef4;   /* highlight box backgrounds */
}
```

Nine tokens. v1 had 13 just for colors with red, blue, olive, and gold all in play. Resist adding more.

### 3.4 Anti-patterns (forbidden in v1 ship)

Each item below was in the original v1 plan and contributed to the ugly outcome. **None appear in this build.** When Claude Code suggests any of these, say no.

- ❌ Paper-texture or noise overlays of any kind
- ❌ Radial gradient backgrounds, washes, or "atmospheric" effects
- ❌ Multi-color accent system (red + blue + olive + gold). One accent only.
- ❌ Drop caps
- ❌ Marginal callouts (reconsider for v3 only after core is solid)
- ❌ Dark "synthesis" blocks (replaced with the simple highlighted summary box in §3.6)
- ❌ Code blocks with custom header bars, filename pills, or colored dots
- ❌ Equation cards with "EQ. n" labels and decorative borders
- ❌ Figure cards with dark header bars
- ❌ Italic-emphasis-in-different-color tricks ("the *word* in blue")
- ❌ Newspaper-style mastheads with "● live" stamps
- ❌ Mono small-caps eyebrows applied liberally (one usage only — see §3.7)
- ❌ Mixing serif body + sans UI chrome + mono captions on the same surface. Serif everywhere except code and the one mono eyebrow.
- ❌ Mermaid. Hand-write any system diagram as SVG.
- ❌ Three Google Fonts loaded simultaneously. One serif family + mono only.

### 3.5 Typography

```css
:root {
  --serif: 'Source Serif 4', Iowan Old Style, Georgia, serif;
  --mono:  'JetBrains Mono', SF Mono, Menlo, monospace;

  /* Scale — generous jumps so hierarchy is unambiguous */
  --t-body:    1.0625rem;    /* 17px */
  --t-small:   0.875rem;     /* 14px — captions, meta */
  --t-h3:      1.25rem;      /* 20px */
  --t-h2:      1.6875rem;    /* 27px */
  --t-h1:      2.625rem;     /* 42px */
  --t-display: clamp(2.5rem, 5vw, 4rem);  /* 40–64px for the homepage hero only */

  --lh-body:  1.7;
  --lh-tight: 1.25;
}

body {
  font-family: var(--serif);
  font-size: var(--t-body);
  line-height: var(--lh-body);
  color: var(--text);
  background: var(--bg);
}
```

**Source Serif 4** over Fraunces because it reads better at body sizes, has gorgeous italics, has all the weights, and is harder to make ugly. Fraunces is wonderful in expert hands but it's an expressive face that punishes default settings.

**No sans-serif.** Everything that isn't code is serif. This is a deliberate choice — using a single typeface family across the entire site creates immediate visual coherence and removes a whole class of "does this combo work?" decisions.

### 3.6 Layout primitives

There are four. Not eight.

```css
/* Single content column — used by 95% of the site */
.prose {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Slightly wider — for code blocks, figures, tables that need breathing room */
.prose-wide {
  max-width: 880px;
  margin: 0 auto;
  padding: 0 24px;
}

/* A highlighted summary box at the end of each entry (replaces v1's "synthesis") */
.summary {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  padding: 24px 28px;
  margin: 48px 0;
  border-radius: 2px;
}

/* Figure container — just a wrapper with a caption below */
.figure {
  margin: 40px 0;
}
.figure > figcaption {
  font-size: var(--t-small);
  color: var(--text-soft);
  font-style: italic;
  margin-top: 12px;
  text-align: center;
}
```

Equations are just centered KaTeX. Code blocks are Shiki with a light `--bg-soft` background and no header bar. Section breaks are vertical whitespace, not horizontal rules.

### 3.7 Section eyebrows

The one place mono type appears outside code blocks:

```css
.section-eyebrow {
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}
```

Usage:

```mdx
<p class="section-eyebrow">§ 2 · The compression</p>
## Down-project to a latent
```

That's it. No oversized red numerals. No dual-color headings. The eyebrow gives just enough structure that long entries are navigable.

### 3.8 Responsive

- `<720px`: the existing `max-width` rules already give a comfortable mobile read; just verify padding holds at `padding: 0 20px`.
- Figures (interactive ones) need their own mobile sizing — see §11.
- Touch targets ≥44px for any interactive control.
- Test on a real phone before declaring an entry done. Not Chrome DevTools device emulation — a real phone.

---

## 4. Site map

```
/                              Home
/positional/                   Category landing (chronological)
/positional/rope/              Individual entry
/positional/yarn/
…
/normalization/
/residual/
/ffn-moe/
/attention/
/long-context/

/models/                       All production models
/models/deepseek-v3/
…

/compare/                      Interactive matrix (v2 ship)
/timeline/                     Chronology (v2 ship)
/about/                        Methodology and citation policy
```

`/debates/` from the original v1 plan is dropped for v1 ship — it can come back in v3 if there's appetite.

---

## 5. Content taxonomy

Six technique categories plus a parallel production-models collection:

1. **Positional Encoding** (`/positional/`) — How tokens learn where they are.
2. **Normalization** (`/normalization/`) — LayerNorm to RMSNorm to QK-Norm; placement debates.
3. **Residual Connections** (`/residual/`) — Skip-connection geometry.
4. **FFN & MoE** (`/ffn-moe/`) — Dense MLP to gated SwiGLU to sparse mixture-of-experts.
5. **Attention Mechanisms** (`/attention/`) — MHA → MQA → GQA → MLA; full / SWA / linear / lightning.
6. **Long Context** (`/long-context/`) — YaRN, LongRoPE, beacons, streaming, kNN memory.
7. **Production Models** (`/models/`) — Per-model spec sheets with strict citation discipline (§9).

### Cross-cutting pages

- **Home** (`/`) — title, intro, consensus stack diagram (one labeled SVG), category grid. No masthead.
- **Comparison Matrix** (`/compare/`) — interactive technique × dimensions and model × choices views. **v2 ship.**
- **Timeline** (`/timeline/`) — scrubbable chronology. **v2 ship.**
- **About / Methodology** (`/about/`) — surface the §9 citation policy publicly.

---

## 6. Content schema

### 6.1 Technique entry schema (`src/content/config.ts`)

```typescript
const techniqueSchema = z.object({
  // Identity
  title: z.string(),                    // "Multi-Head Latent Attention"
  abbreviation: z.string(),             // "MLA"
  category: z.enum([
    "positional", "normalization", "residual",
    "ffn-moe", "attention", "long-context",
  ]),
  subcategory: z.string().optional(),

  // Chronology
  year: z.number(),
  month: z.number().optional(),
  introduced_by: z.string(),
  paper_title: z.string(),
  arxiv_id: z.string(),
  paper_url: z.string().url(),

  // Status
  status: z.enum([
    "foundational",
    "production-adopted",
    "research",
    "deprecated",
  ]),
  problem_solved: z.string(),

  // Lineage
  predecessors: z.array(z.string()).default([]),
  successors: z.array(z.string()).default([]),

  // Adoption — STRICT: only entries with a citable source per §9
  adopted_by: z.array(z.object({
    model: z.string(),                  // model slug, must resolve to a /models/<slug>
    source_url: z.string().url(),       // REQUIRED — paper, model card, or official tech report
    notes: z.string().optional(),
  })).default([]),

  // Interactive figure (optional)
  figure_component: z.string().optional(),
  figure_caption: z.string().optional(),

  // Card display
  summary: z.string(),                  // 1-2 sentence elevator pitch
  tags: z.array(z.string()).default([]),

  // For chronological sort within a category
  order: z.number().optional(),
  last_verified: z.string(),            // ISO date — when adoption list was last checked
});
```

### 6.2 Production model schema

```typescript
const modelSchema = z.object({
  name: z.string(),
  organization: z.string(),
  release_date: z.string(),
  parameters_total: z.string(),
  parameters_active: z.string().optional(),
  context_length: z.number(),
  open_weights: z.boolean(),
  paper_url: z.string().url().optional(),
  model_card_url: z.string().url().optional(),

  disclosure_level: z.enum([
    "open",                // weights + paper / tech report
    "documented",          // paper or detailed model card, weights may be closed
    "partial",             // some details disclosed via blog/talks
    "undisclosed",         // closed and undocumented — placeholder only, no architecture claims
  ]),

  // For "undisclosed" or "partial" models, leave fields null rather than guess.
  architecture: z.object({
    positional: z.string().nullable(),
    normalization_placement: z.string().nullable(),
    normalization_type: z.string().nullable(),
    qk_norm: z.boolean().nullable(),
    activation: z.string().nullable(),
    attention: z.string().nullable(),
    moe: z.string().nullable(),
    other: z.array(z.string()).default([]),
  }),

  source_urls: z.array(z.string().url()),
  notes: z.string().optional(),
});
```

### 6.3 CI validation rules

`scripts/validate-content.ts` enforces:

- Every `adopted_by.model` resolves to an existing `/models/<slug>` entry.
- Every `adopted_by` item has a non-empty `source_url`.
- Every model with `disclosure_level: undisclosed` has **null** architecture fields (no guesses).
- All `paper_url` and `arxiv_id` values are consistent.
- `figure_component`, when present, resolves to a real component in `src/components/figures/`.

Runs in CI on every PR; failing build blocks merge.

---

## 7. Entry template (MDX)

Every technique entry uses this template. **No drop caps, no marginal callouts, no equation cards, no dark synthesis blocks.** Just clean prose with eyebrow-tagged sections and a summary box at the end.

```mdx
---
title: "Multi-Head Latent Attention"
abbreviation: "MLA"
category: "attention"
year: 2024
month: 5
introduced_by: "DeepSeek-AI"
paper_title: "DeepSeek-V2: A Strong, Economical, and Efficient MoE Language Model"
arxiv_id: "2405.04434"
paper_url: "https://arxiv.org/abs/2405.04434"
status: "production-adopted"
problem_solved: "Cut KV cache memory below MQA/GQA while improving quality."
predecessors: ["mha", "mqa", "gqa"]
successors: ["dsa"]
adopted_by:
  - model: "deepseek-v2"
    source_url: "https://arxiv.org/abs/2405.04434"
  - model: "deepseek-v3"
    source_url: "https://arxiv.org/abs/2412.19437"
  - model: "kimi-k2"
    source_url: "https://github.com/MoonshotAI/Kimi-K2"
    notes: "Latent compression in same family as MLA"
figure_component: "MhaMqaGqaMla"
figure_caption: "Slider over group count G shows MHA→MQA→GQA; toggle MLA's latent d_c to see cache shrink further."
summary: "Compress K and V to a small per-token latent; reconstruct heads at attention time. ~5–7× smaller KV cache than MHA on DeepSeek-V2 ablations."
tags: ["attention", "kv-cache", "deepseek"]
last_verified: "2026-05-11"
---

import MhaMqaGqaMla from "~/components/figures/MhaMqaGqaMla";
import AdoptionList from "~/components/AdoptionList.astro";
import Summary from "~/components/Summary.astro";

<p class="section-eyebrow">§ 1 · Premise</p>
## Why KV cache is the bottleneck

Attention's KV cache is the dominant inference-time memory cost in long-context generation. Each new token reads every prior K and V — for a 64-head model at 128 head-dim, that's 16 KB per token per layer, or 1 GB at 64K context for a 30-layer model.

<p class="section-eyebrow">§ 2 · The compression</p>
## Down-project to a latent

MLA replaces per-head K,V projections with a down-projection to a small latent:

$$\mathbf{c}^{KV}_t = W_{DKV}\,\mathbf{h}_t \in \mathbb{R}^{d_c}$$

where $d_c \ll H \cdot d_h$ — the compression ratio is the cache savings.

<MhaMqaGqaMla client:visible />

```python
# Down-project K,V to a single latent vector
c_kv = x @ W_DKV                       # [B, T, d_c]

# At attention time, up-project (absorbed into W_Q at inference)
k = c_kv @ W_UK                         # [B, T, H, d_h]
v = c_kv @ W_UV

# Decoupled RoPE head carries position
k_rope = rope(x @ W_KR)                 # [B, T, d_R]
k = concat([k, k_rope], dim=-1)
```

<p class="section-eyebrow">§ 3 · Decoupled RoPE</p>
## Why RoPE doesn't fit in the latent

RoPE rotates per-head; if we compress K to a latent before applying RoPE, the rotation entangles with the down-projection in a way that can't be inverted at inference. MLA solves this by carrying a small decoupled RoPE head alongside the latent.

<p class="section-eyebrow">§ 4 · Results</p>
## Empirical evidence

On DeepSeek-V2's reported ablations (Table 9), MLA outperforms MHA on BBH and MMLU while cutting KV cache 5.5–6.5×; GQA underperforms MHA on their setup.

<AdoptionList />

<Summary>
**MLA in one breath.** Compress K and V to a per-token latent; reconstruct heads at attention time. 5–7× smaller cache than MHA, on-par or better quality. Costs: an extra rotary head, harder to implement than GQA. Seen in: DeepSeek V2/V3/V3.2, Kimi K2.
</Summary>
```

That's the whole template. No fake newspaper chrome, no decorative borders, no oversized colored numerals.

---

## 8. Component inventory

Smaller than v1's. Each component does one thing.

### 8.1 Astro layout components (`src/components/`)

- `<BaseLayout>` — head, fonts, `<ClientRouter />`, nav, footer
- `<TechniqueLayout>` — extends BaseLayout; renders title + frontmatter meta + content + AdoptionList + Summary
- `<ModelLayout>` — extends BaseLayout for model spec sheets
- `<CategoryLayout>` — for category index pages
- `<AdoptionList>` — auto-renders frontmatter `adopted_by` as deep-linked items
- `<Summary>` — the highlighted summary box (see §3.6)
- `<Nav>` — header with site title + category links
- `<Footer>` — minimal: license, source link, last-built date

**That's it.** No `<Masthead>`, `<Eq>`, `<Figure>` (just use `<figure>`), `<Code>` (just use Markdown code blocks), `<Marginal>`, `<Synthesis>`, `<TitleBlock>`, `<Premise>`, `<PrevNext>`, or `<TableOfContents>`. These v1 components encoded the visual ornamentation that made v1 ugly. They're gone.

### 8.2 Solid island components (`src/components/figures/` and `src/components/views/`)

**Figures** (one per technique that needs interactivity — see §11 for the catalog). All share a thin base pattern; each is 200–400 lines of Solid + SVG.

**Site-wide views** (mostly v2 ship):
- `<ComparisonTable>` — sortable technique × dimensions table
- `<AdoptionMatrix>` — pivot view of model × architectural slot
- `<TimelineView>` — scrubbable chronology
- `<SearchBox>` — wraps Pagefind UI

---

## 9. Closed-model policy (strict no-guesses)

**This is a non-negotiable content rule.** `scripts/validate-content.ts` enforces it.

- **No inferred architecture claims** about closed/undocumented models. GPT-3.5, GPT-4, GPT-4o, GPT-5, Claude (any version), Gemini (any version), and any other model without a public paper or detailed tech report is treated as `disclosure_level: undisclosed`.
- For an `undisclosed` model:
  - The spec-sheet entry **may** exist (so the model appears in lists and the adoption matrix), but every `architecture.*` field is **null**.
  - The adoption matrix renders empty cells as a dash.
  - The page body says "Architecture details are not publicly documented." and lists only confirmed public facts (release date, claimed context length if officially stated, modality).
- For a `partial` model (some details public, others not):
  - Only the publicly stated fields are populated; others remain null.
  - Each populated field must have a `source_url` citing the disclosure (paper, model card, official blog post, or recorded talk).
- **Every `adopted_by` entry must include a `source_url`.** Schema-enforced and CI-checked.
- The About page links to this policy and explains the rationale: this is a knowledge base, not a rumor mill.

In practice, v1 ship and v2 ship adoption lists are drawn from the seven open / documented model families:

**Llama · OLMo · DeepSeek · Gemma (incl. RecurrentGemma) · Kimi · MiniMax · GLM**

Every adoption claim must cite a paper, tech report, model card, or official repo. Mistral, Qwen, Phi, Yi, Falcon, Mixtral, and others can be added later if they meet the citation bar; GPT-x, Claude, and Gemini get placeholder entries only.

---

## 10. Editorial style guide

- **Voice.** Technical, terse, no marketing fluff. Assume the reader knows attention and softmax. Spell out abbreviations on first use.
- **Math.** KaTeX `$...$` inline, `$$...$$` display. Standard notation $Q, K, V \in \mathbb{R}^{L \times d}$.
- **Code.** PyTorch-style pseudocode, ≤25 lines, no imports. Plain Markdown fenced code blocks; Shiki handles highlighting.
- **Citations.** Link to arXiv abstract pages (not PDFs). When citing numbers, name the table or figure.
- **Adoption claims.** Only with `source_url` per §9.
- **Tradeoffs.** Include at least one quantitative number where available (e.g., "5–7× smaller KV cache on DeepSeek-V2 Table 9").
- **Tense.** Present for what the method does; past for who introduced it.
- **Summary box tone.** Aphoristic, one breath, no hedging.
- **Figure captions.** Lead with the key claim. Example: "**λ = 1** reduces to Mamba-2's Euler hold; **λ = ½** is the classical trapezoid."
- **No marketing language.** No "revolutionary", "groundbreaking", "elegant" (unless quoting), "powerful".
- **Section eyebrows.** Used to mark major divisions within an entry. Format: `§ N · short label`.

---

## 11. Interactive figures

### 11.1 v1 ship figure catalog (4 figures)

These four are built alongside content from day 1.

| Figure | Lives on | What the reader manipulates |
|---|---|---|
| `RopeRotor` | RoPE entry | θ slider, position counter; watch a Q vector rotate on the unit circle |
| `MhaMqaGqaMla` | GQA entry (also referenced from MLA) | Slider over group count G; toggle MLA latent dim d_c; shows KV-cache shrinking |
| `MoeRouting` | DeepSeekMoE entry | top-K slider + expert count; animate tokens routed to experts; toggle shared expert |
| `SlidingWindow` | SWA entry | Window-size slider; shows which keys each query attends to |

### 11.2 Full figure roadmap (v2 + v3 ships)

Built incrementally after v1 ship lands. From the original v1 plan, preserved for the long-term roadmap:

| Figure | Technique | What the reader manipulates |
|---|---|---|
| `RopeBaseSweep` | RoPE | base $b$ slider; see frequency bands shift |
| `AlibiSlopes` | ALiBi | head index; show the linear bias kernel per head |
| `YarnBands` | YaRN | context-scale $s$; show NTK-by-parts (high / linear / interpolated bands) |
| `LongRopeSearch` | LongRoPE | reveal the per-dimension search result vs YaRN's closed form |
| `NoPeOrder` | NoPE | causal-mask toggle; show order information leaking through |
| `LayerNormVsRMS` | RMSNorm | step through mean-centering on a sample vector; show the dropped term |
| `QkNormLogits` | QK-Norm | inject an outlier; show attention-logit blow-up with/without QK-Norm |
| `SandwichVsPre` | Sandwich-LN | toggle norm placements; show residual stream norm over depth |
| `NgptHypersphere` | nGPT | manipulate a 3D unit-sphere step; show eigen-step-size |
| `ResidualVsHc` | Hyper-Connections | slider for $n$ streams; show learned read/write matrices as heatmap |
| `DeepSeekMoeShared` | DeepSeekMoE | toggle shared expert; show routing entropy and balance |
| `AuxLossFreeBias` | DeepSeek V3 routing | step through bias updates over time |
| `DsaIndexer` | DSA | slider for top-k keep; show indexer-selected tokens vs full attention |
| `LightningTiles` | Lightning Attention | tile size slider; show intra- vs inter-block ops |
| `AttentionSinks` | StreamingLLM | window size + sink count; show PPL collapse vs preserved |
| `FlashTiling` | FlashAttention | tile size slider; show HBM traffic over $L$ |
| `AdoptionTimeline` | timeline page | year scrubber across the X-axis; nodes light up as adopted |

### 11.3 Component contract

Every interactive figure is a Solid component at `src/components/figures/<Name>.tsx`:

```tsx
// src/components/figures/RopeRotor.tsx
import { createSignal } from "solid-js";

export default function RopeRotor() {
  const [theta, setTheta] = createSignal(0.1);
  const [pos, setPos] = createSignal(0);

  return (
    <figure class="figure">
      <svg viewBox="0 0 460 300" role="img" aria-label="Rotary position embedding visualization">
        {/* draw axes, rotated vector, etc. using theta() * pos() */}
      </svg>
      <div class="controls">
        <label>
          θ <span aria-hidden="true">{theta().toFixed(3)}</span>
          <input
            type="range"
            min={0.001} max={0.5} step={0.001}
            value={theta()}
            onInput={(e) => setTheta(+e.currentTarget.value)}
            aria-valuetext={`theta ${theta().toFixed(3)} radians per position`}
          />
        </label>
        <label>
          position
          <input
            type="range"
            min={0} max={2048} step={1}
            value={pos()}
            onInput={(e) => setPos(+e.currentTarget.value)}
            aria-valuetext={`position ${pos()}`}
          />
        </label>
      </div>
      <figcaption>
        At base 10000, low-index dimensions rotate fast; high-index dimensions rotate slowly.
      </figcaption>
    </figure>
  );
}
```

Used in MDX with `client:visible`:

```mdx
import RopeRotor from "~/components/figures/RopeRotor";

<RopeRotor client:visible />
```

### 11.4 Requirements for every figure

- **SVG viewBox**, not fixed dimensions — scales with container.
- **Pointer events** (`onPointerDown/Move/Up`) for any drag interaction. Never `onMouseDown`. Handles mouse, touch, and stylus uniformly.
- **Touch targets ≥44px** for sliders. Style `<input type="range">` to enforce this; default is too thin for thumbs.
- **`role="img"` and a descriptive `aria-label`** on the SVG. Sliders need `aria-valuetext` reporting the current state in words.
- **Respect `prefers-reduced-motion`.** Any animation checks `@media (prefers-reduced-motion: reduce)` and degrades to instant state changes.
- **Render a sensible default state at SSR** so the page isn't blank before hydration.
- **No external animation libraries.** `requestAnimationFrame` + Solid signals is enough for everything in §11.1.
- **400 lines maximum per component.** If it grows beyond that, split it.

### 11.5 Mobile sizing

The figure container scales to viewport width. Controls below the SVG, never beside it on mobile. If a figure is information-dense and genuinely doesn't fit at 380px, allow horizontal scroll on the SVG itself:

```css
.figure svg {
  width: 100%;
  height: auto;
  max-height: 60vh;
}
```

---

## 12. Content roadmap

### 12.1 v1 ship — 12 entries, 4 figures, 3 models

Picks the consensus stack plus the most interesting deviations. Small enough to actually finish well, large enough to be useful.

**Positional Encoding** (2)
- RoPE — Rotary Position Embedding *(figure: RopeRotor)*
- YaRN

**Normalization** (3)
- RMSNorm
- Pre-Norm vs Post-Norm vs Sandwich-Norm
- QK-Norm

**FFN & MoE** (2)
- SwiGLU
- DeepSeekMoE *(figure: MoeRouting)*

**Attention** (3)
- GQA *(figure: MhaMqaGqaMla)*
- MLA (references MhaMqaGqaMla)
- Sliding Window Attention *(figure: SlidingWindow)*

**Long Context** (1)
- StreamingLLM / Attention Sinks

**Residual** (1)
- Standard residual + Pre/Post overview

**Models** (3)
- Llama 3.1 70B
- DeepSeek V3
- Gemma 3 27B

### 12.2 v2 ship — fill to ~30 entries, ~10 models, ~12 figures

Adds the major remaining items in each category and the Compare + Timeline pages. Specific additions:

- Positional: ALiBi, NoPE, Decoupled RoPE
- Normalization: LayerNorm (historical), DeepNorm, OLMo 2 Post-Norm
- Residual: ReZero, DeepNet scaling, Hyper-Connections
- FFN & MoE: GELU (historical), DeepSeek V3 aux-loss-free, Mixtral, OLMoE
- Attention: MHA, MQA, FlashAttention, DSA, Lightning
- Long Context: Memorizing Transformers, Activation Beacon
- Models: Llama 3.3, DeepSeek V3.2, Gemma 3 1B/4B/12B, OLMo 2, OLMoE, Kimi K2, MiniMax-01, GLM-4.5

Compare and Timeline pages built in v2 (they need enough content to be meaningful).

### 12.3 v3 ship — the original v1 vision (~55 entries, ~24 models)

The full content roadmap from the original v1 plan, finished. Specific lists:

**Positional Encoding (7 total)**
Sinusoidal · ALiBi · RoPE · YaRN (with PI and NTK as predecessors) · LongRoPE · NoPE · Decoupled RoPE

**Normalization (10 total)**
LayerNorm · Pre vs Post analysis · RMSNorm · DeepNorm · QK-Norm · Sandwich-LN / Peri-LN · OLMo 2 Post-Norm · nGPT · Norm-everywhere (Gemma-3) · misc 2024–26

**Residual (6 total)**
Standard residual · ReZero · DeepNet scaling · NormFormer · Hyper-Connections · mHC / Dynamic HC

**FFN & MoE (11 total)** — two subgroups:
- **FFN activations (3):** SwiGLU/GeGLU/ReGLU · GELU · FFN + ReLU
- **MoE (8):** DeepSeekMoE · DeepSeek V3 aux-loss-free · Mixtral · OLMoE · Kimi K2 MoE · Sparse MoE (Shazeer 2017) · Switch Transformer · GShard

**Attention (15 total)**
MHA · MQA · GQA · MLA · SWA · BigBird · LongNet · Landmark · Attention Sinks/StreamingLLM · DSA · Lightning · FlashAttention 1/2/3 · Linear Transformer · Performer · Linformer

**Long Context (6 total)**
SWA · Memorizing Transformers · Activation Beacon · Compressive Transformer · Landmark · LongNet

**Production Models (~24, open-weights / documented only)**
- **Llama:** Llama 1, 2, 3, 4
- **OLMo:** OLMo 1, 2, OLMoE
- **DeepSeek:** V1, V2, V3, V3.1, V3.2, R1
- **Gemma:** Gemma 1, 2, 3, RecurrentGemma
- **Kimi:** K1.5, K2
- **MiniMax:** MiniMax-01 family
- **GLM:** GLM-130B, GLM-4, GLM-4.5

> Note on DeepSeek V4: as of May 2026, V4 has not been released. List reflects publicly released versions to date. Adding a new release is one MDX file.

---

## 13. Home page

Simple, calm, no fake newspaper chrome.

### Structure

1. **Header nav** — site title (left), category links (right). Same on every page.
2. **Title block** — `<h1>` ("LLM Architecture Knowledge Base"), one-paragraph intro in `--text-soft`. No masthead, no live stamp, no eyebrow.
3. **Premise** — 2–3 paragraphs of plain serif prose explaining what the site is. No drop cap.
4. **The 2026 consensus stack** — a single labeled SVG (hand-drawn, static) showing the default frontier dense stack: Pre-Norm + RMSNorm + SwiGLU + RoPE + GQA + optional QK-Norm. Each layer label links to its entry.
5. **Featured entries** — 4–6 cards (just title + 1-sentence summary + category tag), each linking to an entry. v1 ship cards: RoPE, RMSNorm, GQA, MLA, DeepSeekMoE.
6. **Browse by category** — 6 cards, one per category, showing entry count and most-recent addition.
7. **Footer** — license, source, last-built date.

No comparison cards on the homepage in v1 ship (those need `/compare/` working). No mini timeline. No synthesis block.

---

## 14. Comparison page (`/compare/`) — v2 ship

Two view modes, toggled with a simple text-link switch (not a pill switch).

### View A — Technique matrix
Rows = techniques, columns = year · category · solves · compute · memory · quality · adopting models (count + linked badges).

### View B — Model adoption matrix
Rows = production models, columns = architectural slots (PE · Norm placement · Norm type · QK-Norm · Activation · Attention · MoE).
Cells = technique abbreviation linking to its entry; empty cells for `disclosure_level: undisclosed` models (rendered as a dash). No heatmap coloring in v2 ship; if added in v3, use only one color at varying opacity (per §3.4 no multi-color accents).

Built with TanStack Table; multi-column sort; URL-syncable filter state.

---

## 15. Build phases

**Total target: 5–6 weeks part-time for v1 ship.** Each phase has a hard checkpoint where you LOOK at the result and decide if it's beautiful before continuing.

### Phase 0 — Scaffolding (1 day)

- `pnpm create astro@latest` with the minimal template, Astro 6.
- Install: `@astrojs/solid-js`, `@astrojs/mdx`, `@astrojs/sitemap`, `remark-math`, `rehype-katex`, `astro-pagefind`.
- Set up Cloudflare Pages adapter.
- Configure Astro 6 Fonts API with Source Serif 4 (Variable) and JetBrains Mono.
- Add `<ClientRouter />` to base layout for page transitions.
- Add global `prefers-reduced-motion` handling.
- Set up `scripts/validate-content.ts` for citation enforcement.
- Set up `src/styles/tokens.css` with the design-system variables (§3.3, §3.5).
- GitHub Actions → Cloudflare Pages deploy.

### Phase 1 — One beautiful entry (5–7 days)

**The most important phase. Do not skip it. Do not move on early.**

Build the MLA entry, end to end, until it actually looks beautiful:

1. Create `src/content/techniques/attention/mla.mdx` with full content from §7's template.
2. Build the `MhaMqaGqaMla` Solid figure per §11.
3. Build minimal `<TechniqueLayout>`, `<AdoptionList>`, `<Summary>`, `<Nav>`, `<Footer>`.
4. Iterate on CSS until type, spacing, color, code, math, and figure all feel intentional.
5. Test on phone (real device), tablet, desktop.
6. Test with screen reader (VoiceOver or NVDA) for at least the figure.
7. **Open the page next to https://press.stripe.com/ and https://distill.pub/. If yours looks like a different design language, keep iterating.**

**Stop signal:** Do NOT start any other entry until this one is beautiful. If after 7 days it isn't, that's information — pause and reconsider the design rather than scaling ugliness across 11 more pages. That was the v1 mistake.

### Phase 2 — Template + 3 more entries (5–7 days)

Once Phase 1 is locked, extract the layout into a reusable Astro layout. Then build, in order:
- RoPE (with `RopeRotor` figure)
- GQA (reuse `MhaMqaGqaMla`)
- RMSNorm (no figure)

After each entry: open next to MLA. They should feel like the same site.

### Phase 3 — Site chrome and index pages (3–5 days)

- Home page (per §13)
- Category index pages (`/positional/`, `/attention/`, etc.) — just chronological lists of entries with summaries
- About page (with §9 citation policy)
- 404 page
- Header nav, footer
- Search wired up (Pagefind index built into CI)

### Phase 4 — Remaining 8 entries (10–14 days)

YaRN, Pre/Post/Sandwich-Norm, QK-Norm, SwiGLU, DeepSeekMoE (with `MoeRouting`), SWA (with `SlidingWindow`), StreamingLLM, Residual overview.

Plus the 3 model entries: Llama 3.1 70B, DeepSeek V3, Gemma 3 27B.

### Phase 5 — v1 ship polish and launch (3–5 days)

- Lighthouse audit (target ≥95 on all four scores)
- Real device QA: iPhone, Android, iPad
- Screen reader QA on every figure
- OG images per entry (via `astro-og-canvas`)
- RSS feed of new entries
- Announce

### Phase 6+ — v2 and v3 ships

After v1 ship lands and stabilizes:

- **v2 ship:** Add Compare and Timeline pages, fill out the major missing entries (§12.2), add ~8 figures from §11.2.
- **v3 ship:** Complete the original content roadmap (§12.3), add the remaining figures, consider dark mode, consider marginal callouts only if they genuinely earn their place after the rest is solid.

---

## 16. Repo structure

```
llm-arch-kb/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── .github/workflows/deploy.yml
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── content/
│   │   ├── config.ts                 (zod schemas — §6)
│   │   ├── techniques/
│   │   │   ├── positional/*.mdx
│   │   │   ├── normalization/*.mdx
│   │   │   ├── residual/*.mdx
│   │   │   ├── ffn-moe/*.mdx
│   │   │   ├── attention/*.mdx
│   │   │   └── long-context/*.mdx
│   │   └── models/*.mdx
│   ├── components/
│   │   ├── AdoptionList.astro
│   │   ├── Summary.astro
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── figures/                  (Solid SVG islands, one per technique)
│   │   │   ├── RopeRotor.tsx
│   │   │   ├── MhaMqaGqaMla.tsx
│   │   │   ├── MoeRouting.tsx
│   │   │   └── SlidingWindow.tsx
│   │   └── views/                    (ComparisonTable etc. — v2)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── TechniqueLayout.astro
│   │   ├── ModelLayout.astro
│   │   └── CategoryLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── compare.astro             (v2)
│   │   ├── timeline.astro            (v2)
│   │   ├── [category]/index.astro
│   │   ├── [category]/[slug].astro
│   │   └── models/{index,[slug]}.astro
│   ├── styles/
│   │   ├── tokens.css                (§3.3, §3.5 — CSS variables)
│   │   ├── prose.css                 (§3.6 layout primitives)
│   │   └── global.css                (reset + body type)
│   └── utils/
│       ├── adoption-graph.ts         (build-time technique↔model index)
│       └── chronological-sort.ts
└── scripts/
    └── validate-content.ts           (CI — §6.3)
```

---

## 17. Working with Claude Code: the process that protects against ugliness

This section is the most important meta-difference from the original v1 plan. Last time, the plan was good but the execution went off the rails. Here's how to avoid that.

### 17.1 Hand Claude Code this whole document plus visual references

In your first Claude Code session for a visual task, paste:

> Read `plan-final.md` end to end before writing any code. Pay particular attention to §3 (design system) and §3.4 (forbidden anti-patterns). Open and look at https://press.stripe.com/ and https://distill.pub/2016/augmented-rnns/ — match their restraint. If you're about to add a visual element not specified in §3, stop and ask first.

### 17.2 Work entry by entry, not framework first

Don't ask Claude Code to "scaffold the whole site." Ask it to build one entry to completion. Review. Then ask for the next. The framework emerges from real entries; if you build the framework first, you'll build the wrong framework.

### 17.3 Visual review checkpoints

After Claude Code finishes any visually significant task, before letting it move on:

1. **Run the dev server.** Look at the page in a real browser.
2. **Open Stripe Press or Distill in another tab.** Compare. Does yours feel like the same design language family?
3. **Resize to 380px width.** Does it still look intentional?
4. **Check for any anti-patterns from §3.4.** If you spot one, instruct Claude Code to remove it.
5. **Only then move on.**

Skipping any of these is how v1 ended up ugly.

### 17.4 When to push back on Claude Code

Push back when Claude Code:

- Adds a visual element not in §3 (drop cap, gradient, second accent color, header bar on code blocks, etc.) → "Remove this, refer to §3.4"
- Suggests Tailwind or a UI component library → "Plain CSS per §2, decline"
- Suggests Mermaid for diagrams → "Hand-write SVG per §1 non-goals"
- Tries to be "creative" with the design — fancy hover states, parallax, particle effects → "Calm Editorial means none of that"
- Adds more than three font weights → "One serif family, two or three weights max"
- Suggests reviving any v1 component from §8 that's explicitly dropped → "Out of scope per §8.1"

Claude Code is helpful but defaults to adding visual flourish. This plan exists to give you grounds to push back consistently.

### 17.5 When to stop and re-plan

If after Phase 1 (one full week on a single entry) the entry isn't beautiful and you're not sure why, **stop and re-plan rather than scaling.** v1's catastrophic outcome was scaling an unsuccessful aesthetic across 47 entries. Better to spend an extra week getting one entry right than three weeks getting 12 entries wrong.

Signs to stop and re-plan:
- The page looks busy despite following §3
- It feels generic / template-y rather than considered
- It doesn't feel coherent with the Stripe Press / Distill references
- Multiple visual elements feel like they're "fighting"

If any of these, post a screenshot in a new chat to diagnose. Don't push through.

---

## 18. Quality gates (definition of done)

### Per-entry checklist

An entry isn't done until:

- [ ] Page renders correctly on iPhone (real device), at 380px viewport
- [ ] Page renders correctly on a desktop browser at 1440px width
- [ ] All math renders without overflow
- [ ] Code blocks don't horizontal-scroll on mobile (use shorter lines if needed)
- [ ] Interactive figure (if present) responds to touch, has `aria-valuetext`, respects `prefers-reduced-motion`
- [ ] `last_verified` date in frontmatter matches today
- [ ] Every `adopted_by` entry has a `source_url`
- [ ] `validate-content.ts` passes
- [ ] Lighthouse score on the page is ≥95 in all four categories
- [ ] Opened next to Stripe Press in another tab: feels like the same design language family

### v1 ship checklist

- [ ] All 12 entries from §12.1 complete and pass the per-entry checklist
- [ ] All 3 model spec sheets complete
- [ ] All 4 figures from §11.1 complete and pass figure requirements (§11.4)
- [ ] Home page complete (§13)
- [ ] About page surfaces citation policy (§9)
- [ ] Search works
- [ ] Cloudflare Pages deploy is automatic
- [ ] Site mean Lighthouse score ≥95
- [ ] No anti-pattern from §3.4 appears anywhere

---

## 19. Build & deploy configuration

### `astro.config.mjs`

```javascript
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import solid from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://<your-domain>",
  integrations: [mdx(), solid(), sitemap(), pagefind()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: "github-light", wrap: true },
  },
  experimental: {
    fonts: [
      {
        name: "Source Serif 4",
        cssVariable: "--serif",
        provider: "google",
        weights: [400, 500, 600, 700],
        styles: ["normal", "italic"],
      },
      {
        name: "JetBrains Mono",
        cssVariable: "--mono",
        provider: "google",
        weights: [400, 600],
      },
    ],
  },
});
```

### `.github/workflows/deploy.yml` (Cloudflare Pages)

```yaml
name: Deploy to Cloudflare Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm validate-content        # enforces §9 citation policy
      - run: pnpm build
      - run: pnpm pagefind --site dist
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: llm-arch-kb
          directory: dist
```

Cloudflare Pages auto-deploys from main; you can also wire up preview deploys for PRs.

---

## 20. Source material

Primary content source: the comprehensive architecture survey produced alongside the original v1 plan. Each MDX entry distills the corresponding block of that survey.

Ongoing sources:
- arXiv `cs.CL` / `cs.LG` new architecture papers.
- Sebastian Raschka, *The Big LLM Architecture Comparison* (updated periodically).
- Official tech reports and model cards on Hugging Face for each frontier release.
- Lab blogs: DeepSeek, Meta AI, Google DeepMind, Mistral, Qwen, MiniMax, Moonshot, Cohere, AI21, Zhipu.

**Not sources:** rumor threads, leaked screenshots, podcast speculation, "trust me bro" tweets. These never enter the knowledge base regardless of how plausible they seem (per §9).

---

## 21. Open questions to confirm before Phase 0

1. **Repo name and URL.** Suggest `llm-arch-kb`. Cloudflare Pages at `<project>.pages.dev` or custom domain? If custom, what?
2. **License.** Recommend CC-BY-4.0 for content, MIT for code.
3. **Open to PRs?** If yes, add `CONTRIBUTING.md` with the entry template from §7. If solo, skip.
4. **Comments.** Skip for v1; consider Giscus later if there's demand.

---

## Start here

Phase 0 (one day): scaffold the project per §15.

Phase 1 (one week): build the MLA entry. Just one. End to end. Until it actually looks beautiful next to Stripe Press.

**Do not start entry #2 until Phase 1 is locked.** That's the entire game.
