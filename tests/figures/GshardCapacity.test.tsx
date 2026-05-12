/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import GshardCapacity from "~/components/figures/GshardCapacity";

afterEach(() => cleanup());

describe("GshardCapacity figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <GshardCapacity />);
    expect(getByTestId("gshard-capacity")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <GshardCapacity />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes drop count when capacity slider moves", () => {
    const { container } = render(() => <GshardCapacity />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "0.5" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
