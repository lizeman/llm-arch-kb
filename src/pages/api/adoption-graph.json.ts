/**
 * Static JSON endpoint: the technique-to-model adoption graph as an edge list.
 *
 * Edge shape: { technique_slug, model_slug, source_url, notes? }
 * Built from the same helper that powers the on-site adoption lists,
 * so the JSON view is guaranteed to match the rendered pages.
 */
import type { APIRoute } from "astro";
import { buildAdoptionGraph } from "~/utils/adoption-graph";

export const GET: APIRoute = async () => {
  const edges = await buildAdoptionGraph();
  const flat = edges.map((e) => ({
    technique_slug: e.technique,
    model_slug: e.model,
    source_url: e.source_url,
    notes: e.notes,
  }));
  return new Response(JSON.stringify(flat, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
