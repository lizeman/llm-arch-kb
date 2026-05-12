/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import LayerNormVsRMS from "~/components/figures/LayerNormVsRMS";

afterEach(() => cleanup());

describe("LayerNormVsRMS figure", () => {
  it("renders", () => {
    const { getByTestId } = render(() => <LayerNormVsRMS />);
    expect(getByTestId("layernorm-vs-rms")).toBeTruthy();
  });

  it("has two sliders with aria-valuetext", () => {
    const { container } = render(() => <LayerNormVsRMS />);
    const sliders = container.querySelectorAll("input[type=range]");
    expect(sliders).toHaveLength(2);
    for (const s of sliders) {
      expect(s.getAttribute("aria-valuetext")).toBeTruthy();
    }
  });

  it("updates RMS row but not LayerNorm row when bias slider moves", () => {
    const { container } = render(() => <LayerNormVsRMS />);
    const sliders = container.querySelectorAll("input[type=range]");
    const biasSlider = sliders[0] as HTMLInputElement;
    const before = container.querySelector("svg")!.textContent ?? "";
    fireEvent.input(biasSlider, { target: { value: "1.0" } });
    const after = container.querySelector("svg")!.textContent ?? "";
    expect(after).not.toEqual(before);
  });

  it("bar heights actually change when sliders move", () => {
    const { container } = render(() => <LayerNormVsRMS />);
    const sliders = container.querySelectorAll("input[type=range]");
    const biasSlider = sliders[0] as HTMLInputElement;
    const scaleSlider = sliders[1] as HTMLInputElement;

    const heightsOf = () =>
      Array.from(container.querySelectorAll("rect")).map((r) => r.getAttribute("height"));

    const before = heightsOf();
    fireEvent.input(scaleSlider, { target: { value: "2.5" } });
    const afterScale = heightsOf();
    expect(afterScale).not.toEqual(before);

    fireEvent.input(biasSlider, { target: { value: "1.5" } });
    const afterBias = heightsOf();
    expect(afterBias).not.toEqual(afterScale);
  });
});
