/**
 * Snapshot smoke tests for the editorial display-row card surfaces
 * (homepage Featured, category entry list, related-techniques).
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
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

describe.skipIf(!DIST_EXISTS)("Editorial display row — card surfaces", () => {
  it("home Featured list uses the entry-row layout", () => {
    const home = existsHtml("");
    expect(home).not.toBeNull();
    const $ = cheerio.load(read(home!));
    const rows = $(".featured .entry-row");
    expect(rows.length, "home should render at least one featured entry row").toBeGreaterThan(0);
    const first = rows.first();
    expect(first.find(".entry-row__title strong").length, "row has a title").toBe(1);
    expect(first.find(".entry-row__abbr").length, "row has an abbreviation").toBe(1);
    expect(first.find(".entry-row__hook").length, "row has a problem-solved hook").toBe(1);
    expect(first.find(".entry-row__meta").length, "row has a meta line").toBe(1);
    expect(first.find(".entry-row__adopters").length, "meta surfaces adopter count").toBe(1);
    expect(first.find(".entry-row__cta").length, "row has a Read entry CTA").toBe(1);
  });

  it("category page entry list uses the entry-row layout", () => {
    const cat = existsHtml("positional");
    expect(cat, "dist/positional/index.html should exist").not.toBeNull();
    const $ = cheerio.load(read(cat!));
    const rows = $(".entry-list .entry-row");
    expect(rows.length, "category page should render >0 entry rows").toBeGreaterThan(0);
    const first = rows.first();
    expect(first.find(".entry-row__hook").length, "row has a hook").toBe(1);
    expect(first.find(".entry-row__meta").length, "row has a meta line").toBe(1);
  });

  it("related-techniques panel uses the entry-row layout (if present)", () => {
    const rope = existsHtml("positional/rope");
    if (!rope) return; // optional; sibling tracks may not have shipped the entry
    const $ = cheerio.load(read(rope));
    const relatedRows = $(".related .entry-row");
    // The related panel only renders when there are scoring matches; if so,
    // each row must use the editorial structure.
    if (relatedRows.length > 0) {
      const first = relatedRows.first();
      expect(first.find(".entry-row__title strong").length, "related row has a title").toBe(1);
      expect(first.find(".entry-row__meta").length, "related row has meta").toBe(1);
    }
  });
});
