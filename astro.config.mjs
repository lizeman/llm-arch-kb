import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import solid from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { fileURLToPath } from "node:url";
import { katexMacros } from "./src/lib/katex-macros.ts";

const SITE = process.env.SITE_URL ?? "https://lizeman.github.io";
const BASE = process.env.SITE_BASE ?? "/llm-arch-kb";
const SRC = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "always",
  output: "static",
  integrations: [mdx(), solid(), sitemap(), pagefind()],
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
