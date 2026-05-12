/**
 * Static JSON endpoint: all model spec sheets.
 *
 * Emits to dist/api/models.json at build time.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const entries = await getCollection("models");
  const models = entries.map((e) => ({
    slug: e.slug,
    ...e.data,
  }));
  return new Response(JSON.stringify({ models }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
