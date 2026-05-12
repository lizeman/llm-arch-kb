/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import LongnetDilated from "~/components/figures/LongnetDilated";

afterEach(() => cleanup());

describe("LongnetDilated figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <LongnetDilated />);
    expect(getByTestId("longnet-dilated")).toBeTruthy();
  });

  it("has three sliders with aria-valuetext", () => {
    const { container } = render(() => <LongnetDilated />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(3);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when H slider moves", () => {
    const { container } = render(() => <LongnetDilated />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "6" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
