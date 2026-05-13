/** @jsxImportSource solid-js */
/**
 * SwiGluCurves animation contract.
 *
 * Slider drives β through Swish; the curve must re-render and the
 * aria-valuetext must reflect the new value. The "Show Swish · x" checkbox
 * toggles a 4th polyline in/out. These cover the live interactions; the
 * static render is already covered by tests/figures/SwiGluCurves.test.tsx.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import SwiGluCurves from "~/components/figures/SwiGluCurves";

afterEach(() => cleanup());

describe("Animation: SwiGluCurves interactions", () => {
  it("slider updates aria-valuetext announcement", () => {
    const { container } = render(() => <SwiGluCurves />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "2.5" } });
    expect(slider.getAttribute("aria-valuetext")).toMatch(/2\.50/);
  });

  it("gate checkbox adds/removes the Swish·x polyline", () => {
    const { container } = render(() => <SwiGluCurves />);
    const before = container.querySelectorAll("polyline").length;
    expect(before).toBeGreaterThanOrEqual(4); // ReLU, GELU, SiLU, Swish·x

    const checkbox = container.querySelector(
      "input[type=checkbox]",
    ) as HTMLInputElement;
    fireEvent.input(checkbox, { target: { checked: false } });
    const after = container.querySelectorAll("polyline").length;
    expect(after).toBe(before - 1);

    fireEvent.input(checkbox, { target: { checked: true } });
    const restored = container.querySelectorAll("polyline").length;
    expect(restored).toBe(before);
  });

  it("legend value text tracks β", () => {
    const { container } = render(() => <SwiGluCurves />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "4.20" } });
    // legend embeds β= text in an SVG <text> node
    const svgTexts = Array.from(container.querySelectorAll("text")).map(
      (t) => t.textContent ?? "",
    );
    expect(svgTexts.some((t) => /β=4\.20/.test(t))).toBe(true);
  });
});
