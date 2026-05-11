import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

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

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("site URL must be configured in astro.config.mjs");
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const origin = site.origin;

  const techniques = await getCollection("techniques");
  const sorted = [...techniques].sort((a, b) => {
    if (a.data.year !== b.data.year) return b.data.year - a.data.year;
    return (b.data.month ?? 0) - (a.data.month ?? 0);
  });

  const items = sorted.map((t) => {
    const slugLast = t.slug.split("/").pop()!;
    const url = `${origin}${base}/${t.data.category}/${slugLast}/`;
    return `    <item>
      <title>${cdata(`${t.data.title} (${t.data.abbreviation})`)}</title>
      <link>${escape(url)}</link>
      <description>${cdata(t.data.summary)}</description>
      <pubDate>${new Date(t.data.last_verified).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escape(url)}</guid>
      <category>${escape(t.data.category)}</category>
    </item>`;
  }).join("\n");

  const feedUrl = `${origin}${base}/rss.xml`;
  const homeUrl = `${origin}${base}/`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LLM Architecture Knowledge Base</title>
    <link>${escape(homeUrl)}</link>
    <description>A chronological reference of decoder-only LLM architecture innovations — math, simple implementations, tradeoffs, and adopting models with citations.</description>
    <language>en</language>
    <atom:link href="${escape(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
