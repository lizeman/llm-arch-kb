/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * YaRN three-band visualization.
 * For each RoPE dimension pair i, compute:
 *   - rotations completed across the original training window T_train (rot_i = T_train * theta_i / 2pi)
 *   - YaRN ramp h_i in [0, 1]: 0 if fast (rot >= r_max), 1 if slow (rot <= r_min), smooth in between
 *   - Effective theta after YaRN scaling factor s = T_new / T_train:
 *       theta_i' = theta_i * (1 - h_i) + (theta_i / s) * h_i
 */

const D_H = 128;
const BASE = 10000;
const T_TRAIN = 4096;

function thetaForDim(i: number): number {
  return Math.pow(BASE, (-2 * i) / D_H);
}

export default function YarnBands() {
  const [scaleS, setScaleS] = createSignal(8); // T_new / T_train
  const [rMin, setRMin] = createSignal(1);
  const [rMax, setRMax] = createSignal(32);

  const data = createMemo(() => {
    const out: { i: number; theta: number; rotations: number; h: number; thetaPrime: number }[] = [];
    const s = scaleS();
    for (let i = 0; i < D_H / 2; i++) {
      const theta = thetaForDim(i);
      const rot = (T_TRAIN * theta) / (2 * Math.PI);
      let h = 0;
      if (rot <= rMin()) h = 1;
      else if (rot >= rMax()) h = 0;
      else h = 1 - (rot - rMin()) / (rMax() - rMin());
      const thetaPrime = theta * (1 - h) + (theta / s) * h;
      out.push({ i, theta, rotations: rot, h, thetaPrime });
    }
    return out;
  });

  const fastN = createMemo(() => data().filter((d) => d.h === 0).length);
  const slowN = createMemo(() => data().filter((d) => d.h === 1).length);
  const midN = createMemo(() => data().filter((d) => d.h > 0 && d.h < 1).length);

  // Geometry
  const X0 = 60;
  const Y0 = 40;
  const W = 580;
  const H = 200;

  const xPx = (i: number) => X0 + (i / (D_H / 2 - 1)) * W;
  const yPxRamp = (h: number) => Y0 + H - h * H;

  const polylineRamp = createMemo(() =>
    data()
      .map((d) => `${xPx(d.i).toFixed(1)},${yPxRamp(d.h).toFixed(1)}`)
      .join(" "),
  );

  // Bottom panel: theta vs theta' (log scale)
  const Y1 = 280;
  const H1 = 100;
  const yPxLog = (v: number) => {
    const log = Math.log10(Math.max(v, 1e-6));
    // range -6 to 0 → H1
    const yNorm = (log + 6) / 6;
    return Y1 + H1 - yNorm * H1;
  };
  const polyTheta = createMemo(() =>
    data().map((d) => `${xPx(d.i).toFixed(1)},${yPxLog(d.theta).toFixed(1)}`).join(" "),
  );
  const polyThetaPrime = createMemo(() =>
    data().map((d) => `${xPx(d.i).toFixed(1)},${yPxLog(d.thetaPrime).toFixed(1)}`).join(" "),
  );

  return (
    <figure class="figure" data-testid="yarn-bands">
      <svg viewBox="0 0 660 440" role="img" aria-label="YaRN three-band ramp visualization">
        <title>
          YaRN's per-dimension ramp h(i) and the resulting effective theta. Fast dims (h=0) keep
          their rotation rate; slow dims (h=1) get linearly interpolated; middle dims are smoothly
          blended.
        </title>

        {/* Top panel: ramp */}
        <text
          x={X0 + W / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          YaRN ramp h(i): per-dimension blend between original and PI-scaled
        </text>

        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke="#e3e3dc" />
        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="#e3e3dc" />

        <text x={X0 - 6} y={Y0 + 6} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          1 (slow)
        </text>
        <text x={X0 - 6} y={Y0 + H} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          0 (fast)
        </text>

        <polyline points={polylineRamp()} fill="none" stroke="#1a4f7a" stroke-width="2" />

        {/* Band annotations.
            h = 1 at the top of the panel and corresponds to the slow band (apply θ/s);
            h = 0 at the bottom corresponds to the fast band (keep θ unchanged). */}
        <text x={X0 + 8} y={Y0 + 16} font-family="var(--mono)" font-size="10" fill="#5a5a55">
          slow band: interpolate to θ/s
        </text>
        <text x={X0 + 8} y={Y0 + H - 8} font-family="var(--mono)" font-size="10" fill="#5a5a55">
          fast band: keep θ
        </text>
        <text x={X0 + W - 8} y={Y0 + H / 2} text-anchor="end" font-family="var(--mono)" font-size="10" fill="#5a5a55">
          mid: smooth blend
        </text>

        {/* Bottom panel */}
        <text
          x={X0 + W / 2}
          y={Y1 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Original θ (gray) vs YaRN-scaled θ' (blue)  —  log scale
        </text>

        <line x1={X0} y1={Y1} x2={X0} y2={Y1 + H1} stroke="#e3e3dc" />
        <line x1={X0} y1={Y1 + H1} x2={X0 + W} y2={Y1 + H1} stroke="#e3e3dc" />

        <polyline points={polyTheta()} fill="none" stroke="#8a8a85" stroke-width="1.5" stroke-dasharray="4 3" />
        <polyline points={polyThetaPrime()} fill="none" stroke="#1a4f7a" stroke-width="2" />

        <text x={X0 + W / 2} y={Y1 + H1 + 22} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          dimension pair index i
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Context scale s = T_new / T_train</span>
          <input
            type="range"
            aria-label="Context scale s = T_new / T_train"
            min={1}
            max={32}
            step={0.5}
            value={scaleS()}
            onInput={(e) => setScaleS(+e.currentTarget.value)}
            aria-valuetext={`context scale ${scaleS().toFixed(1)}, target context ${(scaleS() * T_TRAIN).toLocaleString()} from base ${T_TRAIN.toLocaleString()}`}
          />
          <span class="value">{scaleS().toFixed(1)}×</span>
        </label>
        <label>
          <span>r_min (slow threshold)</span>
          <input
            type="range"
            aria-label="r_min (slow threshold)"
            min={0.5}
            max={8}
            step={0.5}
            value={rMin()}
            onInput={(e) => setRMin(+e.currentTarget.value)}
            aria-valuetext={`slow-band threshold r_min ${rMin().toFixed(1)} rotations`}
          />
          <span class="value">{rMin().toFixed(1)}</span>
        </label>
        <label>
          <span>r_max (fast threshold)</span>
          <input
            type="range"
            aria-label="r_max (fast threshold)"
            min={8}
            max={64}
            step={1}
            value={rMax()}
            onInput={(e) => setRMax(+e.currentTarget.value)}
            aria-valuetext={`fast-band threshold r_max ${rMax()} rotations`}
          />
          <span class="value">{rMax()}</span>
        </label>
      </div>

      <figcaption>
        At default settings: <strong>{fastN()}</strong> fast dims keep their rotation rate
        unchanged, <strong>{midN()}</strong> middle-band dims get a smooth blend, and{" "}
        <strong>{slowN()}</strong> slow-band dims get linearly interpolated to θ/s. Ratchet up{" "}
        <code>r_max</code> to push more dims into the smooth blend; raise the context scale to
        see how much the slow band gets pushed down.
      </figcaption>
    </figure>
  );
}
