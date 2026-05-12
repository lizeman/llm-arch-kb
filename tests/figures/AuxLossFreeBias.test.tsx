/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import AuxLossFreeBias from "~/components/figures/AuxLossFreeBias";

afterEach(() => cleanup());

describe("AuxLossFreeBias figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <AuxLossFreeBias />);
    expect(getByTestId("aux-loss-free-bias")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <AuxLossFreeBias />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("increments step counter on Step click", () => {
    const { container, getByText } = render(() => <AuxLossFreeBias />);
    const stepBtn = getByText(/Step \(current: 0\)/);
    fireEvent.click(stepBtn);
    const after = container.querySelector("button")!.textContent ?? "";
    expect(after).toMatch(/current: 1/);
  });
});
