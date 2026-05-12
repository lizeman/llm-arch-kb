/** @jsxImportSource solid-js */
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import HeadToHeadCompare, {
  type ModelProfile,
  type ArchSlotSpec,
} from "../src/components/compare/HeadToHeadCompare";

const archSlots: ArchSlotSpec[] = [
  { key: "positional", label: "Positional", shortLabel: "Positional" },
  { key: "normalization_placement", label: "Norm placement", shortLabel: "Norm placement" },
  { key: "attention", label: "Attention", shortLabel: "Attention" },
  { key: "moe", label: "MoE", shortLabel: "MoE" },
];

function makeProfile(overrides: Partial<ModelProfile>): ModelProfile {
  return {
    slug: "llama-3-1-70b",
    name: "Llama 3.1 70B",
    organization: "Meta",
    releaseDate: "2024-07",
    yearLabel: "2024-07",
    parametersTotal: "70B",
    parametersActive: null,
    contextLength: 128_000,
    disclosure: "open",
    href: "/models/llama-3-1-70b/",
    architecture: {
      positional: "RoPE + YaRN",
      normalization_placement: "pre",
      attention: "GQA",
      moe: "—",
    },
    adoptedByCategory: [
      {
        category: "positional",
        categoryLabel: "Positional",
        techniques: [
          { slug: "rope", title: "Rotary Position Embedding", abbreviation: "RoPE", href: "/positional/rope/" },
        ],
      },
    ],
    ...overrides,
  };
}

function countModelHeaderCells(container: HTMLElement): number {
  return container.querySelectorAll(".h2h-compare-modelhead").length;
}

