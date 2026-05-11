/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import MoeRouting from "~/components/figures/MoeRouting";

afterEach(() => cleanup());

describe("MoeRouting figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <MoeRouting />);
    expect(getByTestId("moe-routing")).toBeTruthy();
  });

  it("has accessible sliders", () => {
    const { container } = render(() => <MoeRouting />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders.length).toBeGreaterThanOrEqual(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates top-K readout", () => {
    const { container } = render(() => <MoeRouting />);
    const sliders = container.querySelectorAll("input[type=range]");
    const kSlider = sliders[0] as HTMLInputElement;
    fireEvent.input(kSlider, { target: { value: "4" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/top-K = 4/);
  });

  it("toggles shared expert via checkbox — heading text reflects the state", () => {
    const { container } = render(() => <MoeRouting />);
    const heading = container.querySelector("svg text")!;
    expect(heading.textContent).toMatch(/1 shared expert/);
    const checkbox = container.querySelector("input[type=checkbox]") as HTMLInputElement;
    fireEvent.click(checkbox);
    const headingAfter = container.querySelector("svg text")!;
    expect(headingAfter.textContent).not.toMatch(/1 shared expert/);
  });
});
