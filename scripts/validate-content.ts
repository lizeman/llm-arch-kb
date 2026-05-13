#!/usr/bin/env tsx
/**
 * Citation policy enforcer (plan §9, §6.3).
 *
 * Hard rules:
 *   - every adopted_by.model must resolve to /models/<slug>
 *   - every adopted_by entry has a non-empty source_url
 *   - every model with disclosure_level: undisclosed has ALL architecture.* fields = null
 *   - figure_component refers to a real file in src/components/figures/
 *   - arxiv_id is consistent with paper_url when both reference arXiv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TECH_DIR = path.join(ROOT, "src", "content", "techniques");
const MODELS_DIR = path.join(ROOT, "src", "content", "models");
const FIGURES_DIR = path.join(ROOT, "src", "components", "figures");

type Issue = { file: string; message: string };
const issues: Issue[] = [];
const warnings: string[] = [];

export type StructureIssue = { message: string };

export function checkEntryStructure(body: string, paperUrl: string): StructureIssue[] {
  const out: StructureIssue[] = [];
  const required = ["§ 1 · Premise", "§ 2 · Derivation", "§ 3 ·", "§ 4 · Empirical evidence"];
  for (const s of required) {
    if (!body.includes(s)) out.push({ message: `missing section eyebrow "${s}"` });
  }

  const derivStart = body.indexOf("§ 2 · Derivation");
  const derivEnd = body.indexOf("§ 3 ·", derivStart + 1);
  if (derivStart >= 0 && derivEnd > derivStart) {
    const deriv = body.slice(derivStart, derivEnd);
    const eqs = (deriv.match(/\$\$[\s\S]+?\$\$/g) ?? []).length;
    if (eqs < 3) out.push({ message: `§ 2 Derivation has ${eqs} display equation(s); need ≥3` });
  }

  const empStart = body.indexOf("§ 4 · Empirical evidence");
  if (empStart >= 0) {
    const emp = body.slice(empStart);
    const links = [...emp.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]!);
    const self = paperUrl.replace(/^https?:\/\//, "");
    const nonSelf = links.filter((u) => self === "" || !u.includes(self));
    if (nonSelf.length === 0) {
      out.push({ message: "§ 4 Empirical evidence has no non-original citation link" });
    }
  }

  const bodyLines = body.split("\n").length;
  if (bodyLines < 170 || bodyLines > 600) {
    out.push({ message: `body line count ${bodyLines} outside expected range 170..600` });
  }

  return out;
}

function readFrontmatter(filePath: string): Record<string, unknown> | null {
  const text = fs.readFileSync(filePath, "utf8");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  return parseYaml(match[1]!);
}

function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue; }
    const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    if (indent > 0) { i++; continue; }
    const kvMatch = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kvMatch) { i++; continue; }
    const key = kvMatch[1]!;
    const raw = kvMatch[2]!.trim();
    if (raw === "" || raw === "|" || raw === ">") {
      const items: unknown[] = [];
      let nested = "";
      i++;
      while (i < lines.length && (lines[i]!.startsWith("  ") || lines[i]!.trim() === "")) {
        const childLine = lines[i]!;
        if (childLine.trim().startsWith("- ")) {
          const itemContent = childLine.replace(/^\s*-\s*/, "");
          if (itemContent.includes(":")) {
            const obj: Record<string, unknown> = {};
            const firstKv = itemContent.match(/^([\w-]+):\s*(.*)$/);
            if (firstKv) obj[firstKv[1]!] = stripQuotes(firstKv[2]!);
            i++;
            while (i < lines.length && lines[i]!.startsWith("    ")) {
              const sub = lines[i]!.match(/^\s+([\w-]+):\s*(.*)$/);
              if (sub) obj[sub[1]!] = stripQuotes(sub[2]!);
              i++;
            }
            items.push(obj);
            continue;
          } else {
            items.push(stripQuotes(itemContent));
          }
        } else {
          nested += childLine + "\n";
        }
        i++;
      }
      result[key] = items.length > 0 ? items : nested.trim();
      continue;
    }
    result[key] = parseScalar(raw);
    i++;
  }
  return result;
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseScalar(raw: string): unknown {
  const v = stripQuotes(raw);
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "~") return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d*\.\d+$/.test(v)) return parseFloat(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    return v.slice(1, -1).split(",").map((x) => stripQuotes(x.trim())).filter(Boolean);
  }
  return v;
}

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

function loadModels(): { slug: string; data: Record<string, unknown>; file: string }[] {
  return walk(MODELS_DIR).map((file) => {
    const slug = path.basename(file).replace(/\.mdx?$/, "");
    const data = readFrontmatter(file);
    if (!data) {
      issues.push({ file: rel(file), message: "missing frontmatter" });
      return { slug, data: {}, file };
    }
    return { slug, data, file };
  });
}

function loadTechniques(): { slug: string; data: Record<string, unknown>; file: string }[] {
  return walk(TECH_DIR).map((file) => {
    const slug = path.basename(file).replace(/\.mdx?$/, "");
    const data = readFrontmatter(file);
    if (!data) {
      issues.push({ file: rel(file), message: "missing frontmatter" });
      return { slug, data: {}, file };
    }
    return { slug, data, file };
  });
}