describe("HeadToHeadCompare", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/compare/");
  });

  it("renders the empty-state prompt when nothing is selected", () => {
    const { container, getByText } = render(() => (
      <HeadToHeadCompare profiles={[makeProfile({})]} archSlots={archSlots} defaultFocus={[]} maxFocus={3} />
    ));
    expect(getByText(/Pick up to 3 models/i)).toBeTruthy();
    expect(container.querySelector(".h2h-compare")).toBeNull();
  });

  it("pre-selects defaultFocus models on mount as table columns", () => {
    const { container } = render(() => (
      <HeadToHeadCompare
        profiles={[makeProfile({}), makeProfile({ slug: "deepseek-v3", name: "DeepSeek V3" })]}
        archSlots={archSlots}
        defaultFocus={["llama-3-1-70b", "deepseek-v3"]}
        maxFocus={3}
      />
    ));
    expect(countModelHeaderCells(container as HTMLElement)).toBe(2);
  });

  it("toggles a model in/out via the picker button", () => {
    const { container } = render(() => (
      <HeadToHeadCompare profiles={[makeProfile({})]} archSlots={archSlots} defaultFocus={[]} maxFocus={3} />
    ));
    expect(countModelHeaderCells(container as HTMLElement)).toBe(0);
    const picker = container.querySelector(".h2h-picker-item") as HTMLElement;
    fireEvent.click(picker);
    expect(countModelHeaderCells(container as HTMLElement)).toBe(1);
    // toggle off via chip remove
    const remove = container.querySelector(".h2h-chip-remove") as HTMLElement;
    fireEvent.click(remove);
    expect(countModelHeaderCells(container as HTMLElement)).toBe(0);
  });

  it("enforces the maxFocus cap by dropping the oldest selection (FIFO)", () => {
    const profiles = [
      makeProfile({ slug: "a", name: "Model A" }),
      makeProfile({ slug: "b", name: "Model B" }),
      makeProfile({ slug: "c", name: "Model C" }),
      makeProfile({ slug: "d", name: "Model D" }),
    ];
    const { container } = render(() => (
      <HeadToHeadCompare
        profiles={profiles}
        archSlots={archSlots}
        defaultFocus={["a", "b", "c"]}
        maxFocus={3}
      />
    ));
    expect(countModelHeaderCells(container as HTMLElement)).toBe(3);
    const allPickers = container.querySelectorAll(".h2h-picker-item");
    const dItem = Array.from(allPickers).find((el) =>
      el.textContent?.includes("Model D"),
    ) as HTMLElement;
    fireEvent.click(dItem);
    const heads = container.querySelectorAll(".h2h-compare-modelhead");
    expect(heads.length).toBe(3);
    const headTexts = Array.from(heads).map((h) => h.textContent ?? "");
    expect(headTexts.some((t) => t.includes("Model A"))).toBe(false);
    expect(headTexts.some((t) => t.includes("Model D"))).toBe(true);
  });

  it("filters the picker list by search input", () => {
    const profiles = [
      makeProfile({ slug: "llama-3-1-70b", name: "Llama 3.1 70B" }),
      makeProfile({ slug: "deepseek-v3", name: "DeepSeek V3", organization: "DeepSeek" }),
    ];
    const { container } = render(() => (
      <HeadToHeadCompare profiles={profiles} archSlots={archSlots} defaultFocus={[]} maxFocus={3} />
    ));
    expect(container.querySelectorAll(".h2h-picker-item").length).toBe(2);
    const input = container.querySelector(".h2h-search input") as HTMLInputElement;
    input.value = "deepseek";
    fireEvent.input(input);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(container.querySelectorAll(".h2h-picker-item").length).toBe(1);
        resolve();
      }, 200);
    });
  });

  it("renders adopted-techniques grouped by category as table rows", () => {
    const profile = makeProfile({
      slug: "deepseek-v3",
      name: "DeepSeek V3",
      adoptedByCategory: [
        {
          category: "attention",
          categoryLabel: "Attention",
          techniques: [
            { slug: "mla", title: "Multi-head Latent Attention", abbreviation: "MLA", href: "/attention/mla/" },
          ],
        },
        {
          category: "ffn-moe",
          categoryLabel: "FFN & MoE",
          techniques: [
            { slug: "deepseek-moe", title: "DeepSeekMoE", abbreviation: "DSMoE", href: "/ffn-moe/deepseek-moe/" },
          ],
        },
      ],
    });
    const { container } = render(() => (
      <HeadToHeadCompare profiles={[profile]} archSlots={archSlots} defaultFocus={["deepseek-v3"]} maxFocus={3} />
    ));
    const rowLabels = Array.from(container.querySelectorAll(".h2h-compare-rowlabel")).map(
      (el) => el.textContent?.trim(),
    );
    expect(rowLabels).toContain("Attention");
    expect(rowLabels).toContain("FFN & MoE");
    expect(container.querySelector("a[href='/attention/mla/']")).toBeTruthy();
  });

  it("aligns rows across columns even when values wrap (architecture rows share Y positions)", () => {
    // This is the bug we're fixing: a long arch value in one column shouldn't push
    // the next row out of alignment vs. an adjacent column with a short value.
    const longValue = makeProfile({
      slug: "long",
      name: "Long-Values",
      architecture: {
        positional: "RoPE with decoupled head + YaRN scaling (this value wraps to multiple lines on narrow widths)",
        normalization_placement: "sandwich (pre + post on both attention and FFN)",
        attention: "MLA with decoupled RoPE head",
        moe: "DeepSeek-MoE with aux-loss-free balancing",
      },
    });
    const shortValue = makeProfile({
      slug: "short",
      name: "Short-Values",
      architecture: {
        positional: "RoPE",
        normalization_placement: "pre",
        attention: "GQA",
        moe: "—",
      },
    });
    const { container } = render(() => (
      <HeadToHeadCompare
        profiles={[longValue, shortValue]}
        archSlots={archSlots}
        defaultFocus={["long", "short"]}
        maxFocus={3}
      />
    ));
    // The alignment invariant: every row in the comparison table has exactly
    // (1 label + N model columns) cells; rows in the same DOM <tr> are
    // therefore vertically aligned by the browser layout engine.
    const rows = container.querySelectorAll("tbody .h2h-compare-row");
    expect(rows.length).toBeGreaterThanOrEqual(archSlots.length);
    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll("th, td");
      expect(cells.length).toBe(3); // 1 label + 2 model columns
    }
  });

  it("renders '—' for missing architecture slots and surfaces the footnote", () => {
    const partial = makeProfile({
      slug: "partial",
      name: "Partial Disclosure",
      architecture: {
        positional: "RoPE",
        normalization_placement: "—",
        attention: "—",
        moe: "—",
      },
    });
    const { container } = render(() => (
      <HeadToHeadCompare profiles={[partial]} archSlots={archSlots} defaultFocus={["partial"]} maxFocus={3} />
    ));
    const dashCells = container.querySelectorAll("td.h2h-compare-val.is-missing");
    // 3 of the 4 arch slots are '—'
    expect(dashCells.length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector(".h2h-compare-footnote")).toBeTruthy();
  });
});
