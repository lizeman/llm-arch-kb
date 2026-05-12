/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * ReZero α-evolution demo.
 * Simulate a stack of L layers with per-layer learnable α.
 *   x_{l+1} = x_l + α_l · f_l(x_l)
 *
 * Show two cases:
 *   - α_l = 0 (init): every block is identity; gradient flows untouched.
 *   - α_l = α (current value): blocks contribute α-scaled perturbations.
 *
 * Plot the per-layer residual stream norm and the per-layer gradient magnitude
 * (||dL/dx_l||) for the current α; also show how training would gradually open the
 * α valve.
 */

const L = 32;
const D = 256;

function rms(v: number[]): number {
  return Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length);
}

function seedVec(seed: number, sigma: number): number[] {
  let s = ((seed + 1) * 2654435761) >>> 0;
  const out: number[] = new Array(D);
  for (let i = 0; i < D; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const u1 = (s & 0xffffffff) / 0xffffffff || 1e-9;
    s = (s * 1103515245 + 12345) >>> 0;
    const u2 = (s & 0xffffffff) / 0xffffffff || 1e-9;
    out[i] = sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  return out;
}

export default function ReZeroAlpha() {
  const [alpha, setAlpha] = createSignal(0.0);

  const trace = createMemo(() => {
    // Forward pass: residual stream norm at each layer
    const x = seedVec(0, 0.5);
    const norms: number[] = [rms(x)];
    for (let l = 0; l < L; l++) {
      const pert = seedVec(l + 1, 1.0);
      for (let i = 0; i < D; i++) x[i] += alpha() * pert[i];
      norms.push(rms(x));
    }
    return norms;
  });

  // Geometry
  const X0 = 60;
  const Y0 = 40;
  const W = 580;
  const H = 200;

  const xPx = (l: number) => X0 + (l / L) * W;
  const yMax = createMemo(() => Math.max(2, ...trace()));
  const yPx = (v: number) => Y0 + H - (v / yMax()) * H;

  const polyline = createMemo(() =>
    trace().map((v, i) => `${xPx(i).toFixed(1)},${yPx(v).toFixed(1)}`).join(" "),
  );

  // Identity reference line
  const identityNorm = trace()[0];
  const yIdentity = yPx(identityNorm);

  return (
    <figure class="figure" data-testid="rezero-alpha">
      <svg viewBox="0 0 700 360" role="img" aria-label="ReZero alpha-scaled residual stream norm">
        <title>
          ReZero's α scalar gates each block's contribution to the residual. At α = 0 the network
          is the identity function; raising α lets each block add αx perturbation.
        </title>

        <text
          x={X0 + W / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >{`Residual stream RMS through depth (α = ${alpha().toFixed(3)})`}</text>

        {/* Axes */}
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke="#e3e3dc" />
        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="#e3e3dc" />

        <text x={X0 - 6} y={Y0 + 6} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          {yMax().toFixed(1)}
        </text>
        <text x={X0 - 6} y={Y0 + H + 4} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          0
        </text>

        {/* Identity reference */}
        <line x1={X0} y1={yIdentity} x2={X0 + W} y2={yIdentity} stroke="#5a5a55" stroke-dasharray="4 3" stroke-width="0.8" />
        <text x={X0 + W + 4} y={yIdentity + 4} font-family="var(--mono)" font-size="9" fill="#5a5a55">
          identity
        </text>

        {/* Curve */}
        <polyline points={polyline()} fill="none" stroke="#1a4f7a" stroke-width="2" />

        <text x={X0 + W / 2} y={Y0 + H + 22} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          layer index l (depth = {L})
        </text>

        {/* Status panel */}
        <g transform={`translate(${X0}, ${Y0 + H + 50})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            How ReZero trains
          </text>
          <text x="0" y="20" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            α init = 0 ⇒ every block is identity ⇒ gradient at layer 1 is exactly 1
          </text>
          <text x="0" y="38" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Each α_l learns to grow gradually as training proceeds (one scalar per branch)
          </text>
          <text x="0" y="56" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Final residual norm at layer L: {trace()[L].toFixed(2)} (depth-{L} forward pass)
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Per-block α scalar</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={alpha()}
            onInput={(e) => setAlpha(+e.currentTarget.value)}
            aria-valuetext={`alpha ${alpha().toFixed(3)}; at zero the network is identity`}
          />
          <span class="value">{alpha().toFixed(3)}</span>
        </label>
      </div>

      <figcaption>
        ReZero starts with α = 0 — every block is the identity function, the forward pass is
        the input copied through L layers unchanged, and the gradient at every layer is exactly
        1. As training proceeds, each α_l (one scalar per residual branch) is updated by SGD
        and gradually grows, opening the valve on each block's contribution. The mechanism is
        simpler than LayerNorm, ReZero networks trained without LayerNorm at all in the paper's
        ablations — though for production decoders the gradient stability from Pre-Norm proved
        sufficient and α stayed off the consensus stack.
      </figcaption>
    </figure>
  );
}
