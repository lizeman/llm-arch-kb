/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import MemorizingKnn from "~/components/figures/MemorizingKnn";

afterEach(() => cleanup());

describe("MemorizingKnn figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <MemorizingKnn />);
    expect(getByTestId("memorizing-knn")).toBeTruthy();
  });

  it("has four sliders with aria-valuetext", () => {
    const { container } = render(() => <MemorizingKnn />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(4);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when K slider moves", () => {
    const { container } = render(() => <MemorizingKnn />);
    const slider = container.querySelectorAll("input[type=range]")[1] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "20" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
