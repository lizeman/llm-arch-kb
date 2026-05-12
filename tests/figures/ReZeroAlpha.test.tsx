/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import ReZeroAlpha from "~/components/figures/ReZeroAlpha";

afterEach(() => cleanup());

describe("ReZeroAlpha figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <ReZeroAlpha />);
    expect(getByTestId("rezero-alpha")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <ReZeroAlpha />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes display when alpha slider moves", () => {
    const { container } = render(() => <ReZeroAlpha />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "0.5" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
