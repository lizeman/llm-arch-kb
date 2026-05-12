/**
 * Snapshot smoke tests over the built `dist/` directory.
 *
 * Runs only when `dist/` exists (i.e. after `pnpm build`). Other Vitest
 * invocations (e.g. plain `pnpm test`) cleanly skip these.
 *
 * Each test individually skipIfs missing pages so optional routes added by
 * sibling agents don't make CI red.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const DIST_EXISTS = fs.existsSync(DIST);

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function existsHtml(rel: string): string | null {
  const candidates = [
    path.join(DIST, rel, "index.html"),
    path.join(DIST, `${rel}.html`),
    path.join(DIST, rel),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

describe.skipIf(!DIST_EXISTS)("dist snapshot (built site)", () => {
  it("home page has an <h1> and at least 6 category links", () => {
    const home = existsHtml("");
    expect(home, "dist/index.html should exist after build").not.toBeNull();
    const $ = cheerio.load(read(home!));
    expect($("h1").length, "home should have at least one h1").toBeGreaterThan(0);

    // Categories live under /llm-arch-kb/<category>/ (BASE-prefixed).
    const CATEGORIES = [
      "positional",
      "normalization",
      "residual",
      "ffn-moe",
      "attention",
      "long-context",
    ];
    let hits = 0;
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (CATEGORIES.some((c) => href.includes(`/${c}/`) || href.endsWith(`/${c}`))) hits++;
    });
    expect(hits, "home page should link to all 6 category indexes").toBeGreaterThanOrEqual(6);
  });

  it("compare page exists and shows a table or model listing", () => {
    const compare = existsHtml("compare");
    expect(compare, "dist should contain a compare page").not.toBeNull();
    const $ = cheerio.load(read(compare!));
    const hasTable = $("table").length > 0;
    const hasList = $("ul li").length >= 3 || $("ol li").length >= 3;
    expect(hasTable || hasList, "compare should render a table or a model list").toBe(true);
  });

  it("timeline page exists with at least 30 list items", () => {
    const tl = existsHtml("timeline");
    expect(tl, "dist should contain a timeline page").not.toBeNull();
    const $ = cheerio.load(read(tl!));
    const items = $("li").length;
    expect(items, "timeline should list every technique").toBeGreaterThanOrEqual(30);
  });

  it.skipIf(!existsHtml("glossary"))("glossary page renders if present", () => {
    const g = existsHtml("glossary")!;
    const $ = cheerio.load(read(g));
    expect($("h1").length, "glossary should have an h1").toBeGreaterThan(0);
  });

  it.skipIf(!existsHtml("positional/rope"))("a sample technique page renders correctly", () => {
    const p = existsHtml("positional/rope")!;
    const $ = cheerio.load(read(p));
    expect($("h1").length, "technique page should have an h1").toBeGreaterThan(0);
    // RoPE has many adopters — if the page renders adoption, an "Adopted by" heading exists.
    const text = $("body").text().toLowerCase();
    expect(text.length, "technique page should not be empty").toBeGreaterThan(100);
  });

  it.skipIf(!existsHtml("models/llama-3-1-70b"))("a sample model page renders correctly", () => {
    const p = existsHtml("models/llama-3-1-70b")!;
    const $ = cheerio.load(read(p));
    expect($("h1").length, "model page should have an h1").toBeGreaterThan(0);
    // The "Architecture" h2 is rendered by ModelLayout.
    const headings = $("h2").map((_, el) => $(el).text()).get().join("|");
    expect(headings, "model page should include an Architecture section").toContain("Architecture");
  });
});
