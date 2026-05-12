#!/usr/bin/env tsx
/**
 * Build-time Open Graph card generator.
 *
 * For every technique and model entry, render a 1200x630 PNG with
 *   - a small-caps eyebrow line (KB title + category or organization)
 *   - the entry title (abbreviation + full name OR model name) in a serif face
 *   - a thin accent border in the brand --accent color (#1a4f7a)
 *   - a plain white background, no gradients (calm-editorial theme)
 *
 * Output: public/og/<flat-slug>.png. The Astro build picks these up as
 * static assets, so layouts only need to reference /og/<slug>.png in their
 * og:image meta tags.
 *
 * Network: fetches one woff/ttf from Google Fonts on first run; cached to
 * scripts/.font-cache/. Skips gracefully if the fetch fails so a CI build
 * without internet still completes (just without OG images).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TECH_DIR = path.join(ROOT, "src", "content", "techniques");
const MODELS_DIR = path.join(ROOT, "src", "content", "models");
const OUT_DIR = path.join(ROOT, "public", "og");
const FONT_CACHE = path.join(__dirname, ".font-cache");

const SERIF_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/source-serif-4@latest/latin-400-normal.ttf";
const SERIF_BOLD_FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/source-serif-4@latest/latin-600-normal.ttf";

interface Frontmatter {
  [k: string]: string | undefined;
}

/** Walk a directory recursively and return all .mdx/.md files. */
function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Lightweight frontmatter scalar reader. Doesn't try to handle multi-line. */
function readFrontmatter(file: string): Frontmatter {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out: Frontmatter = {};
  for (const line of m[1]!.split("\n")) {
    const kv = line.match(/^([\w-]+):\s*["']?([^"'\n]+?)["']?\s*$/);
    if (kv) out[kv[1]!] = kv[2]!.trim();
  }
  return out;
}

async function loadFont(url: string, cacheName: string): Promise<ArrayBuffer> {
  fs.mkdirSync(FONT_CACHE, { recursive: true });
  const cachePath = path.join(FONT_CACHE, cacheName);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath).buffer as ArrayBuffer;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url} (${res.status})`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(cachePath, Buffer.from(buf));
  return buf;
}

interface OgInput {
  /** Card top-line: small-caps lab/category. */
  eyebrow: string;
  /** Main title — usually the abbreviation. */
  title: string;
  /** Optional subtitle — usually the full name. */
  subtitle?: string;
  /** Bottom-right tag — e.g. "2024 · DeepSeek". */
  meta?: string;
  /** Output filename without extension. */
  outName: string;
}

function buildCardTree(input: OgInput) {
  // Plain JSX-like vDOM the way satori expects it.
  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        padding: "72px 88px",
        // Accent border, kept thin per the "calm editorial" rule.
        border: "4px solid #1a4f7a",
        boxSizing: "border-box",
        fontFamily: "Source Serif",
        color: "#1a1a1a",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: "20px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#1a4f7a",
              fontWeight: 600,
              marginBottom: "8px",
            },
            children: "LLM Architecture KB",
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "22px",
              color: "#666666",
              marginBottom: "44px",
              fontStyle: "italic",
            },
            children: input.eyebrow,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "96px",
              fontWeight: 600,
              lineHeight: 1.05,
              marginBottom: "24px",
              display: "flex",
            },
            children: input.title,
          },
        },
        input.subtitle
          ? {
              type: "div",
              props: {
                style: {
                  fontSize: "36px",
                  color: "#444444",
                  lineHeight: 1.25,
                  display: "flex",
                  flexWrap: "wrap",
                },
                children: input.subtitle,
              },
            }
          : null,
        {
          type: "div",
          props: {
            style: { flex: "1", display: "flex" },
            children: "",
          },
        },
        input.meta
          ? {
              type: "div",
              props: {
                style: {
                  fontSize: "22px",
                  color: "#888888",
                  letterSpacing: "0.05em",
                  display: "flex",
                  justifyContent: "flex-end",
                },
                children: input.meta,
              },
            }
          : null,
      ].filter(Boolean),
    },
  };
}

async function renderCard(
  input: OgInput,
  fonts: Array<{ name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }>,
): Promise<void> {
  const svg = await satori(buildCardTree(input) as never, {
    width: 1200,
    height: 630,
    fonts,
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${input.outName}.png`), png);
}

const CATEGORY_LABELS: Record<string, string> = {
  positional: "Positional Encoding",
  normalization: "Normalization",
  residual: "Residual Connections",
  "ffn-moe": "FFN & MoE",
  attention: "Attention Mechanisms",
  "long-context": "Long Context",
};

async function main(): Promise<void> {
  let fonts: Array<{ name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }>;
  try {
    const [regular, bold] = await Promise.all([
      loadFont(SERIF_FONT_URL, "source-serif-4-400.ttf"),
      loadFont(SERIF_BOLD_FONT_URL, "source-serif-4-600.ttf"),
    ]);
    fonts = [
      { name: "Source Serif", data: regular, weight: 400, style: "normal" },
      { name: "Source Serif", data: bold, weight: 600, style: "normal" },
    ];
  } catch (e) {
    console.warn(`[generate-og] font load failed; skipping OG image generation: ${(e as Error).message}`);
    return;
  }

  const techniques = walk(TECH_DIR);
  const models = walk(MODELS_DIR);
  let count = 0;

  for (const file of techniques) {
    const fm = readFrontmatter(file);
    if (!fm.title || !fm.abbreviation || !fm.category) continue;
    // The on-disk slug is "<category>/<basename>"; we flatten to "<category>__<basename>" for the file system.
    const baseName = path.basename(file).replace(/\.mdx?$/, "");
    const outName = `${fm.category}__${baseName}`;
    const eyebrow = CATEGORY_LABELS[fm.category] ?? fm.category;
    const meta = fm.year ? `${fm.year}` : "";
    try {
      await renderCard(
        {
          eyebrow,
          title: fm.abbreviation,
          subtitle: fm.title,
          meta,
          outName,
        },
        fonts,
      );
      count++;
    } catch (e) {
      console.warn(`[generate-og] failed ${outName}: ${(e as Error).message}`);
    }
  }

  for (const file of models) {
    const fm = readFrontmatter(file);
    if (!fm.name) continue;
    const baseName = path.basename(file).replace(/\.mdx?$/, "");
    const outName = `models__${baseName}`;
    const year = fm.release_date ? fm.release_date.slice(0, 4) : "";
    const meta = [year, fm.organization].filter(Boolean).join(" · ");
    try {
      await renderCard(
        {
          eyebrow: "Production Model",
          title: fm.name,
          subtitle: fm.organization,
          meta,
          outName,
        },
        fonts,
      );
      count++;
    } catch (e) {
      console.warn(`[generate-og] failed ${outName}: ${(e as Error).message}`);
    }
  }

  console.log(`[generate-og] wrote ${count} OG card(s) to public/og/`);
}

main().catch((e) => {
  console.error(`[generate-og] fatal: ${(e as Error).message}`);
  // Don't fail the build — OG images are nice-to-have.
  process.exit(0);
});
