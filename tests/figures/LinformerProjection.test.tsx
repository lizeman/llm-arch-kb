/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import LinformerProjection from "~/components/figures/LinformerProjection";

afterEach(() => cleanup());

describe("LinformerProjection figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <LinformerProjection />);
    expect(getByTestId("linformer-projection")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <LinformerProjection />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes display when k slider moves", () => {
    const { container } = render(() => <LinformerProjection />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "32" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
