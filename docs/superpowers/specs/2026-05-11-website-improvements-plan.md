# Implementation plan — website improvements

**Spec:** `docs/superpowers/specs/2026-05-11-website-improvements-design.md`
**Authority:** `plan-final.md` overrides any conflict here.
**Date:** 2026-05-11

## Execution strategy

Four parallel tracks on separate git worktrees, merged sequentially into `main` after each passes verification. Ralph Loop in the orchestrator session iterates the integrate→verify→fix loop until `pnpm qa` is green and `git push` succeeds.

| Track | Worktree branch | Files (primary) | Status |
|---|---|---|---|
| A — UI / motion / typography | `website-improve/track-a-ui` | `Nav.astro`, `tokens.css`, `global.css`, homepage, category list, related-techniques | pending |
| B — Compare rewrite | `website-improve/track-b-compare` | `compare.astro`, new `src/components/compare/*`, `package.json` (TanStack) | pending |
| C — Figure audit | `website-improve/track-c-figures` | `src/components/figures/*.tsx`, figure-audit notes | pending |
| D — Writing pass + new models | `website-improve/track-d-content` | `src/content/techniques/**`, `src/content/models/**`, writing-review notes | pending |

## Sequencing

1. Commit spec + plan to `main`.
2. Dispatch tracks A, C, D in parallel (each on its own worktree). B starts after A's tokens.css changes are visible to it.
3. As tracks finish, integrate to `main` in order: A → B → C → D.
4. Run `pnpm qa && pnpm check:links` after each integration.
5. When all four are integrated and green, push to `origin/main`. The GitHub Actions deploy workflow auto-fires.
6. Emit `<promise>DEPLOYED-AND-VERIFIED</promise>` to stop the Ralph Loop.

## Track A — UI / motion / typography

**Files to edit:**
- `src/styles/tokens.css` — bump small-text tokens, add motion tokens
- `src/styles/global.css` — wire motion tokens, update small-text rules
- `src/components/Nav.astro` — full rewrite for "Browse" mega-dropdown
- `src/layouts/BaseLayout.astro` — add `<ClientRouter />`
- `src/pages/index.astro` `.cards` block — adopt editorial display row
- `src/layouts/CategoryLayout.astro` `.entry-list` block — adopt editorial display row
- `src/components/RelatedTechniques.astro` — adopt editorial display row
- Add tests where rendering can break: `tests/nav.test.ts`, `tests/cards.test.ts`

**Behavior to verify:**
- Tab order through nav including dropdown
- Esc closes dropdown
- `prefers-reduced-motion: reduce` snaps all transitions
- Mobile (< 720px) hamburger works without JS as graceful fallback
- All current links still resolve (link checker)

**Done when:**
- All four card surfaces use the editorial row layout
- Nav dropdown opens/closes by hover, focus, click; passes a11y check
- Type-scale changes visible across category pages and compare lede
- `pnpm qa` green from the worktree

## Track B — Compare rewrite

**Files:**
- `src/pages/compare.astro` — rewrite to host Solid islands
- New: `src/components/compare/CompareMatrix.tsx` (Solid + TanStack Table)
- New: `src/components/compare/FilterChips.tsx`
- New: `src/components/compare/MultiSelectFocus.tsx`
- New: `src/components/compare/ExportButtons.tsx`
- New: `src/components/compare/AdoptionStats.tsx`
- `package.json` — add `@tanstack/solid-table`
- Tests for compare table behaviors

**State management:** Solid signals, mirrored to URL querystring via `history.replaceState`. Read on mount; debounced write on change.

**Visual discipline:**
- All chrome reuses existing tokens
- Sort affordance: small unicode arrow next to the active column header
- Filter chips reuse the existing `.chip` style from CategoryLayout
- Hover row+column highlight via CSS `:has()` (with JS fallback for Safari < 17 only if needed)

**Done when:**
- All three matrices use TanStack
- All eight features (sort, filter, hover, search, stats, focus, export, URL state) work
- Mobile fallback (the existing card view) still renders cleanly
- `pnpm qa` green

## Track C — Figure audit

**Files:** every `.tsx` under `src/components/figures/`.

