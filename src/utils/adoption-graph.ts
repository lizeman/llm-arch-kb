import { getCollection } from "astro:content";

export type AdoptionEdge = {
  technique: string;
  technique_title: string;
  model: string;
  source_url: string;
  notes?: string;
};

export async function buildAdoptionGraph(): Promise<AdoptionEdge[]> {
  const techniques = await getCollection("techniques");
  const edges: AdoptionEdge[] = [];
  for (const t of techniques) {
    for (const adoption of t.data.adopted_by ?? []) {
      edges.push({
        technique: t.slug,
        technique_title: t.data.title,
        model: adoption.model,
        source_url: adoption.source_url,
        notes: adoption.notes,
      });
    }
  }
  return edges;
}

export async function techniquesAdoptedBy(modelSlug: string): Promise<AdoptionEdge[]> {
  const all = await buildAdoptionGraph();
  return all.filter((e) => e.model === modelSlug);
}

export async function modelsAdopting(techniqueSlug: string): Promise<AdoptionEdge[]> {
  const all = await buildAdoptionGraph();
  return all.filter((e) => e.technique === techniqueSlug);
}

export const CATEGORY_LABELS: Record<string, string> = {
  positional: "Positional Encoding",
  normalization: "Normalization",
  residual: "Residual Connections",
  "ffn-moe": "FFN & MoE",
  attention: "Attention Mechanisms",
  "long-context": "Long Context",
};
