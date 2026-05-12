/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import QkNormLogits from "~/components/figures/QkNormLogits";

afterEach(() => cleanup());

describe("QkNormLogits figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <QkNormLogits />);
    expect(getByTestId("qk-norm-logits")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <QkNormLogits />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("changes display when outlier slider moves", () => {
    const { container } = render(() => <QkNormLogits />);
    const sliders = container.querySelectorAll("input[type=range]");
    const outlierSlider = sliders[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(outlierSlider, { target: { value: "10.0" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
