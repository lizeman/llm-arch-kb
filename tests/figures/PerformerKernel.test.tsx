/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import PerformerKernel from "~/components/figures/PerformerKernel";

afterEach(() => cleanup());

describe("PerformerKernel figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <PerformerKernel />);
    expect(getByTestId("performer-kernel")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <PerformerKernel />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when N slider moves", () => {
    const { container } = render(() => <PerformerKernel />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "320" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
