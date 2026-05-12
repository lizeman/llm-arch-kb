# Ralph loop: drive llm-arch-kb toward v3 completion

You are continuing iterative work on the **llm-arch-kb** knowledge base
(`/Users/lizeman/Dropbox (GaTech)/Mac/Documents/llm-arch-kd/`). The full spec is
`plan-final.md` at the repo root — that file is the source of truth. Re-read its
§3 (design system), §3.4 (anti-patterns), §6 (schema), §7 (entry template),
§9 (closed-model citation policy), §11 (figure contract), and §12.3 (v3 content
roadmap) any time you need to reground.

The site already exists, builds clean, and is deployed to
`https://lizeman.github.io/llm-arch-kb/` via `.github/workflows/deploy.yml` on
every push to `main`. Your job is to **close the gap to the v3 ship target
(~55 entries, ~24 models, ~30 figures)** one well-scoped unit at a time, then
commit and push so the live site updates.

## Each iteration, do exactly this:

### Step 1 — Sense the current state
```bash
cd "/Users/lizeman/Dropbox (GaTech)/Mac/Documents/llm-arch-kd/"
git pull --ff-only
find src/content/techniques -name "*.mdx" | sort
find src/content/models     -name "*.mdx" | sort
find src/components/figures -name "*.tsx" | sort
git log --oneline -20
```

### Step 2 — Pick the next single unit of work

Pick **exactly one** of these in priority order (skip a category once it's at
target). Do NOT do more than one in a single iteration — small commits are
easier to verify and let the live site update incrementally.

**A. Missing v3 technique entry** (highest priority — content is the product).
Compare `src/content/techniques/**` against §12.3 of `plan-final.md`. Known
remaining slugs as of loop start (verify before doing — others may be done):

- `positional/longrope.mdx` — "LongRoPE" (Microsoft, 2024, arXiv 2402.13753)
- `positional/decoupled-rope.mdx` — "Decoupled RoPE" (DeepSeek-V2, 2024)
- `normalization/deepnorm.mdx` — "DeepNorm" (Microsoft, 2022, arXiv 2203.00555)
- `normalization/sandwich-ln.mdx` — "Sandwich-LN / Peri-LN"
- `normalization/olmo2-post-norm.mdx` — "OLMo 2 Post-Norm" (AI2, 2024)
- `normalization/gemma3-norm-everywhere.mdx` — "Norm-everywhere" (Google, 2025)
- `residual/hyper-connections.mdx` — "Hyper-Connections" (ByteDance, 2024, arXiv 2409.19606)
- `residual/dynamic-hc.mdx` — "Dynamic Hyper-Connections / mHC"
- `ffn-moe/kimi-k2-moe.mdx` — "Kimi K2 MoE"
- `attention/dsa.mdx` — "DeepSeek Sparse Attention" (DeepSeek-V3.2, 2024)

**B. Missing v3 production model** (second priority — open / documented only,
strict §9 citation rules):

- `llama-3-base.mdx` — Llama 3 70B base (separate from 3.1)
- `llama-4-scout.mdx` or `llama-4-maverick.mdx` — Llama 4 (released 2025)
- `deepseek-v1.mdx` — DeepSeek 67B (2024, arXiv 2401.02954)
- `deepseek-v3-1.mdx` — DeepSeek-V3.1
- `deepseek-v3-2.mdx` — DeepSeek-V3.2 (Sparse Attention variant)
- `deepseek-r1.mdx` — DeepSeek-R1
- `gemma-1-7b.mdx` — Gemma 1
- `recurrent-gemma-2b.mdx` — RecurrentGemma
- `kimi-k1-5.mdx` — Kimi K1.5 (Moonshot)
- `kimi-k2.mdx` — Kimi K2
- `glm-130b.mdx` — GLM-130B (Zhipu, 2022)
- `glm-4.mdx` — GLM-4
- `glm-4-5.mdx` — GLM-4.5

**C. High-value figure from §11.2** (third priority — defer until A and B are
exhausted, since prose is the spine of the site). Good additions:

- `RopeBaseSweep.tsx` (RoPE entry)
- `AlibiSlopes.tsx` (ALiBi entry)
- `YarnBands.tsx` (YaRN entry)
- `LayerNormVsRMS.tsx` (RMSNorm entry)
- `QkNormLogits.tsx` (QK-Norm entry)
- `DeepSeekMoeShared.tsx` (DeepSeekMoE entry)
- `AuxLossFreeBias.tsx` (DeepSeek V3 routing)
- `FlashTiling.tsx` (FlashAttention)

