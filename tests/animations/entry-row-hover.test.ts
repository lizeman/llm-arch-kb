/**
 * Entry-row hover animation contract.
 *
 * Editorial card rows reveal a chevron + "Read" affordance on hover/focus.
 * The animation is implemented entirely in CSS in global.css via opacity +
 * transform transitions on .entry-row__cta and .entry-row__chevron. We verify
 * the built stylesheet still contains those rules and that the hover/focus
 * pseudo-classes flip them into the "shown" state.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..", "..");
const DIST = path.join(ROOT, "dist");
const DIST_EXISTS = fs.existsSync(DIST);

function findCssWith(needle: string): string | null {
  const dir = path.join(DIST, "_astro");
  if (!fs.existsSync(dir)) return null;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".css")) continue;
    const body = fs.readFileSync(path.join(dir, f), "utf8");
    if (body.includes(needle)) return body;
  }
  return null;
}

describe.skipIf(!DIST_EXISTS)("Animation: entry-row chevron / CTA hover reveal", () => {
  it("base CTA state is hidden and animatable", () => {
    const css = findCssWith(".entry-row__cta");
    expect(css, "entry-row CSS missing").not.toBeNull();
    // base rule: opacity:0 and a transition declaration on the CTA
    expect(css!).toMatch(/\.entry-row__cta\s*\{[^}]*opacity:\s*0/);
    expect(css!).toMatch(/\.entry-row__cta\s*\{[^}]*transition:[^}]*opacity/);
  });

  it("hover + focus-visible bring the CTA fully visible", () => {
    const css = findCssWith(".entry-row__cta");
    expect(css!).toMatch(
      /\.entry-row:hover\s+\.entry-row__cta[\s\S]*?\.entry-row:focus-visible\s+\.entry-row__cta\s*\{[^}]*opacity:\s*1/,
    );
  });

  it("chevron slides in on hover/focus via translateX", () => {
    const css = findCssWith(".entry-row__chevron");
    expect(css!).toMatch(/\.entry-row__chevron\s*\{[^}]*transition:\s*transform/);
    // The CSS minifier rewrites translateX(4px) → translate(4px) (per the
    // CSS Transforms spec, single-arg translate() means translateX). Accept
    // either form so the contract isn't tied to a tooling choice.
    expect(css!).toMatch(
      /\.entry-row:hover\s+\.entry-row__chevron[\s\S]*?\.entry-row:focus-visible\s+\.entry-row__chevron\s*\{[^}]*transform:\s*translate(?:X)?\(4px\)/,
    );
  });
});
