export const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function slugTail(slug: string): string {
  return slug.split("/").pop()!;
}

export function techniqueHref(category: string, slug: string): string {
  return `${BASE}/${category}/${slugTail(slug)}/`;
}

export function modelHref(slug: string): string {
  return `${BASE}/models/${slug}/`;
}
