/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import SwiGluCurves from "~/components/figures/SwiGluCurves";

afterEach(() => cleanup());

describe("SwiGluCurves figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <SwiGluCurves />);
    expect(getByTestId("swiglu-curves")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <SwiGluCurves />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("updates beta display when slider moves", () => {
    const { container } = render(() => <SwiGluCurves />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "3.5" } });
    const value = container.querySelector("label .value");
    expect(value!.textContent).toMatch(/3\.5/);
  });
});
