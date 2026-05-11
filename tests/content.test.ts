import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const TECH_DIR = path.join(ROOT, "src", "content", "techniques");
const MODELS_DIR = path.join(ROOT, "src", "content", "models");

function walk(dir: string, exts = [".mdx", ".md"]): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

describe("content presence", () => {
  it("at least one technique entry exists (Phase 1 reference)", () => {
    const tech = walk(TECH_DIR);
    expect(tech.length).toBeGreaterThan(0);
  });

  it("at least one model spec sheet exists", () => {
    const m = walk(MODELS_DIR);
    expect(m.length).toBeGreaterThan(0);
  });
});

describe("v1-ship roadmap (plan §12.1)", () => {
  // Marker test — passes only when v1 scope is reached.
  // Ralph-loop reads this signal as part of completion gates.
  const V1_ENTRIES = [
    "positional/rope",
    "positional/yarn",
    "normalization/rmsnorm",
    "normalization/norm-placement",
    "normalization/qk-norm",
    "ffn-moe/swiglu",
    "ffn-moe/deepseek-moe",
    "attention/gqa",
    "attention/mla",
    "attention/sliding-window",
    "long-context/streaming-llm",
    "residual/residual-overview",
  ];
  const V1_MODELS = ["llama-3-1-70b", "deepseek-v3", "gemma-3-27b"];

  it.skipIf(process.env.RALPH_V1_GATE !== "1")("all 12 v1-ship entries present", () => {
    for (const slug of V1_ENTRIES) {
      const p = path.join(TECH_DIR, `${slug}.mdx`);
      expect(fs.existsSync(p), `missing ${p}`).toBe(true);
    }
  });

  it.skipIf(process.env.RALPH_V1_GATE !== "1")("all 3 v1-ship model spec sheets present", () => {
    for (const slug of V1_MODELS) {
      const p = path.join(MODELS_DIR, `${slug}.mdx`);
      expect(fs.existsSync(p), `missing ${p}`).toBe(true);
    }
  });
});
