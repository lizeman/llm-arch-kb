/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import SwitchTopK from "~/components/figures/SwitchTopK";

afterEach(() => cleanup());

describe("SwitchTopK figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <SwitchTopK />);
    expect(getByTestId("switch-topk")).toBeTruthy();
  });

  it("has a slider with aria-valuetext", () => {
    const { container } = render(() => <SwitchTopK />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(1);
    expect(sliders[0].getAttribute("aria-valuetext")).toBeTruthy();
  });

  it("changes display when K slider moves", () => {
    const { container } = render(() => <SwitchTopK />);
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(slider, { target: { value: "6" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });
});
