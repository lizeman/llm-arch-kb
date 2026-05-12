/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import CompressiveTiers from "~/components/figures/CompressiveTiers";

afterEach(() => cleanup());

describe("CompressiveTiers figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <CompressiveTiers />);
    expect(getByTestId("compressive-tiers")).toBeTruthy();
  });

  it("has three sliders with aria-valuetext", () => {
    const { container } = render(() => <CompressiveTiers />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(3);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when compression slider moves", () => {
    const { container } = render(() => <CompressiveTiers />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "16" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
