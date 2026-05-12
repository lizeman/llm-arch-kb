/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import LandmarkAttention from "~/components/figures/LandmarkAttention";

afterEach(() => cleanup());

describe("LandmarkAttention figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <LandmarkAttention />);
    expect(getByTestId("landmark-attention")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <LandmarkAttention />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when B slider moves", () => {
    const { container } = render(() => <LandmarkAttention />);
    const slider = container.querySelectorAll("input[type=range]")[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "32" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
