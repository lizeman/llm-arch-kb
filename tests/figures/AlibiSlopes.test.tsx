/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import AlibiSlopes from "~/components/figures/AlibiSlopes";

afterEach(() => cleanup());

describe("AlibiSlopes figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <AlibiSlopes />);
    expect(getByTestId("alibi-slopes")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <AlibiSlopes />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates head selection display when slider moves", () => {
    const { container } = render(() => <AlibiSlopes />);
    const sliders = container.querySelectorAll("input[type=range]");
    const headSlider = sliders[1] as HTMLInputElement;
    fireEvent.input(headSlider, { target: { value: "3" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/head 3/);
  });
});
