import { describe, it, expect } from "vitest";
import {
  parseParametersB,
  canonicalOrg,
  isMoE,
  buildTimeline,
  starPath,
  formatParams,
  type RawModel,
  type Architecture,
} from "./model-timeline";

function arch(overrides: Partial<Architecture> = {}): Architecture {
  return {
    positional: null,
    normalization_placement: null,
    normalization_type: null,
    qk_norm: null,
    activation: null,
    attention: null,
    moe: null,
    other: [],
    ...overrides,
  };
}

describe("parseParametersB", () => {
  it("parses plain B values", () => {
    expect(parseParametersB("70B")).toBe(70);
    expect(parseParametersB("7B")).toBe(7);
    expect(parseParametersB("671B")).toBe(671);
  });
  it("parses decimal values", () => {
    expect(parseParametersB("1.6T")).toBe(1600);
    expect(parseParametersB("7.3B")).toBe(7.3);
    expect(parseParametersB("46.7B")).toBe(46.7);
  });
  it("returns null for undisclosed markers", () => {
    expect(parseParametersB("undisclosed")).toBeNull();
    expect(parseParametersB("Not publicly disclosed")).toBeNull();
    expect(parseParametersB("")).toBeNull();
    expect(parseParametersB(null)).toBeNull();
  });
});

describe("canonicalOrg", () => {
  it("collapses org variants to stable keys", () => {
    expect(canonicalOrg("Alibaba (Qwen Team)").key).toBe("alibaba");
    expect(canonicalOrg("Allen Institute for AI (AI2)").key).toBe("ai2");
    expect(canonicalOrg("DeepSeek-AI").key).toBe("deepseek");
    expect(canonicalOrg("Mistral AI").key).toBe("mistral");
    expect(canonicalOrg("Tsinghua KEG / Zhipu AI").key).toBe("zhipu");
    expect(canonicalOrg("Zhipu AI").key).toBe("zhipu");
    expect(canonicalOrg("Google DeepMind").key).toBe("google");
  });
});

describe("isMoE", () => {
  it("detects MoE via the moe field", () => {
    expect(isMoE(arch({ moe: "Sparse MoE — 128 experts" }))).toBe(true);
    expect(isMoE(arch({ moe: null }))).toBe(false);
    expect(isMoE(arch({ moe: "" }))).toBe(false);
  });
});

describe("buildTimeline", () => {
  const raw: RawModel[] = [
    {
      slug: "llama-3-1-70b",
      data: {
        name: "Llama 3.1 70B",
        organization: "Meta",
        release_date: "2024-07-23",
        parameters_total: "70B",
        open_weights: true,
        architecture: arch(),
      },
    },
    {
      slug: "deepseek-v3",
      data: {
        name: "DeepSeek V3",
        organization: "DeepSeek-AI",
        release_date: "2024-12-26",
        parameters_total: "671B",
        parameters_active: "37B",
        open_weights: true,
        architecture: arch({ moe: "DeepSeekMoE with aux-loss-free routing" }),
      },
    },
    {
      slug: "gpt-4",
      data: {
        name: "GPT-4",
        organization: "OpenAI",
        release_date: "2023-03-14",
        parameters_total: "undisclosed",
        open_weights: false,
        architecture: arch(),
      },
    },
  ];

  it("filters out closed-weights models", () => {
    const { points } = buildTimeline(raw, "/llm-arch-kb");
    expect(points.find((p) => p.slug === "gpt-4")).toBeUndefined();
  });

  it("orders points chronologically", () => {
    const { points } = buildTimeline(raw, "/llm-arch-kb");
    expect(points.map((p) => p.slug)).toEqual(["llama-3-1-70b", "deepseek-v3"]);
  });

  it("assigns canonical orgs and colors", () => {
    const { points } = buildTimeline(raw, "/llm-arch-kb");
    expect(points[0].orgKey).toBe("meta");
    expect(points[0].color).toBe("#b85a3a");
    expect(points[1].orgKey).toBe("deepseek");
    expect(points[1].color).toBe("#1a4f7a");
  });

  it("flags MoE correctly", () => {
    const { points } = buildTimeline(raw, "/llm-arch-kb");
    expect(points.find((p) => p.slug === "llama-3-1-70b")?.isMoE).toBe(false);
    expect(points.find((p) => p.slug === "deepseek-v3")?.isMoE).toBe(true);
  });

  it("builds legend sorted by count descending", () => {
    const { legend } = buildTimeline(raw, "/llm-arch-kb");
    expect(legend.map((l) => l.key)).toEqual(["deepseek", "meta"]);
  });

  it("uses BASE in href", () => {
    const { points } = buildTimeline(raw, "/llm-arch-kb");
    expect(points[0].href).toBe("/llm-arch-kb/models/llama-3-1-70b/");
  });
});

describe("starPath", () => {
  it("produces a 10-vertex closed path", () => {
    const path = starPath(100, 100, 10);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    const verts = path.split(/[ML]/).filter(Boolean);
    expect(verts.length).toBe(10);
  });
});

describe("formatParams", () => {
  it("formats dense models with just total", () => {
    expect(formatParams(70, null, false)).toBe("70B");
  });
  it("formats MoE models with total · active", () => {
    expect(formatParams(671, 37, true)).toBe("671B total · 37B active");
  });
  it("scales trillion-parameter values", () => {
    expect(formatParams(1600, null, false)).toBe("1.6T");
  });
});
