import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import solid from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { katexMacros } from "./src/lib/katex-macros.ts";

const SITE = process.env.SITE_URL ?? "https://lizeman.github.io";
const BASE = process.env.SITE_BASE ?? "/llm-arch-kb";
const SRC = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Walk content directories and build URL → last_verified lookup so the
 * sitemap serializer can populate <lastmod> for technique and model URLs.
 * We do a plain regex-extract on the frontmatter rather than parsing YAML,
 * since we only need a single string field per file.
 */
function buildLastmodIndex() {
  const TECH_DIR = path.join(SRC, "content", "techniques");
  const MODELS_DIR = path.join(SRC, "content", "models");
  const index = new Map();

  function readFrontmatterField(file, field) {
    try {
      const text = fs.readFileSync(file, "utf8");
      const fmMatch = text.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!fmMatch) return null;
      const re = new RegExp(`^${field}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "m");
      const m = fmMatch[1].match(re);
      return m ? m[1].trim() : null;
    } catch {
      return null;
    }
  }

  function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(p));
      else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) out.push(p);
    }
    return out;
  }

  for (const file of walk(TECH_DIR)) {
    const category = readFrontmatterField(file, "category");
    const lastVerified = readFrontmatterField(file, "last_verified");
    if (!category || !lastVerified) continue;
    const slugLast = path.basename(file).replace(/\.mdx?$/, "");
    const url = `${SITE}${BASE}/${category}/${slugLast}/`;
    index.set(url, lastVerified);
  }
  for (const file of walk(MODELS_DIR)) {
    const lastVerified = readFrontmatterField(file, "last_verified");
    const slugLast = path.basename(file).replace(/\.mdx?$/, "");
    const url = `${SITE}${BASE}/models/${slugLast}/`;
    // Models may not carry last_verified (schema doesn't require it); skip if absent.
    if (!lastVerified) continue;
    index.set(url, lastVerified);
  }
  return index;
}

const LASTMOD_INDEX = buildLastmodIndex();

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "always",
  output: "static",
  integrations: [
    mdx(),
    solid(),
    sitemap({
      serialize(item) {
        const lastmod = LASTMOD_INDEX.get(item.url);
        if (lastmod) {
          // Normalize bare date strings (YYYY-MM-DD) to W3C datetime by appending TZ.
          const iso = /^\d{4}-\d{2}-\d{2}$/.test(lastmod) ? `${lastmod}T00:00:00Z` : lastmod;
          return { ...item, lastmod: iso };
        }
        return item;
      },
    }),
    pagefind(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false, macros: katexMacros }]],
    shikiConfig: { theme: "github-light", wrap: true },
  },
  vite: {
    resolve: {
      alias: {
        "~": SRC,
      },
    },
  },
});
