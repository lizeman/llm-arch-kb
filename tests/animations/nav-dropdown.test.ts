/**
 * Browse mega-dropdown animation contract.
 *
 * Loads the built homepage with JSDOM and manually executes the Nav.astro
 * inline `<script type=module>` (JSDOM does not run ES module scripts, so we
 * pull the script body out of the HTML and eval it in the window scope).
 *
 * Asserts the behavior that drives the opacity+translateY transition:
 *
 *  - Initial: panel has [hidden], no .is-open class, trigger aria-expanded="false".
 *  - On click: panel becomes non-hidden, gains .is-open after a double-rAF cycle,
 *    trigger aria-expanded="true".
 *  - On second click: .is-open is removed and aria-expanded flips back.
 *  - Escape key closes the panel.
 *  - astro:after-swap resets it across navigations.
 *  - With prefers-reduced-motion: panel.hidden = true is set synchronously on
 *    close (no 200ms transitionend grace).
 *  - The built CSS still targets the rotated caret via aria-expanded=true.
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(__dirname, "..", "..");
const DIST = path.join(ROOT, "dist");
const HOME = path.join(DIST, "index.html");
const HAS_DIST = fs.existsSync(HOME);

function extractNavScript(html: string): string {
  // Astro emits the Nav.astro client script as <script type="module">...</script>
  // somewhere in <head> or <body>. We pick the one that references the nav DOM.
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes("site-nav__panel") && m[1].includes("browse-trigger")) {
      return m[1];
    }
  }
  throw new Error("Nav inline script not found in dist/index.html");
}

function buildDom(reducedMotion: boolean): { dom: JSDOM; runScript: (body: string) => void } {
  const html = fs.readFileSync(HOME, "utf8");
  const dom = new JSDOM(html, {
    url: "https://lizeman.github.io/llm-arch-kb/",
    pretendToBeVisual: true,
    runScripts: "dangerously",
  });
  const win = dom.window as unknown as Window & typeof globalThis;
  Object.defineProperty(win, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: reducedMotion && /prefers-reduced-motion/.test(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return {
    dom,
    runScript: (body: string) => {
      // JSDOM ignores <script type="module"> entirely. Inject the script body
      // as a classic <script> element after creation so the runScripts engine
      // executes it (synchronously, since it has no src).
      const script = win.document.createElement("script");
      script.textContent = body;
      win.document.body.appendChild(script);
    },
  };
}

function nextFrames(win: Window & typeof globalThis): Promise<void> {
  return new Promise((resolve) =>
    win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve())),
  );
}

describe.skipIf(!HAS_DIST)("Animation: Browse mega-dropdown", () => {
  let dom: JSDOM;
  let doc: Document;
  let win: Window & typeof globalThis;

  beforeAll(() => {
    const html = fs.readFileSync(HOME, "utf8");
    const navScript = extractNavScript(html);
    const built = buildDom(false);
    dom = built.dom;
    doc = dom.window.document;
    win = dom.window as unknown as Window & typeof globalThis;
    built.runScript(navScript);
  });

  it("starts closed: panel hidden, trigger aria-expanded=false", () => {
    const trigger = doc.querySelector<HTMLButtonElement>(".site-nav__browse-trigger")!;
    const panel = doc.querySelector<HTMLElement>(".site-nav__panel")!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hasAttribute("hidden")).toBe(true);
    expect(panel.classList.contains("is-open")).toBe(false);
  });

  it("click opens the panel: removes hidden, adds .is-open after rAF, flips aria-expanded", async () => {
    const trigger = doc.querySelector<HTMLButtonElement>(".site-nav__browse-trigger")!;
    const panel = doc.querySelector<HTMLElement>(".site-nav__panel")!;
    trigger.click();
    expect(panel.hasAttribute("hidden")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await nextFrames(win);
    expect(panel.classList.contains("is-open")).toBe(true);
  });

  it("click again closes: removes .is-open and flips aria-expanded", () => {
    const trigger = doc.querySelector<HTMLButtonElement>(".site-nav__browse-trigger")!;
    const panel = doc.querySelector<HTMLElement>(".site-nav__panel")!;
    trigger.click();
    expect(panel.classList.contains("is-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape closes an open panel", async () => {
    const trigger = doc.querySelector<HTMLButtonElement>(".site-nav__browse-trigger")!;
    const panel = doc.querySelector<HTMLElement>(".site-nav__panel")!;
    trigger.click();
    await nextFrames(win);
    expect(panel.classList.contains("is-open")).toBe(true);

    doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(panel.classList.contains("is-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("astro:after-swap closes any open panel", async () => {
    const trigger = doc.querySelector<HTMLButtonElement>(".site-nav__browse-trigger")!;
    const panel = doc.querySelector<HTMLElement>(".site-nav__panel")!;
    trigger.click();
    await nextFrames(win);
    expect(panel.classList.contains("is-open")).toBe(true);

    doc.dispatchEvent(new dom.window.Event("astro:after-swap", { bubbles: true }));
    expect(panel.classList.contains("is-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});

describe.skipIf(!HAS_DIST)("Animation: Browse dropdown with prefers-reduced-motion", () => {
  it("close path immediately hides the panel (no transitionend grace)", async () => {
    const html = fs.readFileSync(HOME, "utf8");
    const navScript = extractNavScript(html);
    const { dom, runScript } = buildDom(true);
    const doc = dom.window.document;
    const win = dom.window as unknown as Window & typeof globalThis;
    runScript(navScript);

    const trigger = doc.querySelector<HTMLButtonElement>(".site-nav__browse-trigger")!;
    const panel = doc.querySelector<HTMLElement>(".site-nav__panel")!;
    trigger.click();
    await nextFrames(win);
    expect(panel.classList.contains("is-open")).toBe(true);
    expect(panel.hasAttribute("hidden")).toBe(false);

    trigger.click();
    // With reduced motion the script sets panel.hidden synchronously rather than
    // waiting for the 200ms transition; without this branch the panel stays
    // visible to assistive tech until the timer fires.
    expect(panel.hasAttribute("hidden")).toBe(true);
  });
});

describe.skipIf(!HAS_DIST)("Animation: Browse caret rotation CSS contract", () => {
  it("built CSS rotates the caret 180° when aria-expanded=true", () => {
    const cssDir = path.join(DIST, "_astro");
    const files = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));
    const match = files
      .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
      .find((body) => body.includes("site-nav__caret"));
    expect(match, "no built CSS contains site-nav__caret rule").toBeTruthy();
    // Astro adds data-astro-cid-* scoping attributes to the selectors, so we
    // don't pin the exact selector — just that an aria-expanded=true variant
    // sets transform: rotate(180deg) on the caret.
    expect(match!).toMatch(
      /aria-expanded=["']?true["']?\][^{]*\.site-nav__caret[^{]*\{[^}]*rotate\(180deg\)/,
    );
  });
});
