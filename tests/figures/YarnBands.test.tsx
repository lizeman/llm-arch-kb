/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import YarnBands from "~/components/figures/YarnBands";

afterEach(() => cleanup());

describe("YarnBands figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <YarnBands />);
    expect(getByTestId("yarn-bands")).toBeTruthy();
  });

  it("has three sliders with aria-valuetext", () => {
    const { container } = render(() => <YarnBands />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(3);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates slider display when context scale changes", () => {
    const { container } = render(() => <YarnBands />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "16.0" } });
    const valueSpan = container.querySelectorAll("label .value")[0];
    expect(valueSpan.textContent).toMatch(/16/);
  });

  it("recomputes band counts when r_max changes", () => {
    const { container } = render(() => <YarnBands />);
    const sliders = container.querySelectorAll("input[type=range]");
    const rMaxSlider = sliders[2] as HTMLInputElement;
    const before = container.querySelector("figcaption")!.textContent ?? "";
    fireEvent.input(rMaxSlider, { target: { value: "60" } });
    const after = container.querySelector("figcaption")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
