# LLM Architecture Knowledge Base

A chronologically-organized reference of decoder-only LLM architecture innovations. Each entry covers the math, a simple implementation sketch, tradeoffs, ablation results, and which disclosed production models adopt it — with citations.

Built with **Astro 5** + **Solid** islands + **plain CSS**. Hosted on **GitHub Pages**.

The full build plan is in [`plan-final.md`](./plan-final.md). The design system is "Calm Editorial" — three visual moves only (typographic hierarchy, one accent color, generous whitespace). See §3 and §3.4 (anti-patterns) before adding any visual element.

## Quickstart

```bash
pnpm install
pnpm dev
```

Open <http://localhost:4321/llm-arch-kb/>.

## Project commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local dev server with HMR |
| `pnpm build` | Static build to `dist/` plus Pagefind index |
| `pnpm preview` | Preview the production build locally |
| `pnpm validate-content` | Enforce §9 closed-model citation policy (CI gate) |
| `pnpm check` | Astro + TS check |

## Content rules (non-negotiable)

- **No inferred architecture claims** for closed models (GPT-*, Claude, Gemini, etc.). Their entries exist with `disclosure_level: undisclosed` and null architecture fields. See §9.
- Every `adopted_by` entry **must** include a `source_url`. CI enforces this.
- Visual elements forbidden in v1: paper textures, gradient washes, drop caps, marginal callouts, multi-color accents, dark "synthesis" blocks, decorative code/equation cards, Mermaid. See §3.4 for the full list.

## Deploy

`main` push runs `.github/workflows/deploy.yml`:

1. `pnpm validate-content` (citation gate)
2. `pnpm build` (Astro + Pagefind)
3. `actions/deploy-pages` publishes `dist/` to GitHub Pages

Set the repo to **Pages → Source: GitHub Actions** in repo settings.

## License

Code: MIT. Content: CC-BY-4.0.
