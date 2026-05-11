# Contributing

Thanks for your interest. This is a knowledge base, not a blog — every contribution must be
cited and must follow the [§9 closed-model policy](./plan-final.md) (no inferred architecture
claims for undocumented models).

## How to add a technique entry

1. Pick a category from `src/content/techniques/`: `positional`, `normalization`, `residual`,
   `ffn-moe`, `attention`, `long-context`.
2. Create `src/content/techniques/<category>/<slug>.mdx`.
3. Use the frontmatter schema in `src/content/config.ts`. Required fields include
   `title`, `abbreviation`, `category`, `year`, `paper_url`, `arxiv_id`, `summary`,
   `last_verified`, and one entry per adopting model (each with a `source_url`).
4. Write body in MDX. Math uses `$...$` and `$$...$$` (KaTeX). Code blocks are plain Markdown.
5. Use **only** the components listed in `src/components/` — `Summary`, `AdoptionList`, etc.
   Do not introduce `<Marginal>`, drop caps, equation cards, dark synthesis blocks, or any
   anti-pattern in [§3.4 of the plan](./plan-final.md).

## How to add a model spec sheet

1. Create `src/content/models/<slug>.mdx`.
2. Set `disclosure_level` honestly: `open`, `documented`, `partial`, or `undisclosed`.
3. For `undisclosed`, every `architecture.*` field must be `null`. No guessing.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:4321/llm-arch-kb/
pnpm qa           # validate-content + check + test + build
```

CI runs the same `qa` pipeline on every PR.

## Design system

The site has three visual moves: typographic hierarchy, one accent color, generous whitespace.
Before adding any visual element, read §3 of `plan-final.md`. The [anti-pattern list](./plan-final.md)
is what to push back on.
