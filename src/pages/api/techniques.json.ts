/**
 * Static JSON endpoint: all techniques.
 *
 * Emits to dist/api/techniques.json at build time. The site is statically
 * generated, so this is read-only — clients can fetch the whole corpus
 * for downstream tooling (graph builders, search indexers, etc.).
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const entries = await getCollection("techniques");
  const techniques = entries.map((e) => ({
    slug: e.slug,
    ...e.data,
  }));
  return new Response(JSON.stringify({ techniques }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
