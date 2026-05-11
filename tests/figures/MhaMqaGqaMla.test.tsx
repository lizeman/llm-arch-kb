/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import MhaMqaGqaMla from "~/components/figures/MhaMqaGqaMla";

afterEach(() => cleanup());

describe("MhaMqaGqaMla figure", () => {
  it("renders with a default GQA configuration", () => {
    const { getByTestId } = render(() => <MhaMqaGqaMla />);
    const fig = getByTestId("mha-mqa-gqa-mla");
    expect(fig).toBeTruthy();
  });

  it("updates KV cache size when G changes", () => {
    const { container } = render(() => <MhaMqaGqaMla />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders.length).toBeGreaterThanOrEqual(1);
    const groupSlider = sliders[0]! as HTMLInputElement;
    fireEvent.input(groupSlider, { target: { value: "1" } });
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/MQA/);
  });

  it("describes MLA mode when latent toggle is on", () => {
    const { container } = render(() => <MhaMqaGqaMla />);
    const checkbox = container.querySelector("input[type=checkbox]") as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox);
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toMatch(/MLA/);
    expect(svg.textContent).toMatch(/c_KV/);
  });
});
