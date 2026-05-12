<!--
Thanks for contributing to the LLM Architecture Knowledge Base.

CI runs `pnpm qa` (schema validator + astro check + vitest + build). PRs that
violate the citation policy (§9) — e.g. an `adopted_by` entry without a
`source_url`, or an `undisclosed` model with populated architecture fields —
will fail the validator. Please address checklist items before requesting review.
-->

## Summary

<!-- 1–3 sentences. What does this PR change and why? -->

## Type of change

- [ ] New technique entry
- [ ] New model spec sheet
- [ ] Update to existing technique / model
- [ ] Figure / component
- [ ] Tooling / CI / infrastructure
- [ ] Documentation only

## Checklist

- [ ] I ran `pnpm qa` locally and it passed.
- [ ] Every new `adopted_by` entry has a `source_url`.
- [ ] If I touched URLs, I ran `pnpm check:links` and reviewed the warnings.
- [ ] Frontmatter `last_verified` is set to today's date for any entry I edited.
- [ ] I did not add new color tokens or gradients (calm-editorial constraint).
- [ ] I did not introduce heavy new dependencies (`cheerio` + `node:fetch` are the agreed exception for tooling).

## Notes for reviewers

<!-- Anything you want the reviewer to focus on, or known limitations. -->
