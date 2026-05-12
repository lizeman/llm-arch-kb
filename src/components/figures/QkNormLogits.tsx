/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * QK-Norm logit blow-up demo.
 * Generate a fixed key matrix K (8 keys, 16-dim) and a single query q.
 * Inject an outlier into one coordinate of q via a slider.
 * Plot the resulting attention scores (softmax over q·k_i / sqrt(d)) for two cases:
 *   - Without QK-Norm: raw q, k
 *   - With QK-Norm: q and k both RMSNormed to unit RMS before the dot product
 * Show how an outlier collapses the un-normalized softmax to a one-hot, while QK-Norm holds.
 */

const D = 16;
const N_KEYS = 8;

// Deterministic pseudo-random keys (seeded by index) so the figure is stable across renders.
function makeKeys(): number[][] {
  const keys: number[][] = [];
  for (let i = 0; i < N_KEYS; i++) {
    const k: number[] = [];
    for (let j = 0; j < D; j++) {
      k.push(Math.sin(i * 7 + j * 3.1) * 0.7 + Math.cos(i * 1.7 + j) * 0.3);
    }
    keys.push(k);
  }
  return keys;
}

const KEYS = makeKeys();
const Q_BASE: number[] = Array.from({ length: D }, (_, j) =>
  Math.sin(11 + j * 2.3) * 0.8 + Math.cos(j * 0.7) * 0.2,
);

function rms(v: number[]): number {
  return Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length);
}
function normalize(v: number[]): number[] {
  const r = rms(v) + 1e-6;
  return v.map((x) => x / r);
}
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

export default function QkNormLogits() {
  const [outlier, setOutlier] = createSignal(0);
  const [outlierDim, setOutlierDim] = createSignal(0);

  const q = createMemo(() => {
    const v = Q_BASE.slice();
    v[outlierDim()] += outlier();
    return v;
  });

  const rawLogits = createMemo(() => KEYS.map((k) => dot(q(), k) / Math.sqrt(D)));
  const rawScores = createMemo(() => softmax(rawLogits()));

  const normedLogits = createMemo(() => {
    const qn = normalize(q());
    return KEYS.map((k) => dot(qn, normalize(k)) / Math.sqrt(D));
  });
  const normedScores = createMemo(() => softmax(normedLogits()));

  const X0 = 70;
  const Y0 = 50;
  const COL_W = 60;
  const ROW_H = 130;
  const BAR_W = 28;
  // Cap bar height to leave room for the percentage label above (~14px) and the row title.
  const BAR_H_MAX = 88;

  function renderRow(scores: number[], yCenter: number, color: string, label: string) {
    return (
      <g>
        <text
          x={X0 - 12}
          y={yCenter - 4}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="11"
          fill="#5a5a55"
        >
          {label}
        </text>
        <line
          x1={X0}
          y1={yCenter}
          x2={X0 + N_KEYS * COL_W}
          y2={yCenter}
          stroke="#e3e3dc"
        />
        {scores.map((s, i) => {
          const x = X0 + i * COL_W + (COL_W - BAR_W) / 2;
          const h = s * BAR_H_MAX;
          return (
            <g>
              <rect x={x} y={yCenter - h} width={BAR_W} height={h} fill={color} opacity="0.85" />
              <text
                x={x + BAR_W / 2}
                y={yCenter + 14}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#5a5a55"
              >
                k{i}
              </text>
              <text
                x={x + BAR_W / 2}
                y={yCenter - h - 4}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#5a5a55"
              >
                {(s * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  const rawMaxLogit = createMemo(() => Math.max(...rawLogits().map(Math.abs)));
  const normedMaxLogit = createMemo(() => Math.max(...normedLogits().map(Math.abs)));

  return (
    <figure class="figure" data-testid="qk-norm-logits">
      <svg viewBox="0 0 660 380" role="img" aria-label="QK-Norm logit blow-up demonstration">
        <title>
          Inject an outlier into one coordinate of the query. Without QK-Norm, the softmax
          collapses to a single key. With QK-Norm, the distribution stays well-behaved.
        </title>

        <text
          x={X0 + (N_KEYS * COL_W) / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Without QK-Norm — softmax over q · k_i / √d
        </text>
        {renderRow(rawScores(), Y0 + ROW_H / 2 + 30, "#5a5a55", "raw")}

        <text
          x={X0 + (N_KEYS * COL_W) / 2}
          y={Y0 + ROW_H + 30}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          With QK-Norm — RMSNorm(q) · RMSNorm(k_i) / √d
        </text>
        {renderRow(normedScores(), Y0 + ROW_H + 30 + ROW_H / 2 + 30, "#1a4f7a", "norm")}
      </svg>

      <div class="controls">
        <label>
          <span>Outlier magnitude added to q[{outlierDim()}]</span>
          <input
            type="range"
            aria-label={`Outlier magnitude added to q[${outlierDim()}]`}
            min={0}
            max={20}
            step={0.1}
            value={outlier()}
            onInput={(e) => setOutlier(+e.currentTarget.value)}
            aria-valuetext={`outlier magnitude ${outlier().toFixed(1)} added to query coordinate ${outlierDim()}`}
          />
          <span class="value">{outlier().toFixed(1)}</span>
        </label>
        <label>
          <span>Coordinate to perturb</span>
          <input
            type="range"
            aria-label="Coordinate to perturb"
            min={0}
            max={D - 1}
            step={1}
            value={outlierDim()}
            onInput={(e) => setOutlierDim(+e.currentTarget.value)}
            aria-valuetext={`outlier injected into query coordinate ${outlierDim()}`}
          />
          <span class="value">{outlierDim()}</span>
        </label>
      </div>

      <figcaption>
        Drag <strong>outlier magnitude</strong> upward. The raw softmax (top) collapses to a
        single key as the outlier amplifies the dot product on whichever key happens to align
        with the perturbed coordinate. The QK-Normed softmax (bottom) stays bounded because both
        q and k are rescaled to unit RMS before the dot product. Raw max-|logit| ={" "}
        {rawMaxLogit().toFixed(2)}; QK-Norm max-|logit| = {normedMaxLogit().toFixed(2)}.
      </figcaption>
    </figure>
  );
}
