/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * RoPE base sweep: visualize the per-dimension rotation rate θ_i = b^{-2i/d_h} as a function
 * of the base b. Bigger base = slower-rotating high-index dims = better behaved at long
 * contexts (the YaRN / NTK-aware-scaling intuition).
 *
 * Show two things:
 *   - The full curve of θ_i vs i for the current base
 *   - The "rotation count" each dim completes across a fixed training context T
 *     (a dim is 'fast' if it makes >= 1 full rotation, 'slow' otherwise)
 */

const D_H = 128;
const T = 4096; // assumed training context

function thetaForDim(i: number, base: number): number {
  return Math.pow(base, (-2 * i) / D_H);
}

export default function RopeBaseSweep() {
  const [logBase, setLogBase] = createSignal(4); // 10^logBase, default 10000

  const base = createMemo(() => Math.pow(10, logBase()));

  // Per-dim θ and rotation count over T positions
  const data = createMemo(() => {
    const out: { i: number; theta: number; rotations: number }[] = [];
    for (let i = 0; i < D_H / 2; i++) {
      const th = thetaForDim(i, base());
      out.push({ i, theta: th, rotations: (T * th) / (2 * Math.PI) });
    }
    return out;
  });

  // Geometry
  const X0 = 60;
  const Y0 = 40;
  const W = 580;
  const H = 200;

  const xPx = (i: number) => X0 + (i / (D_H / 2 - 1)) * W;
  // log-scale on rotations for readability
  const yPx = (rot: number) => {
    const log = Math.log10(Math.max(rot, 1e-6));
    // Range: 1e-6 to 1e3 = log -6 to 3 → scale to H
    const yNorm = (log + 6) / 9;
    return Y0 + H - yNorm * H;
  };

  const polyline = createMemo(() =>
    data()
      .map((d) => `${xPx(d.i).toFixed(1)},${yPx(d.rotations).toFixed(1)}`)
      .join(" "),
  );

  // Threshold lines
  const yOne = yPx(1);
  const yTen = yPx(10);

  const fastCount = createMemo(() => data().filter((d) => d.rotations >= 1).length);
  const slowCount = createMemo(() => data().filter((d) => d.rotations < 1).length);

  return (
    <figure class="figure" data-testid="rope-base-sweep">
      <svg viewBox="0 0 660 320" role="img" aria-label="RoPE base frequency band sweep">
        <title>
          For each dimension pair i, plot the number of full rotations completed over a 4K
          training context. Higher base shifts more dimensions to the slow regime — they no
          longer span the unit circle within training.
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
          Rotations completed by dimension pair i over T = {T.toLocaleString()} positions (base{" "}
          {Math.round(base()).toLocaleString()})
        </text>

        {/* Axes */}
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke="#e3e3dc" />
        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="#e3e3dc" />

        {/* y-axis log labels */}
        {[1e-3, 1e-1, 1, 1e1, 1e3].map((v) => {
          // Format as plain "1", "10", "0.1" etc rather than letting the previous
          // replace() chain produce "1e" for v = 1 (when toExponential returns "1e+0").
          let label: string;
          if (v === 1) label = "1";
          else if (v >= 1) label = `10^${Math.round(Math.log10(v))}`;
          else label = `10^${Math.round(Math.log10(v))}`;
          return (
            <g>
              <line x1={X0} y1={yPx(v)} x2={X0 + W} y2={yPx(v)} stroke="#e3e3dc" stroke-dasharray="2 4" />
              <text x={X0 - 6} y={yPx(v) + 3} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
                {label}
              </text>
            </g>
          );
        })}

        {/* Highlight: 1-rotation cutoff */}
        <line x1={X0} y1={yOne} x2={X0 + W} y2={yOne} stroke="#1a4f7a" stroke-width="1" stroke-dasharray="4 3" />
        <text x={X0 + W + 4} y={yOne + 4} font-family="var(--mono)" font-size="10" fill="#1a4f7a">
          1 rot
        </text>

        {/* Curve */}
        <polyline points={polyline()} fill="none" stroke="#1a4f7a" stroke-width="2" />

        {/* Annotation regions */}
        <text x={X0 + 12} y={Y0 + 16} font-family="var(--mono)" font-size="10" fill="#5a5a55">
          fast (≥ 1 full rotation)
        </text>
        <text x={X0 + 12} y={Y0 + H - 8} font-family="var(--mono)" font-size="10" fill="#5a5a55">
          slow (extrapolation risk)
        </text>

        <text
          x={X0 + W / 2}
          y={Y0 + H + 22}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          dimension pair index i (0 = fastest, {D_H / 2 - 1} = slowest)
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>RoPE base (log10)</span>
          <input
            type="range"
            aria-label="RoPE base (log10)"
            min={2}
            max={7}
            step={0.05}
            value={logBase()}
            onInput={(e) => setLogBase(+e.currentTarget.value)}
            aria-valuetext={`RoPE base 10 to the ${logBase().toFixed(2)}, approximately ${Math.round(base()).toLocaleString()}`}
          />
          <span class="value">{Math.round(base()).toLocaleString()}</span>
        </label>
      </div>

      <figcaption>
        At base 10000 (the original RoPE choice), about half the dimensions complete at least one
        full rotation across the training window and the rest are slower. As you raise the base
        toward Llama 3.1's scaled value (~5×10⁵), more dimensions migrate into the slow regime —
        they no longer span the unit circle within the training context, so they have less
        position information to lean on but more headroom to extrapolate. Currently{" "}
        <strong>{fastCount()}</strong> fast / <strong>{slowCount()}</strong> slow dims.
      </figcaption>
    </figure>
  );
}
