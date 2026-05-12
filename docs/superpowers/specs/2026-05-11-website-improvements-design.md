# Website improvements — design spec

**Date:** 2026-05-11
**Authority:** Subordinate to `plan-final.md` §3 (Calm Editorial) and §3.4 anti-patterns. Where this spec conflicts with `plan-final.md`, plan-final.md wins.
**Brainstormed with:** Li Zeman

## 1. Design philosophy lock

The user explicitly chose **"motion & micro-interactions only"** as the interpretation of "fancier, modern, still minimalist."

- Calm Editorial stays intact. Three visual moves only.
- One accent color. Nine color tokens. Resist additions.
- §3.4 anti-patterns remain in force (no gradients, no card chrome, no drop caps, no multi-accent system, no decorative borders, no mixed font families on the same surface, etc.).
- "Fancy" is earned through *motion, typographic finesse, and rhythm* — never decoration.

## 2. In-scope improvements

The user listed 8 areas. All are in scope.

### 2.1 Navigation (item 1)
Replace the current 14-flat-link header with **Option A: "Browse" mega-dropdown**.

- Top row (always visible, 5 items): `Browse ▾`, `Models`, `Compare`, `Timeline`, `About`. Right-aligned: `Search`.
- Brand title `LLM Architecture KB` left-aligned.
- The `Browse` dropdown is a two-column panel:
  - Left column eyebrow "By category" — Positional, Attention, Normalization, FFN & MoE, Long context, Residual.
  - Right column eyebrow "By lens" — Facets, Learning paths, Glossary, References.
- Trigger: hover (desktop, with a small intent delay), focus (keyboard), click (touch / accessibility).
- Motion: panel fades in with a 4–6px translate-down, ~150ms ease-out. Closes on outside click, Esc, or pointerleave (with 80ms grace).
- Active-state indicator: the current section's underline slides between items on hover (~180ms ease-out). Implemented via a single shared `::after` track measured in JS, with a CSS-only fallback when JS is off.
- Mobile (< 720px): the top row collapses to brand + hamburger; the dropdown becomes a full-width accordion-style stack.
- `prefers-reduced-motion: reduce` disables all transitions; states snap to final values.

### 2.2 Type-scale bump (item 2)
"Captions, eyebrows, status pills, chips" feel undersized. Bump the small-text surfaces without disturbing body or heading scale.

- `--t-small`: `0.875rem` → `0.9375rem` (14 → 15 px).
- Section eyebrows: `0.75rem` → `0.8125rem` (12 → 13 px), letter-spacing relaxed `0.08em` → `0.07em`.
- Status pills / abbreviation chips: `0.7rem` → `0.75rem` (11.2 → 12 px); padding bumped 1px to keep proportion.
- Heatmap column labels: `0.7rem` → `0.78rem`.
- Year stamps and arxiv labels: `0.78rem` → `0.85rem`.
- Body, H1–H3, display, lede: **unchanged**.

### 2.3 Rotary figure correctness + figure audit (item 3)
- Confirmed bug in `RopeRotor.tsx`: the arc `sweep-flag` interacts with SVG's flipped Y axis. The visible arc may not match the line rotation. Additionally the full-rotation indicator needs validation against the `wrapped()` calculation.
- **Full audit**: render every Solid figure under `src/components/figures/` and confirm its visual against the technique's math. Common failure modes to look for: SVG Y-flip vs trig sign errors, off-by-one axis labels, log-scale labels that don't match the data, missing aria-labels, sliders without `aria-valuetext`, broken `prefers-reduced-motion` handling, captions claiming behavior the figure doesn't actually show.
- Each fix lands as its own commit with the technique slug in the message.

### 2.4 Motion budget (item 4)
Add a small motion-token group to `tokens.css`:

```css
--motion-fast:   120ms;
--motion-base:   180ms;
--motion-slow:   240ms;
--ease-out:      cubic-bezier(0.2, 0.7, 0.2, 1);
--ease-spring:   cubic-bezier(0.3, 1.3, 0.5, 1);  /* used sparingly */
```

Add `<ClientRouter />` for cross-page transitions (Astro 5 built-in). Default `view-transition-name` on the article column for a tasteful crossfade. `prefers-reduced-motion: reduce` continues to gate all transitions globally (already wired in `tokens.css`).

### 2.5 More production models (item 5)
User authorized me to research candidates and add them without prior approval, subject to the §9 citation policy. Plan:

- Survey publicly-disclosed dense / MoE / hybrid decoder releases 2025-Q1 → 2026-Q2: candidate set includes Qwen 3 series, DeepSeek V4 (if/when disclosed), Gemma 4 (if/when disclosed), Yi-Large successors, Mistral / Codestral 2026 releases, Nemotron, AI21 Jamba revisions, Cohere Command R updates, Grok-with-disclosure, MiniMax follow-ups.
- For each candidate: require an arXiv paper, model card, or official technical report with explicit architecture details. If only partial disclosure exists, add the entry with `architecture` fields set to `null` for the undisclosed slots (per §9). If no architecture disclosure exists at all, skip.
- Every `adopted_by` reference across techniques gets a `source_url` per §9.
- The CI validator at `scripts/validate-content.ts` must keep passing after additions.

