/**
 * Snapshot smoke tests for the Browse mega-dropdown Nav.
 *
 * Only runs when `dist/` is present (post-build). Each assertion is a structural
 * contract — design tokens / motion / hover behavior are intentionally not
 * asserted here, only the markup the Astro template emits.
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

function homePath(): string | null {
  const home = path.join(DIST, "index.html");
  return fs.existsSync(home) ? home : null;
}

describe.skipIf(!DIST_EXISTS)("Nav.astro — Browse mega-dropdown", () => {
  it("home page contains a Browse disclosure trigger", () => {
    const home = homePath();
    expect(home).not.toBeNull();
    const $ = cheerio.load(read(home!));
    const trigger = $(".site-nav__browse-trigger");
    expect(trigger.length, "should have a Browse trigger").toBe(1);
    expect(trigger.attr("aria-haspopup"), "trigger should expose haspopup").toBe("true");
    expect(trigger.attr("aria-expanded"), "trigger starts collapsed").toBe("false");
  });

  it("the dropdown panel has two eyebrow-labeled columns", () => {
    const home = homePath();
    const $ = cheerio.load(read(home!));
    const panel = $("#browse-panel");
    expect(panel.length, "panel exists").toBe(1);
    expect(panel.attr("hidden"), "panel starts hidden").toBeDefined();
    const eyebrows = panel.find(".section-eyebrow").map((_, el) => $(el).text().trim()).get();
    expect(eyebrows, "panel labels its two columns").toEqual(
      expect.arrayContaining(["By category", "By lens"]),
    );
  });

  it("each category appears as a panel link", () => {
    const home = homePath();
    const $ = cheerio.load(read(home!));
    const panelLinks = $("#browse-panel a").map((_, el) => $(el).attr("href") ?? "").get();
    const must = ["/positional/", "/attention/", "/normalization/", "/ffn-moe/", "/long-context/", "/residual/"];
    for (const m of must) {
      expect(
        panelLinks.some((h) => h.includes(m)),
        `Browse panel should link to ${m}`,
      ).toBe(true);
    }
  });

  it("top row keeps Models / Compare / Timeline / About / Search", () => {
    const home = homePath();
    const $ = cheerio.load(read(home!));
    const topLinks = $(".site-nav__list > li:not(.site-nav__item--browse) a")
      .map((_, el) => $(el).text().trim())
      .get();
    for (const label of ["Models", "Compare", "Timeline", "About", "Search"]) {
      expect(topLinks, `Nav top row should expose ${label}`).toContain(label);
    }
  });

  it("hamburger toggle exists for the mobile fallback", () => {
    const home = homePath();
    const $ = cheerio.load(read(home!));
    const ham = $(".site-nav__hamburger");
    expect(ham.length, "hamburger button is present").toBe(1);
    expect(ham.attr("aria-controls"), "hamburger controls primary list").toBe("primary-nav");
  });
});
