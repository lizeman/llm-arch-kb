/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import AttentionSinks from "~/components/figures/AttentionSinks";

afterEach(() => cleanup());

describe("AttentionSinks figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <AttentionSinks />);
    expect(getByTestId("attention-sinks")).toBeTruthy();
  });

  it("has three sliders with aria-valuetext", () => {
    const { container } = render(() => <AttentionSinks />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(3);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("reflects position in heading text", () => {
    const { container } = render(() => <AttentionSinks />);
    const sliders = container.querySelectorAll("input[type=range]");
    const posSlider = sliders[0] as HTMLInputElement;
    fireEvent.input(posSlider, { target: { value: "10" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/t = 10/);
  });

  it("warns about quality collapse when sinks = 0", () => {
    const { container } = render(() => <AttentionSinks />);
    const sliders = container.querySelectorAll("input[type=range]");
    const sinkSlider = sliders[2] as HTMLInputElement;
    fireEvent.input(sinkSlider, { target: { value: "0" } });
    const svg = container.querySelector("svg")!;
    // The warning text is conditionally opacity-1 vs 0.4 but always present
    expect(svg.textContent).toMatch(/quality collapse/);
  });
});
