/** @jsxImportSource solid-js */
/**
 * ModelTimeline hover / filter animation contract.
 *
 * - Hovering a point grows it (circle radius bumps from 4.6 to 6.2; star from
 *   6.8 to 8.5). Tooltip nodes (.tl-tt-box, .tl-cross) appear in the DOM only
 *   while hovered.
 * - Clicking a legend chip toggles aria-pressed and marks non-matching points
 *   with class .is-dim (CSS transitions handle the actual fade).
 * - Clicking the same chip again clears the filter; aria-pressed flips back.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import ModelTimeline from "~/components/ModelTimeline";
import type { ModelPoint, OrgLegendEntry } from "~/utils/model-timeline";

afterEach(() => cleanup());

const POINTS: ModelPoint[] = [
  {
    slug: "llama-3-1-70b",
    name: "Llama 3.1 70B",
    organization: "Meta",
    orgKey: "meta",
    color: "#1a4f7a",
    releaseDate: "2024-07",
    releaseTs: Date.UTC(2024, 6, 23),
    paramsTotalB: 70,
    paramsActiveB: null,
    isMoE: false,
    href: "/models/llama-3-1-70b/",
  },
  {
    slug: "deepseek-v3",
    name: "DeepSeek V3",
    organization: "DeepSeek",
    orgKey: "deepseek",
    color: "#a25c00",
    releaseDate: "2024-12",
    releaseTs: Date.UTC(2024, 11, 26),
    paramsTotalB: 671,
    paramsActiveB: 37,
    isMoE: true,
    href: "/models/deepseek-v3/",
  },
];

const LEGEND: OrgLegendEntry[] = [
  { key: "meta", label: "Meta", color: "#1a4f7a", count: 1 },
  { key: "deepseek", label: "DeepSeek", color: "#a25c00", count: 1 },
];

describe("Animation: ModelTimeline hover + legend filter", () => {
  it("hovering a dense point enlarges its circle", () => {
    const { container } = render(() => <ModelTimeline points={POINTS} legend={LEGEND} />);
    const denseGroup = container.querySelector(".tl-point.is-dense") as SVGGElement;
    expect(denseGroup).toBeTruthy();
    const circle = denseGroup.querySelector("circle:not(.tl-hit)") as SVGCircleElement;
    expect(Number(circle.getAttribute("r"))).toBeCloseTo(4.6, 1);

    fireEvent.mouseEnter(denseGroup);
    const grown = denseGroup.querySelector("circle:not(.tl-hit)") as SVGCircleElement;
    expect(Number(grown.getAttribute("r"))).toBeCloseTo(6.2, 1);

    fireEvent.mouseLeave(denseGroup);
    const shrunk = denseGroup.querySelector("circle:not(.tl-hit)") as SVGCircleElement;
    expect(Number(shrunk.getAttribute("r"))).toBeCloseTo(4.6, 1);
  });

  it("hover spawns the tooltip box and crosshair lines", () => {
    const { container } = render(() => <ModelTimeline points={POINTS} legend={LEGEND} />);
    expect(container.querySelector(".tl-tt-box")).toBeNull();
    expect(container.querySelector(".tl-cross")).toBeNull();

    const moeGroup = container.querySelector(".tl-point.is-moe") as SVGGElement;
    fireEvent.mouseEnter(moeGroup);
    expect(container.querySelector(".tl-tt-box")).not.toBeNull();
    expect(container.querySelectorAll(".tl-cross").length).toBe(2);

    fireEvent.mouseLeave(moeGroup);
    expect(container.querySelector(".tl-tt-box")).toBeNull();
  });

  it("legend chip click marks non-matching points as dimmed", () => {
    const { container } = render(() => <ModelTimeline points={POINTS} legend={LEGEND} />);
    const chips = Array.from(container.querySelectorAll<HTMLButtonElement>(".tl-chip"))
      .filter((b) => b.getAttribute("aria-pressed") !== null);
    const metaChip = chips.find((b) => /Meta/i.test(b.textContent ?? ""));
    expect(metaChip, "Meta chip should exist").toBeTruthy();

    fireEvent.click(metaChip!);
    expect(metaChip!.getAttribute("aria-pressed")).toBe("true");

    const dimmed = container.querySelectorAll(".tl-point.is-dim");
    // Only DeepSeek should dim — that's 1 of 2 points.
    expect(dimmed.length).toBe(1);

    // Second click un-filters.
    fireEvent.click(metaChip!);
    expect(metaChip!.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll(".tl-point.is-dim").length).toBe(0);
  });
});
