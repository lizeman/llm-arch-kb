/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import LongRopeSearch from "~/components/figures/LongRopeSearch";

afterEach(() => cleanup());

describe("LongRopeSearch figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <LongRopeSearch />);
    expect(getByTestId("long-rope-search")).toBeTruthy();
  });

  it("has three sliders with aria-valuetext", () => {
    const { container } = render(() => <LongRopeSearch />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(3);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates value display when context-scale slider moves", () => {
    const { container } = render(() => <LongRopeSearch />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "32" } });
    const value = container.querySelectorAll("label .value")[0];
    expect(value.textContent).toMatch(/32/);
  });

  it("changes polyline path when seed slider moves", () => {
    const { container } = render(() => <LongRopeSearch />);
    const sliders = container.querySelectorAll("input[type=range]");
    const seedSlider = sliders[1] as HTMLInputElement;
    const beforePoints = container.querySelectorAll("polyline")[1]?.getAttribute("points") ?? "";
    fireEvent.input(seedSlider, { target: { value: "10" } });
    const afterPoints = container.querySelectorAll("polyline")[1]?.getAttribute("points") ?? "";
    expect(afterPoints).not.toEqual(beforePoints);
  });
});
