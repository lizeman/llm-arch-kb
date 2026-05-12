/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import PiSqueeze from "~/components/figures/PiSqueeze";

afterEach(() => cleanup());

describe("PiSqueeze figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <PiSqueeze />);
    expect(getByTestId("pi-squeeze")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <PiSqueeze />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes display when slider moves", () => {
    const { container } = render(() => <PiSqueeze />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "16" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
