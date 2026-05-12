/**
 * Pure data shaping for the homepage model-timeline chart.
 *
 * Input is the raw `models` collection. Output is a flat list of
 * chart-ready points plus an organization → color palette.
 *
 * Filters:
 *  - open_weights only (user-requested scope: open models)
 *  - drop rows whose parameters_total can't be parsed
 *  - drop rows whose release_date doesn't parse
 */

export type Architecture = {
  positional: string | null;
  normalization_placement: string | null;
  normalization_type: string | null;
  qk_norm: boolean | null;
  activation: string | null;
  attention: string | null;
  moe: string | null;
  other: string[];
};

export type RawModel = {
  slug: string;
  data: {
    name: string;
    organization: string;
    release_date: string;
    parameters_total: string;
    parameters_active?: string;
    open_weights: boolean;
    architecture: Architecture;
  };
};

export type ModelPoint = {
  slug: string;
  name: string;
  organization: string;
  orgKey: string;
  color: string;
  releaseDate: string;
  releaseTs: number;
  paramsTotalB: number;
  paramsActiveB: number | null;
  isMoE: boolean;
  href: string;
};

export type OrgLegendEntry = {
  key: string;
  label: string;
  color: string;
  count: number;
};

/**
 * Parse a parameter string like "70B" or "1.6T" into a billion-parameter count.
 * Returns null for explicit non-numeric markers ("undisclosed", "Not publicly disclosed").
 */
export function parseParametersB(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/undisclosed|not publicly disclosed|n\/?a/i.test(trimmed)) return null;
  const match = trimmed.match(/^([\d.]+)\s*([BT])?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = (match[2] ?? "B").toUpperCase();
  return unit === "T" ? value * 1000 : value;
}

/**
 * Collapse the registry's `organization` strings into stable canonical keys
 * so multiple variants (e.g. "Zhipu AI", "Tsinghua KEG / Zhipu AI") map to
 * one legend slot.
 */
export function canonicalOrg(org: string): { key: string; label: string } {
  const s = org.toLowerCase();
  if (s.includes("alibaba") || s.includes("qwen")) return { key: "alibaba", label: "Alibaba" };
  if (s.includes("allen institute") || s.includes("ai2")) return { key: "ai2", label: "AI2" };
  if (s.includes("cohere")) return { key: "cohere", label: "Cohere" };
  if (s.includes("deepseek")) return { key: "deepseek", label: "DeepSeek" };
  if (s.includes("google")) return { key: "google", label: "Google" };
  if (s.includes("meta")) return { key: "meta", label: "Meta" };
  if (s.includes("microsoft")) return { key: "microsoft", label: "Microsoft" };
  if (s.includes("minimax")) return { key: "minimax", label: "MiniMax" };
  if (s.includes("mistral")) return { key: "mistral", label: "Mistral" };
  if (s.includes("moonshot") || s.includes("kimi")) return { key: "moonshot", label: "Moonshot" };
  if (s.includes("nvidia")) return { key: "nvidia", label: "NVIDIA" };
  if (s.includes("openai")) return { key: "openai", label: "OpenAI" };
  if (s.includes("tencent")) return { key: "tencent", label: "Tencent" };
  if (s.includes("zhipu") || s.includes("tsinghua")) return { key: "zhipu", label: "Zhipu" };
  return { key: s.replace(/[^a-z0-9]+/g, "-"), label: org };
}

export const ORG_COLORS: Record<string, string> = {
  meta:      "#b85a3a",  // rust
  deepseek:  "#1a4f7a",  // navy (project accent)
  mistral:   "#8a3a6a",  // plum
  alibaba:   "#6b7a3a",  // olive
  moonshot:  "#b8923a",  // gold
  zhipu:     "#5a3a8a",  // purple
  openai:    "#1a6a5a",  // teal
  google:    "#3a6a8a",  // slate
  tencent:   "#7a3a4a",  // maroon
  microsoft: "#3a8a8a",  // sea
  nvidia:    "#5a7a3a",  // moss
  ai2:       "#6b6b66",  // warm gray
  minimax:   "#8a6a3a",  // umber
  cohere:    "#4a4a8a",  // indigo
};
const FALLBACK_COLOR = "#5a5a55";

export function isMoE(arch: Architecture): boolean {
  return typeof arch.moe === "string" && arch.moe.trim().length > 0;
}

export function buildTimeline(models: RawModel[], baseUrl: string): {
  points: ModelPoint[];
  legend: OrgLegendEntry[];
} {
  const points: ModelPoint[] = [];
  for (const m of models) {
    if (!m.data.open_weights) continue;
    const total = parseParametersB(m.data.parameters_total);
    if (total === null) continue;
    const ts = Date.parse(m.data.release_date);
    if (!Number.isFinite(ts)) continue;
    const { key, label } = canonicalOrg(m.data.organization);
    points.push({
      slug: m.slug,
      name: m.data.name,
      organization: label,
      orgKey: key,
      color: ORG_COLORS[key] ?? FALLBACK_COLOR,
      releaseDate: m.data.release_date,
      releaseTs: ts,
      paramsTotalB: total,
      paramsActiveB: parseParametersB(m.data.parameters_active),
      isMoE: isMoE(m.data.architecture),
      href: `${baseUrl}/models/${m.slug}/`,
    });
  }

  points.sort((a, b) => a.releaseTs - b.releaseTs);

  const counts = new Map<string, { label: string; count: number }>();
  for (const p of points) {
    const cur = counts.get(p.orgKey) ?? { label: p.organization, count: 0 };
    cur.count += 1;
    counts.set(p.orgKey, cur);
  }
  const legend: OrgLegendEntry[] = Array.from(counts.entries())
    .map(([key, v]) => ({ key, label: v.label, color: ORG_COLORS[key] ?? FALLBACK_COLOR, count: v.count }))
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

  return { points, legend };
}

/** Build the 5-point star SVG path centered at (cx, cy) with given outer radius. */
export function starPath(cx: number, cy: number, rOuter: number, rInner = rOuter * 0.42): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

/** Format params for tooltip. 1.6T, 70B, 671B/37B (for MoE) etc. */
export function formatParams(totalB: number, activeB: number | null, isMoE: boolean): string {
  const fmt = (b: number) => {
    if (b >= 1000) {
      const t = b / 1000;
      return Number.isInteger(t) ? `${t}T` : `${t.toFixed(1)}T`;
    }
    return Number.isInteger(b) ? `${b}B` : `${b.toFixed(1)}B`;
  };
  if (isMoE && activeB !== null) return `${fmt(totalB)} total · ${fmt(activeB)} active`;
  return fmt(totalB);
}

/** Format ISO date as e.g. "Jul 2024". */
export function formatReleaseDate(iso: string): string {
  const [y, m] = iso.split("-");
  if (!y || !m) return iso;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}
