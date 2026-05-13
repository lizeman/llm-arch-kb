/**
 * Shared KaTeX macros for math typesetting across all MDX entries.
 *
 * These are passed to rehype-katex via astro.config.mjs so authors can use the
 * short forms consistently (e.g. \softmax instead of \operatorname{softmax}).
 *
 * Conventions:
 *  - Single-letter shortcuts for blackboard letters (\R, \N, \Z, \Q, \C).
 *  - Operator-style: \softmax / \sm, \argmax, \argmin, \topk.
 *  - Linear-algebra: \norm{x}, \abs{x}, \inner{x}{y}.
 *  - Common LLM symbols: \dmodel, \dhead, \dff, \dkv, \nheads, \nlayers, \nexperts.
 *  - Tensor shapes use \R^{...} not \mathbb{R}^{...} for brevity.
 *
 * Keep this list small and stable — every entry becomes a contract for authors.
 */
export const katexMacros: Record<string, string> = {
  // Blackboard letters
  "\\R": "\\mathbb{R}",
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\Q": "\\mathbb{Q}",
  "\\C": "\\mathbb{C}",
  "\\E": "\\mathbb{E}",

  // Softmax + cousins
  "\\softmax": "\\operatorname{softmax}",
  "\\sm": "\\operatorname{softmax}",
  "\\softplus": "\\operatorname{softplus}",
  "\\argmax": "\\operatorname*{arg\\,max}",
  "\\argmin": "\\operatorname*{arg\\,min}",
  "\\topk": "\\operatorname{top-k}",
  "\\KL": "\\operatorname{KL}",

  // Calculus
  "\\d": "\\mathrm{d}",

  // Linear-algebra helpers (parameterized via #1, #2)
  "\\norm": "\\left\\lVert #1 \\right\\rVert",
  "\\abs": "\\left\\lvert #1 \\right\\rvert",
  "\\inner": "\\left\\langle #1,\\, #2 \\right\\rangle",
  "\\set": "\\left\\{#1\\right\\}",

  // LLM-specific symbol shortcuts
  "\\dmodel": "d_{\\text{model}}",
  "\\dhead": "d_{\\text{head}}",
  "\\dff": "d_{\\text{ff}}",
  "\\dkv": "d_{\\text{kv}}",
  "\\nheads": "n_{\\text{heads}}",
  "\\nlayers": "n_{\\text{layers}}",
  "\\nexperts": "n_{\\text{experts}}",
  "\\ctx": "n_{\\text{ctx}}",

  // Attention shorthands
  "\\Attn": "\\operatorname{Attention}",
  "\\RoPE": "\\operatorname{RoPE}",
  "\\RMSNorm": "\\operatorname{RMSNorm}",
  "\\LayerNorm": "\\operatorname{LayerNorm}",
  "\\SwiGLU": "\\operatorname{SwiGLU}",

  // Common transformer operators
  "\\T": "^{\\top}",
};

export default katexMacros;
