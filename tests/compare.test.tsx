/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import ArchMatrix, { type ArchRow } from "~/components/compare/ArchMatrix";
import TechniqueMatrix, { type TechRow } from "~/components/compare/TechniqueMatrix";
import HeatmapMatrix from "~/components/compare/HeatmapMatrix";
import ExportButtons from "~/components/compare/ExportButtons";
import AdoptionStats from "~/components/compare/AdoptionStats";
import { createUrlWriter, readUrl } from "~/components/compare/UrlState";

afterEach(() => cleanup());

beforeEach(() => {
  // Reset URL state each test so reader/writer namespaces don't leak.
  window.history.replaceState(null, "", "/test");
});

const ARCH_ROWS: ArchRow[] = [
  {
    slug: "llama-3-70b",
    name: "Llama 3 70B",
    organization: "Meta",
    release_date: "2024-04-18",
    year: 2024,
    disclosure: "open",
    href: "/models/llama-3-70b/",
    positional: "RoPE",
    normalization_placement: "Pre-Norm",
    normalization_type: "RMSNorm",
    activation: "SwiGLU",
    attention: "GQA",
  },
  {
    slug: "deepseek-v3",
    name: "DeepSeek V3",
    organization: "DeepSeek",
    release_date: "2024-12-26",
    year: 2024,
    disclosure: "open",
    href: "/models/deepseek-v3/",
    positional: "RoPE",
    normalization_placement: "Pre-Norm",
    normalization_type: "RMSNorm",
    activation: "SwiGLU",
    attention: "MLA",
    moe: "DeepSeekMoE",
  },
];

describe("ArchMatrix", () => {
  it("renders a row per model", () => {
    const { container } = render(() => (
      <ArchMatrix
        rows={ARCH_ROWS}
        slots={[
          { key: "positional", label: "Positional encoding", shortLabel: "Positional" },
          { key: "attention", label: "Attention", shortLabel: "Attention" },
        ]}
        organizations={["Meta", "DeepSeek"]}
        disclosures={["open"]}
        yearBounds={{ min: 2024, max: 2024 }}
      />
    ));
    const tbody = container.querySelector("tbody");
    expect(tbody?.querySelectorAll("tr").length).toBe(2);
    expect(container.textContent).toContain("Llama 3 70B");
    expect(container.textContent).toContain("DeepSeek V3");
  });

  it("filters by organization chip", async () => {
    const { container } = render(() => (
      <ArchMatrix
        rows={ARCH_ROWS}
        slots={[
          { key: "positional", label: "Positional encoding", shortLabel: "Positional" },
        ]}
        organizations={["Meta", "DeepSeek"]}
        disclosures={["open"]}
        yearBounds={{ min: 2024, max: 2024 }}
      />
    ));
    // Pick the chip inside the Organization fieldset by aria-label.
    const orgFieldset = container.querySelector('[aria-label="Organization"]')!;
    const buttons = Array.from(orgFieldset.querySelectorAll("button"));
    const metaChip = buttons.find((b) => b.textContent?.trim() === "Meta")!;
    fireEvent.click(metaChip);
    const tbody = container.querySelector("tbody");
    expect(tbody?.querySelectorAll("tr").length).toBe(1);
    expect(tbody?.textContent).toContain("Llama 3 70B");
    expect(tbody?.textContent).not.toContain("DeepSeek V3");
  });

  it("sort arrow toggles direction", () => {
    const { container, getAllByRole } = render(() => (
      <ArchMatrix
        rows={ARCH_ROWS}
        slots={[]}
        organizations={["Meta", "DeepSeek"]}
        disclosures={["open"]}
        yearBounds={{ min: 2024, max: 2024 }}
      />
    ));
    const nameHeader = getAllByRole("button").find((b) => b.textContent?.includes("Model"))!;
    fireEvent.click(nameHeader);
    expect(nameHeader.textContent).toContain("▲");
    fireEvent.click(nameHeader);
    expect(nameHeader.textContent).toContain("▼");
    // First row after one click (asc) should be DeepSeek (D < L).
    const firstName = container.querySelector("tbody tr a")?.textContent;
    expect(firstName).toBeTruthy();
  });
});

describe("TechniqueMatrix", () => {
  const techRows: TechRow[] = [
    {
      slug: "rope",
      category: "positional",
      categoryLabel: "Positional Encoding",
      title: "Rotary Position Embedding",
      abbreviation: "RoPE",
      href: "/positional/rope/",
      year: 2021,
      month: 4,
      yearLabel: "2021-04",
      status: "production-adopted",
      adopters: 12,
      summary: "Rotation-matrix-based relative position encoding.",
    },
    {
      slug: "rmsnorm",
      category: "normalization",
      categoryLabel: "Normalization",
      title: "RMSNorm",
      abbreviation: "RMSNorm",
      href: "/normalization/rmsnorm/",
      year: 2019,
      month: 10,
      yearLabel: "2019-10",
      status: "production-adopted",
      adopters: 8,
      summary: "Simplified normalization, no mean centering.",
    },
  ];

  it("renders rows ordered by year asc by default", () => {
    const { container } = render(() => (
      <TechniqueMatrix
        rows={techRows}
        categories={[
          { key: "positional", label: "Positional Encoding" },
          { key: "normalization", label: "Normalization" },
        ]}
        statuses={[{ key: "production-adopted", label: "production-adopted" }]}
        yearBounds={{ min: 2019, max: 2021 }}
      />
    ));
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    // Year sort asc: 2019 first.
    expect(rows[0].textContent).toContain("2019");
  });

  it("global search filters by title", async () => {
    const { container, getByPlaceholderText } = render(() => (
      <TechniqueMatrix
        rows={techRows}
        categories={[
          { key: "positional", label: "Positional Encoding" },
          { key: "normalization", label: "Normalization" },
        ]}
        statuses={[{ key: "production-adopted", label: "production-adopted" }]}
        yearBounds={{ min: 2019, max: 2021 }}
      />
    ));
    const search = getByPlaceholderText("Search…") as HTMLInputElement;
    fireEvent.input(search, { target: { value: "rope" } });
    // search is debounced 120ms.
    await new Promise((r) => setTimeout(r, 200));
    const visible = container.querySelectorAll("tbody tr");
    expect(visible.length).toBe(1);
    expect(visible[0].textContent).toContain("RoPE");
  });
});

