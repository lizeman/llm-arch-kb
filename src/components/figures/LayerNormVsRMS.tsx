/** @jsxImportSource solid-js */
import { createMemo, createSignal, Index } from "solid-js";

/**
 * Visualizer for the difference between LayerNorm and RMSNorm on a small input vector.
 * Drag the bias slider to add a constant offset to every coordinate; LayerNorm subtracts the
 * mean before dividing, so the offset disappears, while RMSNorm just divides by RMS, so the
 * normalized output shifts. The point: RMSNorm drops the mean-centering step.
 */

const D = 8;
const BASE_VEC: number[] = [-1.4, 0.3, 1.1, -0.6, 0.9, -0.2, 1.7, -0.8];

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function variance(xs: number[], mu: number): number {
  return xs.reduce((a, b) => a + (b - mu) * (b - mu), 0) / xs.length;
}
function rms(xs: number[]): number {
  return Math.sqrt(xs.reduce((a, b) => a + b * b, 0) / xs.length);
}

export default function LayerNormVsRMS() {
  const [bias, setBias] = createSignal(0);
  const [scale, setScale] = createSignal(1);

  const vec = createMemo(() => BASE_VEC.map((x) => x * scale() + bias()));

  const ln = createMemo(() => {
    const v = vec();
    const mu = mean(v);
    const sigma = Math.sqrt(variance(v, mu) + 1e-6);
    return v.map((x) => (x - mu) / sigma);
  });

  const rmsn = createMemo(() => {
    const v = vec();
    const meanSquare = v.reduce((a, b) => a + b * b, 0) / v.length;
    const r = Math.sqrt(meanSquare + 1e-6);
    return v.map((x) => x / r);
  });

  const stats = createMemo(() => {
    const v = vec();
    const mu = mean(v);
    return {
      mu,
      sigma: Math.sqrt(variance(v, mu) + 1e-6),
      rmsv: rms(v),
    };
  });

  // Bar chart geometry
  const X0 = 60;
  const Y0 = 40;
  const COL_W = 70;
  const ROW_H = 100;
  const BAR_W = 22;
  const SCALE_PX = 40;

  function Row(props: { values: () => number[]; yCenter: number; color: string; label: string }) {
    return (
      <g>
        <text
          x={X0 - 12}
          y={props.yCenter + 4}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="11"
          fill="#5a5a55"
        >
          {props.label}
        </text>
        <line
          x1={X0}
          y1={props.yCenter}
          x2={X0 + D * COL_W}
          y2={props.yCenter}
          stroke="#e3e3dc"
          stroke-width="1"
        />
        <Index each={props.values()}>
          {(vAccessor, i) => {
            const x = X0 + i * COL_W + (COL_W - BAR_W) / 2;
            const h = () => Math.abs(vAccessor()) * SCALE_PX;
            const y = () => (vAccessor() >= 0 ? props.yCenter - h() : props.yCenter);
            const labelY = () => (vAccessor() >= 0 ? props.yCenter + 14 : props.yCenter + h() + 12);
            return (
              <g>
                <rect x={x} y={y()} width={BAR_W} height={h()} fill={props.color} opacity="0.85" />
                <text
                  x={x + BAR_W / 2}
                  y={labelY()}
                  text-anchor="middle"
                  font-family="var(--mono)"
                  font-size="9"
                  fill="#5a5a55"
                >
                  {vAccessor().toFixed(2)}
                </text>
              </g>
            );
          }}
        </Index>
      </g>
    );
  }

  return (
    <figure class="figure" data-testid="layernorm-vs-rms">
      <svg viewBox="0 0 660 380" role="img" aria-label="LayerNorm vs RMSNorm comparison">
        <title>
          LayerNorm centers then divides by std; RMSNorm just divides by RMS. Adding a constant
          bias to the input shifts RMSNorm's output but not LayerNorm's.
        </title>

        <text
          x={X0 + (D * COL_W) / 2}
          y={Y0 - 10}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Input vector x (8 dims)
        </text>
        <Row values={vec} yCenter={Y0 + ROW_H / 2} color="#5a5a55" label="x" />

        <text
          x={X0 + (D * COL_W) / 2}
          y={Y0 + ROW_H + 18}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          LayerNorm: (x − μ) / σ
        </text>
        <Row values={ln} yCenter={Y0 + ROW_H + 18 + ROW_H / 2} color="#1a4f7a" label="LN" />

        <text
          x={X0 + (D * COL_W) / 2}
          y={Y0 + 2 * ROW_H + 36}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          RMSNorm: x / RMS(x)
        </text>
        <Row values={rmsn} yCenter={Y0 + 2 * ROW_H + 36 + ROW_H / 2} color="#1a4f7a" label="RMS" />
      </svg>

      <div class="controls">
        <label>
          <span>Constant bias added to every dim</span>
          <input
            type="range"
            aria-label="Constant bias added to every dim"
            min={-2}
            max={2}
            step={0.05}
            value={bias()}
            onInput={(e) => setBias(+e.currentTarget.value)}
            aria-valuetext={`bias ${bias().toFixed(2)} added to every input coordinate`}
          />
          <span class="value">{bias().toFixed(2)}</span>
        </label>
        <label>
          <span>Multiplicative scale</span>
          <input
            type="range"
            aria-label="Multiplicative scale"
            min={0.1}
            max={3}
            step={0.05}
            value={scale()}
            onInput={(e) => setScale(+e.currentTarget.value)}
            aria-valuetext={`scale ${scale().toFixed(2)} applied to every coordinate`}
          />
          <span class="value">{scale().toFixed(2)}</span>
        </label>
      </div>

      <figcaption>
        Drag the <strong>bias</strong> slider. LayerNorm's output is unchanged — the
        mean-subtraction step removes any constant. RMSNorm's output shifts visibly because it
        only divides by RMS. μ = {stats().mu.toFixed(2)}, σ = {stats().sigma.toFixed(2)},
        RMS = {stats().rmsv.toFixed(2)}.
      </figcaption>
    </figure>
  );
}
