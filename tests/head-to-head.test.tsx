/** @jsxImportSource solid-js */
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import HeadToHeadCompare, {
  type ModelProfile,
  type ArchSlotSpec,
} from "../src/components/compare/HeadToHeadCompare";

const archSlots: ArchSlotSpec[] = [
  { key: "positional", label: "Positional", shortLabel: "Positional" },
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

describe("HeadToHeadCompare", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/compare/");
  });

  it("renders the empty-state prompt when nothing is selected", () => {
    const { container, getByText } = render(() => (
      <HeadToHeadCompare profiles={[makeProfile({})]} archSlots={archSlots} defaultFocus={[]} maxFocus={3} />
    ));
    expect(getByText(/Pick up to 3 models/i)).toBeTruthy();
    expect(container.querySelector(".h2h-grid")).toBeNull();
  });

  it("pre-selects defaultFocus models on mount", () => {
    const { container } = render(() => (
      <HeadToHeadCompare
        profiles={[makeProfile({}), makeProfile({ slug: "deepseek-v3", name: "DeepSeek V3" })]}
        archSlots={archSlots}
        defaultFocus={["llama-3-1-70b", "deepseek-v3"]}
        maxFocus={3}
      />
    ));
    expect(container.querySelectorAll(".h2h-col").length).toBe(2);
  });

  it("toggles a model in/out via the picker button", () => {
    const { container, getByText } = render(() => (
      <HeadToHeadCompare profiles={[makeProfile({})]} archSlots={archSlots} defaultFocus={[]} maxFocus={3} />
    ));
    expect(container.querySelectorAll(".h2h-col").length).toBe(0);
    const picker = container.querySelector(".h2h-picker-item") as HTMLElement;
    fireEvent.click(picker);
    expect(container.querySelectorAll(".h2h-col").length).toBe(1);
    // toggle off via chip remove
    const remove = container.querySelector(".h2h-chip-remove") as HTMLElement;
    fireEvent.click(remove);
    expect(container.querySelectorAll(".h2h-col").length).toBe(0);
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
    expect(container.querySelectorAll(".h2h-col").length).toBe(3);
    const allPickers = container.querySelectorAll(".h2h-picker-item");
    // The 4th item is Model D (the unselected one)
    const dItem = Array.from(allPickers).find((el) =>
      el.textContent?.includes("Model D"),
    ) as HTMLElement;
    fireEvent.click(dItem);
    const cols = container.querySelectorAll(".h2h-col");
    expect(cols.length).toBe(3);
    // Model A should be gone (oldest dropped)
    expect(Array.from(cols).some((el) => el.textContent?.includes("Model A"))).toBe(false);
    expect(Array.from(cols).some((el) => el.textContent?.includes("Model D"))).toBe(true);
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
    // search is debounced at 120ms; nudge time and re-read
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(container.querySelectorAll(".h2h-picker-item").length).toBe(1);
        resolve();
      }, 200);
    });
  });

  it("renders adopted-techniques grouped by category", () => {
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
    const catLabels = Array.from(container.querySelectorAll(".h2h-tech-cat")).map(
      (el) => el.textContent?.trim(),
    );
    expect(catLabels).toContain("Attention");
    expect(catLabels).toContain("FFN & MoE");
    expect(container.querySelector("a[href='/attention/mla/']")).toBeTruthy();
  });
});
