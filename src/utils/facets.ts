export const FACETS = [
  "efficiency",
  "training-stability",
  "kv-cache",
  "long-context",
  "inference-only",
  "hardware-aware",
  "parameter-free",
  "quality",
  "routing",
] as const;

export type Facet = (typeof FACETS)[number];

export const FACET_LABELS: Record<Facet, string> = {
  efficiency: "Efficiency",
  "training-stability": "Training stability",
  "kv-cache": "KV cache",
  "long-context": "Long context",
  "inference-only": "Inference-only",
  "hardware-aware": "Hardware-aware",
  "parameter-free": "Parameter-free",
  quality: "Quality",
  routing: "Routing",
};

export const FACET_DESCRIPTIONS: Record<Facet, string> = {
  efficiency: "Techniques that reduce parameters, FLOPs, or memory at fixed quality.",
  "training-stability": "Methods that help loss curves stay smooth and convergent.",
  "kv-cache": "Tricks that shrink the per-token attention cache during generation.",
  "long-context": "Tools to extend the usable sequence length.",
  "inference-only": "Modifications that touch decoding without retraining.",
  "hardware-aware": "Designs that exploit modern accelerator memory hierarchies.",
  "parameter-free": "Reformulations that add no learnable parameters.",
  quality: "Choices motivated primarily by held-out loss or downstream wins.",
  routing: "Mechanisms that send tokens to a subset of compute.",
};