**D. Wire-up / hygiene** if you spot it incidentally during A/B/C — add a new
model to existing techniques' `adopted_by`, fix a broken link, fill in a missing
`source_url`. NEVER speculate to fill a `null` field on an `undisclosed` model.

### Step 3 — Build it

Use the entry template in `plan-final.md` §7. Hard rules:

- Match an existing similar entry's structure (`src/content/techniques/attention/mla.mdx`
  is the canonical reference for technique entries; `src/content/models/deepseek-v3.mdx`
  for models).
- One serif font, one accent color, **none** of the §3.4 anti-patterns.
  No drop caps, gradients, second accent colors, decorative card chrome,
  Mermaid, or marketing language ("revolutionary", "powerful", etc.).
- KaTeX for math (`$...$` / `$$...$$`), Markdown fenced blocks for code.
- Set `last_verified` to today's date in ISO format (run `date +%Y-%m-%d`).
- For every `adopted_by` entry, include a real `source_url` (paper URL,
  Hugging Face model card, official lab blog, official repo). If you can't
  cite, drop the claim.
- For models with `disclosure_level: undisclosed`, every `architecture.*`
  field MUST be `null`. The schema enforces this; CI will fail otherwise.
- For figures: SVG `viewBox`, pointer events not mouse, ≥44px touch targets,
  `aria-valuetext` on every slider, respect `prefers-reduced-motion`,
  ≤400 lines, default state renders at SSR. Reference
  `src/components/figures/RopeRotor.tsx` as the canonical figure shape.

When adding a new technique entry, also wire the new model (if relevant)
into the existing technique's `adopted_by` list. When adding a new model,
also add it to the `adopted_by` of any technique it uses.

### Step 4 — Validate locally before committing

```bash
pnpm validate-content    # §9 citation gate
pnpm check               # Astro + TS check
pnpm test                # vitest unit tests
pnpm exec astro build    # full build
```

If any of these fail, fix the issue in the same iteration. Do not commit a
broken build. If the failure is genuinely upstream (e.g., a flaky test
unrelated to your change), investigate before papering over.

### Step 5 — Commit and push

Single focused commit per unit of work. Use the existing repo commit-message
style (`git log --oneline -20` to see it — terse, no leading "feat:" prefix,
~50 chars subject). Always include the Claude co-author trailer:

```bash
git add -A
git commit -m "$(cat <<'EOF'
<terse subject describing the one thing you added>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

The push triggers `.github/workflows/deploy.yml`, which redeploys the live
site within ~2 minutes. If push fails because origin moved, `git pull --rebase`
and re-push.

### Step 6 — Decide whether to continue

Count what's done vs. v3 targets:

```bash
echo "techniques: $(find src/content/techniques -name '*.mdx' | wc -l) / 55"
echo "models:     $(find src/content/models     -name '*.mdx' | wc -l) / 24"
echo "figures:    $(find src/components/figures -name '*.tsx' | wc -l) / 30"
```

If **all three** are at or above target AND `pnpm qa` passes AND there are
no remaining items in the §12.3 lists, output exactly:

```
<promise>V3_KNOWLEDGE_BASE_COMPLETE</promise>
```

Otherwise, exit normally — the loop's stop hook will re-fire this prompt
and you'll start the next iteration on the next gap.

## Discipline reminders

- **One unit per iteration.** Don't stack multiple new entries into one commit.
  The loop is designed to make many small, verifiable improvements.
- **Read before write.** Every iteration starts with `git pull` and a fresh
  scan of what exists — your previous-iteration intent is in git history,
  not in your context.
- **Cite or skip.** A claim without a `source_url` doesn't go in. The CI
  will fail and waste an iteration if you try.
- **Restraint over flourish.** When in doubt about visual changes, do nothing.
  The design battle is preventing ornament, not adding it.
- **Don't touch deploy infra** (`.github/workflows/`, `astro.config.mjs`,
  `package.json` scripts) unless something is genuinely broken. The pipeline
  works; don't break it.
- **No new dependencies** unless absolutely required for a figure. The stack
  is fixed per `plan-final.md` §2.

Begin with Step 1.
