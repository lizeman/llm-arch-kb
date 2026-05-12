/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * LongRoPE search visualization.
 * Compare two per-dimension scaling schedules:
 *   - YaRN closed-form: smooth ramp from 1 (fast band) to s (slow band)
 *   - LongRoPE evolutionary: non-monotone schedule with dimension-specific exceptions
 *
 * Slider for context scale s. Show both as line plots over dimension index.
 * The narrative: closed-form is one point in the search space; evolutionary search can
 * exceed it by finding dimensions where smaller-than-s scaling helps.
 */

const D_H = 128;
const T_TRAIN = 4096;
const BASE = 10000;

function thetaForDim(i: number): number {
  return Math.pow(BASE, (-2 * i) / D_H);
}

function yarnScale(i: number, s: number, rMin = 1, rMax = 32): number {
  const rot = (T_TRAIN * thetaForDim(i)) / (2 * Math.PI);
  let h = 0;
  if (rot <= rMin) h = 1;
  else if (rot >= rMax) h = 0;
  else h = 1 - (rot - rMin) / (rMax - rMin);
  return 1 - h + h / s;
}

// Pseudo-random "evolutionary" perturbation around YaRN baseline. Deterministic for given seed.
function evoPerturbation(i: number, seed: number, magnitude: number): number {
  const h = ((i + 1) * 2654435761) ^ ((seed + 7) * 40503);
  const u = ((h & 0xffff) / 0x10000 - 0.5) * 2;
  return 1 + u * magnitude;
}

export default function LongRopeSearch() {
  const [s, setS] = createSignal(8);
  const [evoSeed, setEvoSeed] = createSignal(0);
  const [evoMag, setEvoMag] = createSignal(0.25);

  const yarnSchedule = createMemo(() => {
    const out: number[] = new Array(D_H / 2);
    for (let i = 0; i < D_H / 2; i++) out[i] = yarnScale(i, s());
    return out;
  });

  const longropeSchedule = createMemo(() => {
    return yarnSchedule().map((v, i) => v * evoPerturbation(i, evoSeed(), evoMag()));
  });

  // Geometry
  const X0 = 60;
  const Y0 = 40;
  const W = 580;
  const H = 240;

  const xPx = (i: number) => X0 + (i / (D_H / 2 - 1)) * W;
  const allMin = 1 / s();
  const allMax = 1.5;
  const yPx = (v: number) => Y0 + H - ((v - allMin) / (allMax - allMin)) * H;

  const polyYarn = createMemo(() =>
    yarnSchedule().map((v, i) => `${xPx(i).toFixed(1)},${yPx(v).toFixed(1)}`).join(" "),
  );
  const polyLong = createMemo(() =>
    longropeSchedule().map((v, i) => `${xPx(i).toFixed(1)},${yPx(v).toFixed(1)}`).join(" "),
  );

  return (
    <figure class="figure" data-testid="long-rope-search">
      <svg viewBox="0 0 700 380" role="img" aria-label="LongRoPE evolutionary search vs YaRN closed-form">
        <title>
          YaRN's smooth closed-form schedule (gray) compared to LongRoPE's per-dimension
          evolutionary schedule (blue). Drag the seed to see different evolutionary samples;
          drag the magnitude to see how much LongRoPE diverges from YaRN.
        </title>

        <text
          x={X0 + W / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Per-dimension RoPE rescaling factor (1 = unchanged, 1/s = full PI scale)
        </text>

        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="#e3e3dc" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke="#e3e3dc" />

        {/* y-axis labels */}
        <text x={X0 - 6} y={Y0 + 6} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          {allMax.toFixed(2)}
        </text>
        <text x={X0 - 6} y={Y0 + H + 4} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          {allMin.toFixed(3)}
        </text>

        {/* Reference line at 1.0 */}
        <line x1={X0} y1={yPx(1)} x2={X0 + W} y2={yPx(1)} stroke="#1a4f7a" stroke-width="0.7" stroke-dasharray="3 3" />
        <text x={X0 + 4} y={yPx(1) - 4} font-family="var(--mono)" font-size="9" fill="#1a4f7a" opacity="0.7">
          factor = 1
        </text>

        {/* YaRN curve */}
        <polyline points={polyYarn()} fill="none" stroke="#8a8a85" stroke-width="2" />
        {/* LongRoPE curve */}
        <polyline points={polyLong()} fill="none" stroke="#1a4f7a" stroke-width="2" />

        {/* Legend */}
        <g transform={`translate(${X0 + W - 200}, ${Y0 + 10})`}>
          <line x1="0" y1="0" x2="20" y2="0" stroke="#8a8a85" stroke-width="2" />
          <text x="26" y="4" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            YaRN closed-form
          </text>
          <line x1="0" y1="16" x2="20" y2="16" stroke="#1a4f7a" stroke-width="2" />
          <text x="26" y="20" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            LongRoPE evolutionary
          </text>
        </g>

        <text x={X0 + W / 2} y={Y0 + H + 22} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          dimension pair index i
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Context scale s</span>
          <input
            type="range"
            min={1}
            max={64}
            step={0.5}
            value={s()}
            onInput={(e) => setS(+e.currentTarget.value)}
            aria-valuetext={`context scale ${s().toFixed(1)}; targets ${(s() * T_TRAIN).toLocaleString()} from base ${T_TRAIN.toLocaleString()}`}
          />
          <span class="value">{s().toFixed(1)}×</span>
        </label>
        <label>
          <span>Evolutionary seed</span>
          <input
            type="range"
            min={0}
            max={31}
            step={1}
            value={evoSeed()}
            onInput={(e) => setEvoSeed(+e.currentTarget.value)}
            aria-valuetext={`evolutionary search seed ${evoSeed()}`}
          />
          <span class="value">{evoSeed()}</span>
        </label>
        <label>
          <span>Search magnitude</span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={evoMag()}
            onInput={(e) => setEvoMag(+e.currentTarget.value)}
            aria-valuetext={`evolutionary search perturbation magnitude ${evoMag().toFixed(2)}`}
          />
          <span class="value">{evoMag().toFixed(2)}</span>
        </label>
      </div>

      <figcaption>
        YaRN's smooth gray curve is one point in a much larger search space. LongRoPE evaluates
        many candidate <em>per-dimension</em> schedules (perturbations of the YaRN baseline) and
        keeps the best on a held-out long-context evaluation. The reported result: schedules
        that give <em>some</em> dimensions even smaller scaling than YaRN does (and others
        slightly larger), reaching 2M+ token context windows where YaRN saturates around 128K.
      </figcaption>
    </figure>
  );
}
