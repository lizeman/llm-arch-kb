/**
 * Per-category RSS feed.
 *
 * Mirrors the whole-site /rss.xml shape but filters to a single technique
 * category and uses a category-specific channel title.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { sortChronological } from "~/utils/chronological-sort";
import { BASE, slugTail } from "~/utils/site";
import { TECHNIQUE_CATEGORIES } from "~/content/config";
import { CATEGORY_LABELS } from "~/utils/adoption-graph";

type Category = (typeof TECHNIQUE_CATEGORIES)[number];

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

/**
 * Pick the best timestamp for an item's pubDate.
 *
 * Prefer last_verified (the per-entry update marker). Fall back to year/month
 * for entries that lack it. Day defaults to the first of the month.
 */
function pubDate(data: { last_verified?: string; year: number; month?: number }): string {
  if (data.last_verified) {
    const d = new Date(data.last_verified);
    if (!Number.isNaN(d.getTime())) return d.toUTCString();
  }
  const m = (data.month ?? 1) - 1;
  return new Date(Date.UTC(data.year, m, 1)).toUTCString();
}

export async function getStaticPaths() {
  return TECHNIQUE_CATEGORIES.map((category) => ({ params: { category } }));
}

export const GET: APIRoute = async ({ site, params }) => {
  if (!site) throw new Error("site URL must be configured in astro.config.mjs");
  const origin = site.origin;
  const category = params.category as Category;

  const all = await getCollection("techniques", (e) => e.data.category === category);
  const sorted = sortChronological(all).reverse();

  const items = sorted
    .map((t) => {
      const url = `${origin}${BASE}/${t.data.category}/${slugTail(t.slug)}/`;
      return `    <item>
      <title>${cdata(`${t.data.title} (${t.data.abbreviation})`)}</title>
      <link>${escape(url)}</link>
      <description>${cdata(t.data.summary)}</description>
      <pubDate>${pubDate(t.data)}</pubDate>
      <guid isPermaLink="true">${escape(url)}</guid>
      <category>${escape(t.data.category)}</category>
    </item>`;
    })
    .join("\n");

  const feedUrl = `${origin}${BASE}/${category}/rss.xml`;
  const homeUrl = `${origin}${BASE}/${category}/`;
  const label = CATEGORY_LABELS[category] ?? category;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LLM Architecture KB — ${escape(label)}</title>
    <link>${escape(homeUrl)}</link>
    <description>${escape(label)} techniques tracked in the LLM Architecture Knowledge Base.</description>
    <language>en</language>
    <atom:link href="${escape(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
