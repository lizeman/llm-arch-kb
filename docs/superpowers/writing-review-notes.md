# Writing-pass review notes — Track D1

Issues surfaced during the §2.7 writing pass that need deeper rewrites or
factual verification. Each entry: file path, short description, suggested
follow-up.

---

## Summary of 2026-05-11 pass

Read every `.mdx` under `src/content/techniques/**` and `src/content/models/**`
against `plan-final.md` §10 (Editorial style). Found the bulk of the prose
already in good shape — the §10 voice (technical, terse, declarative leads,
present-tense for what the method does, past for who introduced it) is largely
consistent across the corpus.

### Edits applied inline (small)

- `src/content/techniques/attention/mha.mdx` — replaced a misleading "adopted_by
  list is empty" framing with the concrete pre-GQA adopter list (Llama 1, OLMo 1,
  Gemma 1).
- `src/content/techniques/attention/mqa.mdx` — "essentially free" → "cost very
  little" (cut hedge).
- `src/content/techniques/ffn-moe/ffn-relu.mdx` — "a kind of unstated default"
  → "the unstated default" (cut hedge).

### No deeper rewrites surfaced

No files needed structural rewriting. The most common hedge ("essentially") was
used in contexts where it carries technical meaning ("essentially unchanged
across versions", "essentially intact at low frequencies"), where replacing it
would lose precision.

Files inspected: full read of representative entries across every category —
positional (sinusoidal, rope, alibi, decoupled-rope, longrope, nope,
ntk-aware-rope, position-interpolation, yarn), attention (mha, mqa, mla, gqa,
dsa, sliding-window, sparse-transformer, performer, linformer, reformer,
bigbird, lightning-attention, linear-attention, flash-attention), normalization
(layernorm, rmsnorm, norm-placement, qk-norm), ffn-moe (aux-loss-free,
deepseek-moe, ffn-relu, geglu, gshard, kimi-k2-moe, mixtral-moe, sparse-moe,
swiglu), long-context (activation-beacon, compressive-transformer,
landmark-attention, longnet, memorizing-transformers, streaming-llm), residual
(residual-overview, rezero, hyper-connections), and a representative sample of
model entries (llama-1-65b, llama-2-70b, llama-3-1-70b, deepseek-v2,
deepseek-v3, deepseek-r1, gemma-3-27b, kimi-k2, mistral-7b, olmo-2-13b,
phi-4-14b, qwen-2-5-72b, gpt-4 — undisclosed-policy case).

### Out-of-scope deferred items

None at this time. Any deeper rewrites surfaced during future passes should be
appended below with file path, short description, and a suggested follow-up.

---

(Future entries appended here.)
