#!/usr/bin/env tsx
/**
 * Link checker.
 *
 * Walks every MDX file under src/content/{techniques,models}, collects every URL
 * field (paper_url, model_card_url, adopted_by[].source_url, source_urls[]) and
 * probes each with a HEAD request. Report broken/timeout URLs but never exit
 * non-zero — link rot is a warning, not a build blocker.
 *
 * Run: pnpm check:links
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TECH_DIR = path.join(ROOT, "src", "content", "techniques");
const MODELS_DIR = path.join(ROOT, "src", "content", "models");

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 8;
const USER_AGENT = "llm-arch-kd-link-check/1.0";
const OK_STATUSES = new Set([200, 301, 302, 303, 307, 308]);

type Target = { url: string; file: string };
type Result =
  | { kind: "ok"; status: number; target: Target }
  | { kind: "broken"; status: number; target: Target }
  | { kind: "timeout"; target: Target }
  | { kind: "error"; target: Target; message: string };

function walk(dir: string, exts = [".mdx", ".md"]): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

function rel(p: string): string {
  return path.relative(ROOT, p);
}

function extractFrontmatter(text: string): string | null {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  return m ? m[1]! : null;
}

/**
 * Pull every well-formed http(s) URL from a string. We deliberately match
 * loosely — false positives are fine, they'll just fail the HEAD probe.
 */
function extractUrls(s: string): string[] {
  const urls = new Set<string>();
  const re = /https?:\/\/[^\s"'<>\]]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    // Trim trailing punctuation that's likely YAML/MD noise.
    const cleaned = m[0].replace(/[,)\].]+$/g, "");
    urls.add(cleaned);
  }
  return [...urls];
}

function collectTargets(): Target[] {
  const seen = new Map<string, Target>(); // url -> first file
  const files = [...walk(TECH_DIR), ...walk(MODELS_DIR)];
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const fm = extractFrontmatter(text);
    if (!fm) continue;
    for (const u of extractUrls(fm)) {
      if (!seen.has(u)) seen.set(u, { url: u, file: rel(f) });
    }
  }
  return [...seen.values()];
}

async function probe(target: Target): Promise<Result> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // HEAD first; many servers (e.g. arxiv, OpenReview, HF) handle HEAD fine.
    let res: Response;
    try {
      res = await fetch(target.url, {
        method: "HEAD",
        signal: ctrl.signal,
        redirect: "manual",
        headers: { "user-agent": USER_AGENT },
      });
    } catch (e) {
      // Some hosts block HEAD; retry with GET (range 0-0) before giving up.
      res = await fetch(target.url, {
        method: "GET",
        signal: ctrl.signal,
        redirect: "manual",
        headers: { "user-agent": USER_AGENT, range: "bytes=0-0" },
      });
    }
    if (OK_STATUSES.has(res.status)) {
      return { kind: "ok", status: res.status, target };
    }
    // Some sites 405 on HEAD even after retry — try one more GET if so.
    if (res.status === 405) {
      const getRes = await fetch(target.url, {
        method: "GET",
        signal: ctrl.signal,
        redirect: "manual",
        headers: { "user-agent": USER_AGENT, range: "bytes=0-0" },
      });
      if (OK_STATUSES.has(getRes.status)) {
        return { kind: "ok", status: getRes.status, target };
      }
      return { kind: "broken", status: getRes.status, target };
    }
    return { kind: "broken", status: res.status, target };
  } catch (e) {
    const err = e as Error;
    if (err.name === "AbortError" || /aborted|timeout/i.test(err.message ?? "")) {
      return { kind: "timeout", target };
    }
    return { kind: "error", target, message: err.message ?? String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T, R>(items: T[], n: number, worker: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function take() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await worker(items[idx]!);
    }
  }
  const tasks = Array.from({ length: Math.min(n, items.length) }, () => take());
  await Promise.all(tasks);
  return out;
}

async function main() {
  const targets = collectTargets();
  if (targets.length === 0) {
    console.log("[check-links] no URLs found in content frontmatter");
    process.exit(0);
  }

  console.log(`[check-links] probing ${targets.length} unique URL(s) with concurrency ${CONCURRENCY}`);
  const results = await runPool(targets, CONCURRENCY, probe);

  const ok = results.filter((r) => r.kind === "ok");
  const broken = results.filter((r) => r.kind === "broken" || r.kind === "error");
  const timeouts = results.filter((r) => r.kind === "timeout");

  console.log("");
  console.log("---------- link-check summary ----------");
  console.log(`  checked: ${results.length}`);
  console.log(`  ok:      ${ok.length}`);
  console.log(`  broken:  ${broken.length}`);
  console.log(`  timeout: ${timeouts.length}`);
  console.log("----------------------------------------");

  if (broken.length > 0) {
    console.log("");
    console.log("WARNING — broken URLs (link rot — not a build failure):");
    for (const r of broken) {
      const detail = r.kind === "broken" ? `HTTP ${r.status}` : `error: ${r.message}`;
      console.log(`  [${detail}] ${r.target.url}`);
      console.log(`        first seen in: ${r.target.file}`);
    }
  }

  if (timeouts.length > 0) {
    console.log("");
    console.log("NOTE — timeouts (network jitter, not necessarily broken):");
    for (const r of timeouts) {
      console.log(`  [TIMEOUT] ${r.target.url}`);
      console.log(`           first seen in: ${r.target.file}`);
    }
  }

  // Always exit 0 — link rot must not block CI/CD.
  process.exit(0);
}

main().catch((e) => {
  console.error("[check-links] unexpected error:", e);
  // Still exit 0; the script is informational.
  process.exit(0);
});