**Procedure for each figure:**
1. Read the corresponding technique MDX to confirm what behavior the figure claims to demonstrate (`figure_caption` + body prose around the figure).
2. Read the figure component; identify whether its rendering matches that claim.
3. Common failure modes to check:
   - SVG Y-axis flip vs trig sign
   - Sweep-flag direction on `<path d="A ...">` arcs
   - Off-by-one in axis-tick labels
   - Log-scale labels claiming values they don't actually plot
   - Sliders without `aria-valuetext`, figures without `<title>` and `role="img"`
   - `prefers-reduced-motion` not respected for any auto-animated figures
4. Fix render bugs in-line.
5. Log any deeper math issue (where the figure's premise itself is wrong) to `docs/superpowers/figure-audit-notes.md` with file:line and a description.

**Known issue:** `RopeRotor.tsx` arc geometry — sweep-flag interaction with Y-flipped SVG axis. Fix in this track.

**Done when:**
- Every figure visually validated against its caption
- `RopeRotor` arc renders correctly (visible arc matches the vector rotation direction)
- Notes file written for any deferred issues
- `pnpm qa` green

## Track D — Writing pass + new models

**Sub-track D1: Writing pass**
- Iterate every file under `src/content/techniques/**/*.mdx` (~55)
- Iterate every file under `src/content/models/**/*.mdx` (~30)
- Per `plan-final.md` §10 editorial style: tighten leads, cut hedges, prefer active voice, verify math vs figure variable names.
- Time-box ~8–12 min per file; non-trivial structural rewrites get logged to `docs/superpowers/writing-review-notes.md` for follow-up rather than done inline.
- Frontmatter (citations, dates, adoption lists) is **not** touched in this sub-track — content only.

**Sub-track D2: New production models**
- Research disclosed 2025-Q1 → 2026-Q2 production models.
- Candidate list to investigate (each requires an arXiv paper, model card, or official technical report with architecture details before being added):
  - Qwen 3 series (Qwen3, Qwen3-MoE, etc.)
  - DeepSeek V4 (only if disclosed; otherwise skip)
  - Gemma 4 (only if disclosed; otherwise skip)
  - Yi-Large successors
  - Mistral / Codestral 2026 releases
  - Nemotron-4 family
  - AI21 Jamba 2 / 3
  - Cohere Command R+ refresh
  - MiniMax-Text-02
  - GLM-5 (if disclosed)
- Citation policy (§9): every `adopted_by` link requires a `source_url`. `architecture` field-by-field: if disclosed, fill; if not, `null`.
- Cross-link: for each new model, add `adopted_by` entries to the relevant technique MDX files (which is allowed — frontmatter changes are part of D2, not D1).
- Update `scripts/validate-content.ts` only if it rejects valid new entries.

**Done when:**
- Every MDX file in techniques/ and models/ has been read and either edited or explicitly skipped (logged in notes)
- New model entries pass `pnpm validate-content`
- All new `adopted_by` references include `source_url`
- `pnpm qa` green

## Integration & verification

After each track merges to `main`:
1. `pnpm install` (in case of dependency change)
2. `pnpm qa` — content validate, type check, tests, build
3. `pnpm check:links` — link checker
4. If anything fails, fix in `main` directly (small fixups) or kick back to the offending track.

After all four tracks are merged:
1. Manual smoke: `pnpm dev`, browse homepage, /compare/, /positional/rope/, a category page, a model page; check no console errors
2. `git push origin main`
3. Watch GitHub Actions deploy workflow; confirm green
4. Emit `<promise>DEPLOYED-AND-VERIFIED</promise>`

## Rollback strategy

If a push breaks the deployed site:
1. `git revert` the integration commit
2. Push the revert (NOT force-push)
3. Re-iterate on the failing track

## Open questions (resolved before execution)

| Q | Answer |
|---|---|
| Design tension (Calm vs fancy) | Motion only |
| Nav approach | Option A — Browse mega-dropdown |
| Rotary issue | Math/visual bug; full figure audit in scope |
| Card style | Option B — editorial display row |
| Compare features | All baseline + all four extras |
| New models sourcing | Research + add without further approval, citation policy enforced |
| Writing review scope | Pass over every entry |
| Text-size targets | Captions, eyebrows, pills, chips |
