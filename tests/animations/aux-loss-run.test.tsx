/** @jsxImportSource solid-js */
/**
 * AuxLossFreeBias auto-run animation contract.
 *
 * - Clicking "Run" flips aria-pressed and the button label to "Pause".
 * - Clicking again pauses (aria-pressed=false, label "Run").
 * - Clicking "Reset" returns step counter to 0 and clears bias rectangles.
 *
 * The auto-run timer itself is not exercised here (it would require fake
 * timers and is sensitive to JSDOM scheduling); we test the user-visible
 * state flips that the animation depends on.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import AuxLossFreeBias from "~/components/figures/AuxLossFreeBias";

afterEach(() => cleanup());

function findRunButton(container: HTMLElement): HTMLButtonElement {
  const btns = Array.from(container.querySelectorAll("button"));
  const run = btns.find((b) => /^(Run|Pause)$/i.test((b.textContent ?? "").trim()));
  if (!run) throw new Error("Run/Pause button not found");
  return run as HTMLButtonElement;
}

describe("Animation: AuxLossFreeBias Run/Pause/Reset", () => {
  it("Run toggles aria-pressed and label", () => {
    const { container } = render(() => <AuxLossFreeBias />);
    const run = findRunButton(container as HTMLElement);
    expect(run.getAttribute("aria-pressed")).toBe("false");
    expect(run.textContent?.trim()).toBe("Run");

    fireEvent.click(run);
    expect(run.getAttribute("aria-pressed")).toBe("true");
    expect(run.textContent?.trim()).toBe("Pause");

    fireEvent.click(run);
    expect(run.getAttribute("aria-pressed")).toBe("false");
    expect(run.textContent?.trim()).toBe("Run");
  });

  it("Reset returns step counter to 0", () => {
    const { container, getByText } = render(() => <AuxLossFreeBias />);
    const stepBtn = getByText(/Step \(current: 0\)/) as HTMLButtonElement;
    fireEvent.click(stepBtn);
    fireEvent.click(stepBtn);
    fireEvent.click(stepBtn);
    expect(stepBtn.textContent).toMatch(/current: 3/);

    const reset = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === "Reset",
    ) as HTMLButtonElement;
    fireEvent.click(reset);
    expect(stepBtn.textContent).toMatch(/current: 0/);
  });

  it("gamma slider updates aria-valuetext", () => {
    const { container } = render(() => <AuxLossFreeBias />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "0.123" } });
    expect(slider.getAttribute("aria-valuetext")).toMatch(/0\.123/);
  });
});
