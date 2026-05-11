/** @jsxImportSource solid-js */
import { createMemo, createSignal, For } from "solid-js";

/**
 * RoPE position-dependent rotation visualizer.
 *
 * Shows how the angle applied to a single (2i, 2i+1) pair of Q coordinates depends on the
 * rotation rate θ_i = b^{-2i/d_h} and on the absolute position t. The user manipulates the
 * dimension index i and the position t and watches the resulting rotation.
 *
 * Plan §11.4 contract: SVG viewBox, ≥44px touch targets, aria-valuetext on sliders,
 * prefers-reduced-motion via tokens.css, <=400 lines.
 */

const D_H = 128; // head dim
const BASE = 10000;
const MAX_POS = 8192;

function thetaForDim(i: number): number {
  // θ_i = base^{-2i/d_h}; clamp to first half (pair index).
  return Math.pow(BASE, (-2 * i) / D_H);
}

export default function RopeRotor() {
  const [pos, setPos] = createSignal(64);
  const [pairIdx, setPairIdx] = createSignal(0);

  const theta = createMemo(() => thetaForDim(pairIdx()));
  const angle = createMemo(() => pos() * theta());
  const wrapped = createMemo(() => ((angle() % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
  const fullRotations = createMemo(() => Math.floor(angle() / (2 * Math.PI)));

  // Vector geometry: unit circle in left half.
  const cx = 170;
  const cy = 180;
  const r = 110;

  const tipX = createMemo(() => cx + r * Math.cos(wrapped()));
  const tipY = createMemo(() => cy - r * Math.sin(wrapped()));

  // Right-panel chart: angle vs position for current dimension, swept from 0 to MAX_POS.
  const sweep = createMemo(() => {
    const points: string[] = [];
    const N = 200;
    const baseX = 380;
    const chartW = 300;
    const chartY = 60;
    const chartH = 240;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * MAX_POS;
      const a = (t * theta()) % (2 * Math.PI);
      const x = baseX + (i / N) * chartW;
      const y = chartY + chartH - (a / (2 * Math.PI)) * chartH;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(" ");
  });

  const dotX = createMemo(() => 380 + (pos() / MAX_POS) * 300);
  const dotY = createMemo(() => 60 + 240 - (wrapped() / (2 * Math.PI)) * 240);

  return (
    <figure class="figure" data-testid="rope-rotor">
      <svg viewBox="0 0 720 360" role="img" aria-label="Rotary position embedding angle visualization">
        <title>Rotation of a Q vector by RoPE. Left: unit circle showing the rotated vector. Right: rotation angle as a function of position for the selected dimension pair.</title>

        {/* LEFT: unit circle */}
        <g>
          <text x={cx} y={32} text-anchor="middle"
            font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
            Q vector at position t = {pos()}
          </text>

          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e3e3dc" stroke-width="1" />
          <line x1={cx - r - 10} y1={cy} x2={cx + r + 10} y2={cy} stroke="#e3e3dc" stroke-width="1" />
          <line x1={cx} y1={cy - r - 10} x2={cx} y2={cy + r + 10} stroke="#e3e3dc" stroke-width="1" />

          {/* Original vector at angle 0 — light reference */}
          <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#8a8a85" stroke-width="1.5" stroke-dasharray="3 3" />
          <text x={cx + r + 4} y={cy + 14} font-family="var(--mono)" font-size="10" fill="#8a8a85">t=0</text>

          {/* Rotated vector */}
          <line x1={cx} y1={cy} x2={tipX()} y2={tipY()} stroke="#1a4f7a" stroke-width="2.5" />
          <circle cx={tipX()} cy={tipY()} r={5} fill="#1a4f7a" />

          {/* Arc showing angle */}
          <path
            d={`M ${cx + 28} ${cy} A 28 28 0 ${wrapped() > Math.PI ? 1 : 0} 0 ${cx + 28 * Math.cos(wrapped())} ${cy - 28 * Math.sin(wrapped())}`}
            fill="none" stroke="#1a4f7a" stroke-width="1.5" opacity="0.6"
          />

          <text x={cx} y={cy + r + 30} text-anchor="middle"
            font-family="var(--mono)" font-size="11" fill="#5a5a55">
            angle = {(wrapped() * 180 / Math.PI).toFixed(1)}°
            {fullRotations() > 0 ? ` (+${fullRotations()}×360°)` : ""}
          </text>
        </g>

        {/* RIGHT: angle vs position */}
        <g>
          <text x={530} y={32} text-anchor="middle"
            font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
            Angle (wrapped) over positions 0..{MAX_POS.toLocaleString()}
          </text>

          <line x1={380} y1={60} x2={380} y2={300} stroke="#e3e3dc" stroke-width="1" />
          <line x1={380} y1={300} x2={680} y2={300} stroke="#e3e3dc" stroke-width="1" />

          <text x={374} y={66} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">2π</text>
          <text x={374} y={303} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">0</text>
          <text x={380} y={316} text-anchor="start" font-family="var(--mono)" font-size="9" fill="#8a8a85">0</text>
          <text x={680} y={316} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">{MAX_POS.toLocaleString()}</text>

          <polyline points={sweep()} fill="none" stroke="#1a4f7a" stroke-width="1.5" opacity="0.75" />
          <circle cx={dotX()} cy={dotY()} r={4} fill="#1a4f7a" />

          <text x={530} y={336} text-anchor="middle"
            font-family="var(--mono)" font-size="11" fill="#5a5a55">
            θ_i = {theta().toExponential(2)}  ({fullRotations()} full rotations across the sweep)
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Position t</span>
          <input
            type="range"
            min={0}
            max={MAX_POS}
            step={1}
            value={pos()}
            onInput={(e) => setPos(+e.currentTarget.value)}
            aria-valuetext={`position ${pos()}`}
          />
          <span class="value">{pos().toLocaleString()}</span>
        </label>
        <label>
          <span>Dimension pair i</span>
          <input
            type="range"
            min={0}
            max={D_H / 2 - 1}
            step={1}
            value={pairIdx()}
            onInput={(e) => setPairIdx(+e.currentTarget.value)}
            aria-valuetext={`dimension pair index ${pairIdx()} of ${D_H / 2 - 1}`}
          />
          <span class="value">{pairIdx()}</span>
        </label>
      </div>

      <figcaption>
        <strong>i = 0</strong> rotates fast — the vector spins through the unit circle in just a
        few positions. <strong>i = 63</strong> (the slowest pair at <code>d_h = 128</code>, base
        10000) barely moves across the full 8K context. The relative phase between any two
        positions is what attention reads off.
      </figcaption>
    </figure>
  );
}
