/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import SlidingWindow from "~/components/figures/SlidingWindow";

afterEach(() => cleanup());

describe("SlidingWindow figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <SlidingWindow />);
    expect(getByTestId("sliding-window")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <SlidingWindow />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates window size readout", () => {
    const { container } = render(() => <SlidingWindow />);
    const sliders = container.querySelectorAll("input[type=range]");
    const wSlider = sliders[0] as HTMLInputElement;
    fireEvent.input(wSlider, { target: { value: "8" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/W = 8/);
  });

  it("reports a non-zero effective receptive field for stacked layers", () => {
    const { container } = render(() => <SlidingWindow />);
    const sliders = container.querySelectorAll("input[type=range]");
    const lSlider = sliders[1] as HTMLInputElement;
    fireEvent.input(lSlider, { target: { value: "10" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/10 stacked|after 10 layers|≈ W × L = \d+/);
  });
});
