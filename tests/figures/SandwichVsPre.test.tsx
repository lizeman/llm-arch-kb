/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import SandwichVsPre from "~/components/figures/SandwichVsPre";

afterEach(() => cleanup());

describe("SandwichVsPre figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <SandwichVsPre />);
    expect(getByTestId("sandwich-vs-pre")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <SandwichVsPre />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when depth slider moves", () => {
    const { container } = render(() => <SandwichVsPre />);
    const sliders = container.querySelectorAll("input[type=range]");
    const depthSlider = sliders[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(depthSlider, { target: { value: "150" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
