/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import RopeBaseSweep from "~/components/figures/RopeBaseSweep";

afterEach(() => cleanup());

describe("RopeBaseSweep figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <RopeBaseSweep />);
    expect(getByTestId("rope-base-sweep")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <RopeBaseSweep />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes display when base slider moves", () => {
    const { container } = render(() => <RopeBaseSweep />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "6.0" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
