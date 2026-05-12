/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import NoPeOrder from "~/components/figures/NoPeOrder";

afterEach(() => cleanup());

describe("NoPeOrder figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <NoPeOrder />);
    expect(getByTestId("nope-order")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <NoPeOrder />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes accessible-keys count when slider moves", () => {
    const { container } = render(() => <NoPeOrder />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "20" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/Causal: 21 accessible keys/);
  });
});
