/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import BigBirdSparse from "~/components/figures/BigBirdSparse";

afterEach(() => cleanup());

describe("BigBirdSparse figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <BigBirdSparse />);
    expect(getByTestId("bigbird-sparse")).toBeTruthy();
  });

  it("has three sliders with aria-valuetext", () => {
    const { container } = render(() => <BigBirdSparse />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(3);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when W slider moves", () => {
    const { container } = render(() => <BigBirdSparse />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "10" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
