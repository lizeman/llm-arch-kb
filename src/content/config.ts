import { defineCollection, z } from "astro:content";

const TECHNIQUE_CATEGORIES = [
  "positional",
  "normalization",
  "residual",
  "ffn-moe",
  "attention",
  "long-context",
] as const;

const techniques = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    abbreviation: z.string(),
    category: z.enum(TECHNIQUE_CATEGORIES),
    subcategory: z.string().optional(),

    year: z.number().int().min(2010).max(2100),
    month: z.number().int().min(1).max(12).optional(),
    introduced_by: z.string(),
    paper_title: z.string(),
    arxiv_id: z.string(),
    paper_url: z.string().url(),

    status: z.enum(["foundational", "production-adopted", "research", "deprecated"]),
    problem_solved: z.string(),

    predecessors: z.array(z.string()).default([]),
    successors: z.array(z.string()).default([]),

    adopted_by: z
      .array(
        z.object({
          model: z.string(),
          source_url: z.string().url(),
          notes: z.string().optional(),
        }),
      )
      .default([]),

    figure_component: z.string().optional(),
    figure_caption: z.string().optional(),

    summary: z.string(),
    tags: z.array(z.string()).default([]),

    order: z.number().int().optional(),
    last_verified: z.string(),
  }),
});

const models = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
    slug: z.string().optional(),
    organization: z.string(),
    release_date: z.string(),
    parameters_total: z.string(),
    parameters_active: z.string().optional(),
    context_length: z.number().int().positive(),
    open_weights: z.boolean(),
    paper_url: z.string().url().optional(),
    model_card_url: z.string().url().optional(),

    disclosure_level: z.enum(["open", "documented", "partial", "undisclosed"]),

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
  }),
});

export const collections = { techniques, models };
export { TECHNIQUE_CATEGORIES };
