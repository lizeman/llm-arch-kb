/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import FlashTiling from "~/components/figures/FlashTiling";

afterEach(() => cleanup());

describe("FlashTiling figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <FlashTiling />);
    expect(getByTestId("flash-tiling")).toBeTruthy();
  });

  it("has four sliders with aria-valuetext", () => {
    const { container } = render(() => <FlashTiling />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(4);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when tile size slider moves", () => {
    const { container } = render(() => <FlashTiling />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "32" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
