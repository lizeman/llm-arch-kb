/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import ResidualVsHc from "~/components/figures/ResidualVsHc";

afterEach(() => cleanup());

describe("ResidualVsHc figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <ResidualVsHc />);
    expect(getByTestId("residual-vs-hc")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <ResidualVsHc />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when streams slider moves", () => {
    const { container } = render(() => <ResidualVsHc />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "8" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
