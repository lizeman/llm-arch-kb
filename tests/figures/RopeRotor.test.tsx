/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import RopeRotor from "~/components/figures/RopeRotor";

afterEach(() => cleanup());

describe("RopeRotor figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <RopeRotor />);
    expect(getByTestId("rope-rotor")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <RopeRotor />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates angle when position slider moves", () => {
    const { container } = render(() => <RopeRotor />);
    const sliders = container.querySelectorAll("input[type=range]");
    const posSlider = sliders[0] as HTMLInputElement;
    fireEvent.input(posSlider, { target: { value: "4000" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/t = 4000/);
  });
});