### 2.6 Compare-page rewrite (item 6)
Replace static tables with **TanStack Table** (called out in `plan-final.md` §2 as the v2-ship table layer). All three matrices upgraded:

**Features (baseline + all four extras approved):**
1. Sortable columns: click header to sort; stable secondary sort by year ascending.
2. Filter chips above each table: category, organization, status, year-range (slider or two-input min/max).
3. Heatmap hover affordance: hovering a cell highlights its row and column.
4. Live search box: filters rows/columns by name match (case-insensitive, debounced 120ms).
5. Per-column adoption stats: footer row "N/M models" with a small inline bar (using `accent` with low alpha — *single token, not a new color*).
6. Multi-select model focus: a pill list of all models; selecting 2–6 collapses the matrix to those rows; clearing returns to full.
7. CSV / Markdown export: small button group above each table; respects the current filter state.
8. State preserved in querystring (`?cat=positional&org=deepseek&q=mla`) so views are linkable.

**Visual discipline:** no new colors; reuse `--accent`, `--accent-soft`, and existing borders. Buttons are text-style with hover-only emphasis. No icon library — use unicode arrows / dots if any glyphs are needed.

### 2.7 Writing pass (item 7)
Every technique MDX (~55) and every model MDX (~30). Each pass:

1. Read against `plan-final.md` §10 editorial style guide.
2. Tighten leads — first sentence after the section eyebrow must say what the technique IS, not what it solves (the `entry-meta` paragraph already covers "introduced by"; the body should open declaratively).
3. Cut hedging ("essentially", "basically", "kind of"), passive constructions where active reads better, and "the [technique] works by..." filler.
4. Validate all citations resolve (link check already in CI; this is a deeper read).
5. Verify math notation matches the figure's variable names.
6. Note (don't auto-fix) any factual claim that needs verification — log in `docs/superpowers/writing-review-notes.md`.

### 2.8 Card refactor — editorial display row (item 8)
**Option B** approved. Apply on:

- Homepage Featured list (`src/pages/index.astro` `.cards`)
- Category page entry list (`src/layouts/CategoryLayout.astro` `.entry-list`)
- Related techniques panel (`src/components/RelatedTechniques.astro`)
- Search-results template (if separate; otherwise inherits)

**Card structure:**
- Line 1: Title (1.4rem, weight 600, serif) + abbreviation (mono, accent, 0.78rem) on the right of the title.
- Line 2: `problem_solved` rendered in italic body-size — this is the hook.
- Line 3 (meta row, mono 0.72rem): year · status · `<N adopters>` (in accent).
- Hover affordance: an inline `Read entry →` chevron that slides 4px right on row hover (180ms ease-out). Title shifts from `--text` to `--accent`.

Row separator stays as the single 1px bottom border. No card surface, no rounded corners, no shadow.

## 3. Out of scope

- Dark mode (per §1 non-goals; deferred post-launch)
- Replacing the build / hosting stack
- New colors beyond the nine tokens
- Icon libraries
- Drop caps, marginal callouts, dark synthesis blocks, gradient backgrounds (§3.4 forbids)
- Mermaid (§3.4 forbids)

## 4. Success / done criteria

1. `pnpm qa` passes locally (validate-content + astro check + vitest + build).
2. `pnpm check:links` passes (link checker, currently in CI).
3. The eight items above are implemented or have their commit referenced in the implementation plan.
4. Dev server renders index, /compare/, /positional/rope/, a category page, a model page, /timeline/, and /search/ without console errors.
5. Visual review against `plan-final.md` §3.4: a quick scan against each anti-pattern confirms compliance.
6. Pushed to `main` and GitHub Actions deploy workflow runs green.

## 5. Risk register

- **Merge conflicts** across parallel agent tracks on `tokens.css`, `global.css`, `BaseLayout.astro`. Mitigation: assign these files exclusively to Track A; other tracks consume tokens but do not edit them.
- **TanStack Table is a new client dependency** — adds JS to a page that's currently zero-JS. Mitigation: lazy-mount only on `/compare/` via Solid client:visible; defer below first paint.
- **Figure audit may surface large math bugs** that are out of scope to fix in this PR. Mitigation: fix obvious render bugs; log deep math issues to `docs/superpowers/figure-audit-notes.md` for follow-up.
- **Writing pass scope creep** — 85 MDX files, each potentially long. Mitigation: time-box at ~10 min/file average; defer deeper rewrites with a note.
- **New-model citation gaps** — some 2026 releases may not have full disclosure. Mitigation: `architecture: null` per §9; do not infer.
- **GitHub Pages deploy** auto-fires on push to `main` — if the build breaks the site goes dark. Mitigation: `pnpm qa` MUST pass before push; verification is not optional.

## 6. References

- `plan-final.md` — source of truth (§3 design system, §3.4 anti-patterns, §9 citation policy, §10 editorial style, §14 compare-page roadmap)
- `MEMORY.md` entries: `feedback_calm_editorial`, `feedback_citation_policy`, `project_plan_authority`
- Astro 5 docs: `<ClientRouter />` View Transitions API
- TanStack Table v8 docs (headless tables, Solid adapter)
