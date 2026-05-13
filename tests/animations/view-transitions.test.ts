/**
 * View-transition animation contract.
 *
 * The base layout opts into Astro's ClientRouter and tags <main> with
 * transition:name="main-article". The crossfade is implemented by CSS in
 * src/styles/global.css. This test checks that the built stylesheet still
 * contains the expected ::view-transition rules and @keyframes so the fade
 * actually engages in production. Reduced-motion handling is owned by
 * tokens.css (animation-duration: 0.01ms) and is asserted separately.
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

describe.skipIf(!DIST_EXISTS)("Animation: Astro view transition crossfade", () => {
  it("ships ::view-transition rules for the main-article scope", () => {
    const css = findCssWith("view-transition-old(main-article)");
    expect(css, "no built CSS contained the main-article view-transition rule").not.toBeNull();
    expect(css!).toMatch(/::view-transition-old\(main-article\)\s*\{[^}]*animation:\s*kb-fade-out/);
    expect(css!).toMatch(/::view-transition-new\(main-article\)\s*\{[^}]*animation:\s*kb-fade-in/);
  });

  it("defines kb-fade-out and kb-fade-in keyframes", () => {
    const css = findCssWith("kb-fade-out");
    expect(css, "kb-fade-out keyframes missing").not.toBeNull();
    expect(css!).toMatch(/@keyframes\s+kb-fade-out\s*\{[^}]*opacity:\s*0/);
    expect(css!).toMatch(/@keyframes\s+kb-fade-in\s*\{[^]*opacity:\s*0[^]*opacity:\s*1/);
  });

  it("reduced-motion neutralizes animation durations on the universal rule", () => {
    // tokens.css ships a global reduced-motion override: `*, *::before, *::after`
    // gets animation-duration: 0.01ms !important. The minifier may strip the
    // leading zero. Scan all built CSS files for that specific rule.
    const dir = path.join(DIST, "_astro");
    const css = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".css"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .find((body) =>
        /prefers-reduced-motion:\s*reduce[^{]*\{[^@]*\*\s*,\s*\*[^{]*\{[^}]*animation-duration:\s*0?\.01ms\s*!important/.test(
          body,
        ),
      );
    expect(
      css,
      "no built CSS contained the universal reduced-motion animation-duration:.01ms !important rule",
    ).toBeTruthy();
  });
});