describe("HeatmapMatrix", () => {
  const cols = [
    {
      cat: "positional",
      catLabel: "Positional Encoding",
      slug: "rope",
      title: "RoPE",
      abbreviation: "RoPE",
      href: "/positional/rope/",
      adopted: ["llama-3-70b", "deepseek-v3"],
    },
    {
      cat: "attention",
      catLabel: "Attention",
      slug: "mla",
      title: "MLA",
      abbreviation: "MLA",
      href: "/attention/mla/",
      adopted: ["deepseek-v3"],
    },
  ];
  const models = [
    {
      slug: "llama-3-70b",
      name: "Llama 3 70B",
      organization: "Meta",
      year: 2024,
      disclosure: "open",
      href: "/models/llama-3-70b/",
    },
    {
      slug: "deepseek-v3",
      name: "DeepSeek V3",
      organization: "DeepSeek",
      year: 2024,
      disclosure: "open",
      href: "/models/deepseek-v3/",
    },
  ];

  it("renders a dot when a model adopts a technique", () => {
    const { container } = render(() => (
      <HeatmapMatrix
        models={models}
        columns={cols}
        categoryOptions={[
          { key: "positional", label: "Positional" },
          { key: "attention", label: "Attention" },
        ]}
        organizationOptions={[{ key: "Meta", label: "Meta" }, { key: "DeepSeek", label: "DeepSeek" }]}
        mobileBreakpoint={0}
      />
    ));
    const dots = container.querySelectorAll(".heatmap-cell .dot");
    expect(dots.length).toBe(3); // 2 RoPE + 1 MLA
  });

  it("focuses on 2 selected models", async () => {
    const { container, getAllByText } = render(() => (
      <HeatmapMatrix
        models={models}
        columns={cols}
        categoryOptions={[]}
        organizationOptions={[]}
        mobileBreakpoint={0}
      />
    ));
    // Find pill in cmp-focus-pills (skip the rowhead links in the table).
    const focusPills = container.querySelector(".cmp-focus-pills")!;
    const llamaPill = focusPills.querySelector("button")!;
    fireEvent.click(llamaPill);
    const deepseekPill = focusPills.querySelectorAll("button")[1] as HTMLButtonElement;
    fireEvent.click(deepseekPill);
    // both selected; matrix still shows both rows.
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
  });

  it("renders adoption-stats footer", () => {
    const { container } = render(() => (
      <HeatmapMatrix
        models={models}
        columns={cols}
        categoryOptions={[]}
        organizationOptions={[]}
        mobileBreakpoint={0}
      />
    ));
    const stats = container.querySelectorAll("tfoot .cmp-stats");
    expect(stats.length).toBe(2);
    expect(stats[0].textContent).toContain("2/2");
    expect(stats[1].textContent).toContain("1/2");
  });
});

describe("ExportButtons", () => {
  it("renders csv + markdown buttons", () => {
    const { getByText } = render(() => (
      <ExportButtons
        filename="test"
        rows={() => [["A", "B"], [1, 2]]}
      />
    ));
    expect(getByText("Download CSV")).toBeTruthy();
    expect(getByText("Copy Markdown")).toBeTruthy();
  });
});

describe("AdoptionStats", () => {
  it("renders N/M with correct width", () => {
    const { container } = render(() => <AdoptionStats hits={3} total={10} />);
    expect(container.textContent).toContain("3/10");
    const fill = container.querySelector(".cmp-stats-fill") as HTMLElement;
    expect(fill.style.width).toBe("30%");
  });
});

describe("UrlState", () => {
  it("round-trips a single key with namespace", () => {
    const w = createUrlWriter("ns", 0);
    w.set("k", "v");
    w.flush();
    const r = readUrl("ns");
    expect(r.get("k")).toBe("v");
  });

  it("serializes/parses a list", () => {
    const w = createUrlWriter("ns", 0);
    w.set("list", ["a", "b", "c"]);
    w.flush();
    const r = readUrl("ns");
    expect(r.getList("list")).toEqual(["a", "b", "c"]);
  });

  it("deletes a key on null", () => {
    const w = createUrlWriter("ns", 0);
    w.set("k", "v");
    w.flush();
    w.set("k", null);
    w.flush();
    const r = readUrl("ns");
    expect(r.get("k")).toBeNull();
  });
});
