import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import katex from "katex";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { katexMacros } from "../src/lib/katex-macros";

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIRS = [
  path.join(ROOT, "src", "content", "techniques"),
  path.join(ROOT, "src", "content", "models"),
];

function walkMdx(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMdx(p));
    else if (e.name.endsWith(".mdx") || e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// Strip frontmatter, MDX imports/exports, and JSX tags so the remaining body is
// parse-able by plain remark. We only need to extract math nodes; the surrounding
// MDX features are irrelevant for math compilation.
function stripMdxScaffolding(raw: string): string {
  let body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  body = body
    .split("\n")
    .filter((line) => !/^\s*(import|export)\s/.test(line))
    .join("\n");
  // Strip self-closing or paired JSX-component lines (best-effort; ok if
  // imperfect since math lives outside JSX in this codebase).
  body = body.replace(/<[A-Z][^>]*\/>/g, "");
  body = body.replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, "");
  return body;
}

type MathNode = { src: string; display: boolean; file: string; line?: number };

function extractMath(file: string): MathNode[] {
  const raw = fs.readFileSync(file, "utf8");
  const body = stripMdxScaffolding(raw);
  const tree = unified().use(remarkParse).use(remarkMath).parse(body);
  const found: MathNode[] = [];
  const SKIP_TYPES = new Set(["code", "inlineCode"]);
  visit(tree, (node: any) => {
    if (SKIP_TYPES.has(node.type)) return "skip" as any;
    if (node.type === "math") {
      found.push({
        src: (node as any).value,
        display: true,
        file,
        line: node.position?.start?.line,
      });
    } else if (node.type === "inlineMath") {
      found.push({
        src: (node as any).value,
        display: false,
        file,
        line: node.position?.start?.line,
      });
    }
  });
  return found;
}

const ALL_FILES = CONTENT_DIRS.flatMap(walkMdx);

describe("math rendering — KaTeX compiles every math expression in content", () => {
  it("finds content to test (sanity)", () => {
    expect(ALL_FILES.length).toBeGreaterThan(0);
  });

  for (const file of ALL_FILES) {
    const rel = path.relative(ROOT, file);
    it(`${rel} has no KaTeX parse errors`, () => {
      const math = extractMath(file);
      const failures: string[] = [];
      for (const m of math) {
        try {
          katex.renderToString(m.src, {
            displayMode: m.display,
            throwOnError: true,
            strict: false,
            macros: { ...katexMacros },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const where = m.line ? `L${m.line}` : "";
          const kind = m.display ? "display" : "inline";
          failures.push(
            `  [${kind} ${where}] ${msg}\n    source: ${m.src.slice(0, 200)}`,
          );
        }
      }
      if (failures.length) {
        throw new Error(
          `${failures.length} KaTeX error(s) in ${rel}:\n${failures.join("\n")}`,
        );
      }
    });
  }
});

describe("math rendering — full pipeline produces no katex-error markers", () => {
  for (const file of ALL_FILES) {
    const rel = path.relative(ROOT, file);
    it(`${rel} produces no katex-error spans through the remark+rehype pipeline`, async () => {
      const raw = fs.readFileSync(file, "utf8");
      const body = stripMdxScaffolding(raw);
      const html = String(
        await unified()
          .use(remarkParse)
          .use(remarkMath)
          .use(remarkRehype)
          .use(rehypeKatex, {
            strict: false,
            throwOnError: false,
            macros: { ...katexMacros },
          })
          .use(rehypeStringify)
          .process(body),
      );
      // rehype-katex emits a span with class="katex-error" when math fails to
      // parse. This is exactly the marker that appears on the published site
      // when something is wrong — so failing here mirrors what users would see.
      expect(
        html.includes("katex-error"),
        `${rel} renders KaTeX error markers in built HTML`,
      ).toBe(false);
    });
  }
});

describe("math rendering — display blocks use canonical block form", () => {
  // remark-math v6 treats single-line `$$content$$` as INLINE math (text-math).
  // Authors intending a centered display equation must put the opening and
  // closing `$$` each on their own line. We enforce that here so a future
  // author writing `$$x = y$$` on one line gets a clear failure rather than a
  // silently mis-rendered (inline) equation on the published site.
  const SINGLE_LINE_DISPLAY = /^[ \t]*\$\$(?!\s*$)[^\n]*\$\$[ \t]*$/m;

  for (const file of ALL_FILES) {
    const rel = path.relative(ROOT, file);
    it(`${rel} uses $$ on its own line for display math`, () => {
      const raw = fs.readFileSync(file, "utf8");
      // Strip fenced code blocks so we don't false-positive on math-looking
      // code samples.
      const stripped = raw.replace(/```[\s\S]*?```/g, "");
      const offenders: string[] = [];
      let line = 0;
      for (const text of stripped.split("\n")) {
        line += 1;
        if (SINGLE_LINE_DISPLAY.test(text)) {
          offenders.push(`  L${line}: ${text.slice(0, 120)}`);
        }
      }
      if (offenders.length) {
        throw new Error(
          `${rel} has ${offenders.length} single-line $$...$$ block(s) — ` +
            `these render as inline (text) math, not display math. ` +
            `Put the opening and closing $$ each on their own line.\n` +
            offenders.join("\n"),
        );
      }
    });
  }
});