function listFigureComponents(): Set<string> {
  if (!fs.existsSync(FIGURES_DIR)) return new Set();
  return new Set(
    fs.readdirSync(FIGURES_DIR)
      .filter((f) => /\.(tsx|jsx|ts)$/.test(f))
      .map((f) => f.replace(/\.(tsx|jsx|ts)$/, "")),
  );
}

function validate() {
  const models = loadModels();
  const techniques = loadTechniques();
  const modelSlugs = new Set(models.map((m) => m.slug));
  const techniqueSlugs = new Set(techniques.map((t) => t.slug));
  const figureComponents = listFigureComponents();
  const arxivVersionRe = /^\d{4}\.\d{4,5}v\d+$/;

  // 1. Closed-model policy: undisclosed → null architecture fields
  for (const m of models) {
    const level = m.data.disclosure_level;
    if (level === "undisclosed") {
      const arch = (m.data.architecture ?? {}) as Record<string, unknown>;
      const archFields = ["positional", "normalization_placement", "normalization_type", "qk_norm", "activation", "attention", "moe"];
      for (const f of archFields) {
        if (arch[f] !== null && arch[f] !== undefined && arch[f] !== "null") {
          issues.push({
            file: rel(m.file),
            message: `disclosure_level=undisclosed but architecture.${f} is set (must be null per §9)`,
          });
        }
      }
    }
    if (!Array.isArray(m.data.source_urls) || m.data.source_urls.length === 0) {
      issues.push({ file: rel(m.file), message: "models must declare source_urls[] (§9)" });
    }

    const parent = m.data.parent_model;
    if (parent && typeof parent === "string" && parent.trim() !== "") {
      if (!modelSlugs.has(parent)) {
        issues.push({
          file: rel(m.file),
          message: `parent_model "${parent}" does not resolve to a model at src/content/models/${parent}.mdx`,
        });
      }
    }
  }

  // 2. adopted_by → must resolve + must have source_url
  for (const t of techniques) {
    const adopted = (t.data.adopted_by ?? []) as Array<Record<string, unknown>>;
    for (const a of adopted) {
      const ref = String(a.model ?? "");
      if (!ref) {
        issues.push({ file: rel(t.file), message: "adopted_by entry missing 'model'" });
        continue;
      }
      if (!modelSlugs.has(ref)) {
        issues.push({
          file: rel(t.file),
          message: `adopted_by.model "${ref}" does not resolve to a model at src/content/models/${ref}.mdx`,
        });
      }
      if (!a.source_url || String(a.source_url).trim() === "") {
        issues.push({
          file: rel(t.file),
          message: `adopted_by entry for "${ref}" is missing source_url (§9)`,
        });
      }
    }

    const fig = t.data.figure_component;
    if (fig && typeof fig === "string" && !figureComponents.has(fig)) {
      issues.push({
        file: rel(t.file),
        message: `figure_component "${fig}" not found in src/components/figures/`,
      });
    }

    const arxiv = String(t.data.arxiv_id ?? "");
    const paperUrl = String(t.data.paper_url ?? "");
    if (arxiv && paperUrl.includes("arxiv.org") && !paperUrl.includes(arxiv)) {
      issues.push({
        file: rel(t.file),
        message: `arxiv_id "${arxiv}" does not match paper_url "${paperUrl}"`,
      });
    }
    if (arxiv && !arxivVersionRe.test(arxiv)) {
      warnings.push(`[warn] ${rel(t.file)}: arxiv_id "${arxiv}" lacks version suffix (vN); recommend pinning`);
    }

    const prereqs = (t.data.prerequisites ?? []) as unknown[];
    if (Array.isArray(prereqs)) {
      for (const p of prereqs) {
        const ref = String(p ?? "");
        if (!ref) continue;
        if (!techniqueSlugs.has(ref)) {
          issues.push({
            file: rel(t.file),
            message: `prerequisites entry "${ref}" does not resolve to a technique at src/content/techniques/<category>/${ref}.mdx`,
          });
        }
      }
    }
  }

  // 3. Structural depth (researcher-grade entry template)
  for (const t of techniques) {
    const text = fs.readFileSync(t.file, "utf8");
    const bodyMatch = text.match(/^---[\s\S]*?\n---\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1]! : "";
    const paperUrl = String(t.data.paper_url ?? "");
    for (const s of checkEntryStructure(body, paperUrl)) {
      issues.push({ file: rel(t.file), message: s.message });
    }
  }

  // 4. Reporting
  for (const w of warnings) {
    console.warn(w);
  }

  if (issues.length === 0) {
    console.log(`[validate-content] ok — ${techniques.length} technique(s), ${models.length} model(s)`);
    process.exit(0);
  }

  console.error(`[validate-content] ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.error(`  ${issue.file}: ${issue.message}`);
  }
  process.exit(1);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  validate();
}
