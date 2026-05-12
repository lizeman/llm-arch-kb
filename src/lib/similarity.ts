import { buildAdoptionGraph } from "~/utils/adoption-graph";

/**
 * Architecture similarity (plan Loop 5).
 *
 * Two models are "similar" when they share many techniques. We compute the
 * set of techniques each model is listed under (via the technique →
 * adopted_by[] edges in the adoption graph) and report Jaccard similarity
 * between those sets.
 *
 * Jaccard sim(A, B) = |A ∩ B| / |A ∪ B|, in [0, 1]. Both-empty sets return 0
 * (no shared signal → not "similar" in any meaningful sense).
 */

export async function techniquesAdoptedByModel(modelSlug: string): Promise<Set<string>> {
  const edges = await buildAdoptionGraph();
  const techniques = new Set<string>();
  for (const e of edges) {
    if (e.model === modelSlug) techniques.add(e.technique);
  }
  return techniques;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) {
    if (b.has(x)) intersection++;
  }
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

export async function modelSimilarity(modelA: string, modelB: string): Promise<number> {
  const [setA, setB] = await Promise.all([
    techniquesAdoptedByModel(modelA),
    techniquesAdoptedByModel(modelB),
  ]);
  return jaccard(setA, setB);
}

export type SimilarModel = {
  slug: string;
  similarity: number;
  shared: number;
  union: number;
};

export async function mostSimilarModels(
  modelSlug: string,
  allModelSlugs: string[],
  k = 3,
): Promise<SimilarModel[]> {
  const edges = await buildAdoptionGraph();
  const bySlug = new Map<string, Set<string>>();
  for (const e of edges) {
    let set = bySlug.get(e.model);
    if (!set) {
      set = new Set<string>();
      bySlug.set(e.model, set);
    }
    set.add(e.technique);
  }

  const target = bySlug.get(modelSlug) ?? new Set<string>();
  if (target.size === 0) return [];

  const results: SimilarModel[] = [];
  for (const other of allModelSlugs) {
    if (other === modelSlug) continue;
    const otherSet = bySlug.get(other);
    if (!otherSet || otherSet.size === 0) continue;
    let shared = 0;
    for (const t of target) {
      if (otherSet.has(t)) shared++;
    }
    if (shared === 0) continue;
    const union = target.size + otherSet.size - shared;
    const sim = union === 0 ? 0 : shared / union;
    results.push({ slug: other, similarity: sim, shared, union });
  }

  results.sort((a, b) => b.similarity - a.similarity || b.shared - a.shared);
  return results.slice(0, k);
}
