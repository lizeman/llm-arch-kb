/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * SandwichVsPre: simulate the residual stream norm under three placements
 *  - Pre-Norm:    x_{l+1} = x_l + sigma_l * unit_perturbation_l   (no bound; norm grows like sqrt(L))
 *  - Sandwich-LN: x_{l+1} = x_l + Norm(unit_perturbation_l)        (each block adds unit-RMS contribution)
 *  - Post-Norm (DeepNet-scaled): x_{l+1} = Norm(beta * x_l + sigma_l * unit_perturbation_l)
 *
 * The plot shows ||x_l|| as a function of l for each scheme. Slider sets max depth and
 * the per-block perturbation scale.
 */

const D = 256;

function rms(v: number[]): number {
  return Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length);
}
function newSeededVec(seed: number, sigma: number): number[] {
  // Simple LCG so the figure is deterministic across re-renders.
  let s = seed * 2654435761 >>> 0;
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

export default function SandwichVsPre() {
  const [maxL, setMaxL] = createSignal(80);
  const [sigma, setSigma] = createSignal(1.0);

  const series = createMemo(() => {
    const L = maxL();
    const s = sigma();
    // Initialize streams
    const x_pre = new Array(D).fill(0);
    const x_sand = new Array(D).fill(0);
    const x_post = new Array(D).fill(0);
    // Tiny init — deterministic so the figure is stable across renders / signal updates.
    const init = newSeededVec(0, 0.5);
    for (let i = 0; i < D; i++) {
      x_pre[i] = init[i];
      x_sand[i] = init[i];
      x_post[i] = init[i];
    }

    const beta = Math.pow(8 * L, -0.25); // DeepNet scaling for L-layer encoder

    const norms = { pre: [rms(x_pre)], sand: [rms(x_sand)], post: [rms(x_post)] };

    for (let l = 0; l < L; l++) {
      const pert = newSeededVec(l + 1, s);
      // Pre-Norm: add raw perturbation (sigma * iid Gaussian, sublayer output magnitude)
      for (let i = 0; i < D; i++) x_pre[i] += pert[i];
      // Sandwich: normalize the perturbation to unit RMS before adding
      const r = rms(pert) + 1e-6;
      for (let i = 0; i < D; i++) x_sand[i] += pert[i] / r;
      // Post-Norm with DeepNet scale: y = norm(beta*x + pert), x = y
      for (let i = 0; i < D; i++) x_post[i] = beta * x_post[i] + pert[i];
      const r_post = rms(x_post) + 1e-6;
      for (let i = 0; i < D; i++) x_post[i] = x_post[i] / r_post;
      norms.pre.push(rms(x_pre));
      norms.sand.push(rms(x_sand));
      norms.post.push(rms(x_post));
    }
    return norms;
  });

  // Geometry
  const X0 = 60;
  const Y0 = 40;
  const W = 580;
  const H = 220;

  const xPx = (l: number) => X0 + (l / maxL()) * W;
  const allMax = createMemo(() =>
    Math.max(1, ...series().pre, ...series().sand, ...series().post),
  );
  const yPx = (n: number) => Y0 + H - (n / allMax()) * H;

  const polyline = (vs: number[]) =>
    vs.map((v, i) => `${xPx(i).toFixed(1)},${yPx(v).toFixed(1)}`).join(" ");

  const finalPre = () => series().pre[series().pre.length - 1].toFixed(2);
  const finalSand = () => series().sand[series().sand.length - 1].toFixed(2);
  const finalPost = () => series().post[series().post.length - 1].toFixed(2);

  return (
    <figure class="figure" data-testid="sandwich-vs-pre">
      <svg viewBox="0 0 660 340" role="img" aria-label="Residual stream norm by depth and norm placement">
        <title>
          Residual stream norm as a function of layer index for three normalization placements:
          Pre-Norm (unbounded growth), Sandwich-LN (bounded), Post-Norm + DeepNet (re-scaled).
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
          Residual stream RMS ||x_l|| over depth ({maxL()} layers)
        </text>

        {/* Axes */}
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke="#e3e3dc" />
        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="#e3e3dc" />

        <text x={X0 - 6} y={Y0 + 6} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          {allMax().toFixed(1)}
        </text>
        <text x={X0 - 6} y={Y0 + H} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          0
        </text>

        <text x={X0 + W / 2} y={Y0 + H + 22} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          layer index l
        </text>

        {/* Curves */}
        <polyline points={polyline(series().pre)} fill="none" stroke="#8a8a85" stroke-width="2" />
        <polyline points={polyline(series().sand)} fill="none" stroke="#1a4f7a" stroke-width="2" />
        <polyline points={polyline(series().post)} fill="none" stroke="#5a5a55" stroke-width="2" stroke-dasharray="5 4" />

        {/* Legend */}
        <g transform={`translate(${X0 + 16}, ${Y0 + 12})`}>
          <line x1="0" y1="0" x2="20" y2="0" stroke="#8a8a85" stroke-width="2" />
          <text x="26" y="4" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Pre-Norm (final {finalPre()})
          </text>
          <line x1="0" y1="16" x2="20" y2="16" stroke="#1a4f7a" stroke-width="2" />
          <text x="26" y="20" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Sandwich-LN (final {finalSand()})
          </text>
          <line x1="0" y1="32" x2="20" y2="32" stroke="#5a5a55" stroke-width="2" stroke-dasharray="5 4" />
          <text x="26" y="36" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Post-Norm + DeepNet β (final {finalPost()})
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Depth (layers)</span>
          <input
            type="range"
            aria-label="Depth (layers)"
            min={4}
            max={200}
            step={1}
            value={maxL()}
            onInput={(e) => setMaxL(+e.currentTarget.value)}
            aria-valuetext={`${maxL()} layers`}
          />
          <span class="value">{maxL()}</span>
        </label>
        <label>
          <span>Sublayer perturbation σ</span>
          <input
            type="range"
            aria-label="Sublayer perturbation σ"
            min={0.1}
            max={3}
            step={0.05}
            value={sigma()}
            onInput={(e) => setSigma(+e.currentTarget.value)}
            aria-valuetext={`per-block sublayer perturbation standard deviation ${sigma().toFixed(2)}`}
          />
          <span class="value">{sigma().toFixed(2)}</span>
        </label>
      </div>

      <figcaption>
        <strong>Pre-Norm</strong> adds raw sublayer output to the residual; magnitude grows like
        √L. <strong>Sandwich-LN</strong> normalizes the sublayer output to unit RMS before
        adding, capping the per-block contribution. <strong>Post-Norm with DeepNet β</strong>{" "}
        renormalizes the sum each layer, holding ||x_l|| at unit RMS by construction. The
        bounded curves are why Sandwich and DeepNet placements train more reliably at depth.
      </figcaption>
    </figure>
  );
}
