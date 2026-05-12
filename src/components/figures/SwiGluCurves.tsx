/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Activation comparison: ReLU, GELU, SiLU/Swish, and SwiGLU's bilinear gate output.
 * SwiGLU is not a 1D activation — it computes Swish(W1 x) * (W2 x). For 1D illustration we
 * fix W2 = 1 so the "gated" curve is Swish(x) * x. Slider lets the reader sweep the gate
 * sharpness via Swish's beta parameter.
 */

function relu(x: number): number {
  return Math.max(0, x);
}
function gelu(x: number): number {
  // Tanh-approximation GELU
  const c = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x * x * x)));
}
function silu(x: number, beta: number): number {
  return x / (1 + Math.exp(-beta * x));
}

export default function SwiGluCurves() {
  const [beta, setBeta] = createSignal(1.0);
  const [showGated, setShowGated] = createSignal(true);

  const xs = createMemo(() => {
    const out: number[] = [];
    for (let i = -60; i <= 60; i++) out.push(i / 10);
    return out;
  });

  // Geometry
  const X0 = 60;
  const Y0 = 40;
  const W = 580;
  const H = 240;

  const xMin = -6;
  const xMax = 6;
  const yMin = -2;
  const yMax = 6;
  const xPx = (x: number) => X0 + ((x - xMin) / (xMax - xMin)) * W;
  const yPx = (y: number) => Y0 + H - ((y - yMin) / (yMax - yMin)) * H;

  function curve(fn: (x: number) => number): string {
    return xs()
      .map((x) => `${xPx(x).toFixed(1)},${yPx(fn(x)).toFixed(1)}`)
      .join(" ");
  }

  return (
    <figure class="figure" data-testid="swiglu-curves">
      <svg viewBox="0 0 700 380" role="img" aria-label="Activation function comparison">
        <title>
          ReLU, GELU, and SiLU/Swish activation functions plotted on the same axes, with the
          SwiGLU bilinear gate output overlaid.
        </title>

        {/* Axes */}
        <line x1={X0} y1={yPx(0)} x2={X0 + W} y2={yPx(0)} stroke="#e3e3dc" />
        <line x1={xPx(0)} y1={Y0} x2={xPx(0)} y2={Y0 + H} stroke="#e3e3dc" />

        {/* Y-axis ticks */}
        {[-1, 1, 2, 3, 4, 5].map((v) => (
          <g>
            <line x1={X0} y1={yPx(v)} x2={X0 + W} y2={yPx(v)} stroke="#e3e3dc" stroke-dasharray="2 4" opacity="0.6" />
            <text x={X0 - 6} y={yPx(v) + 3} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
              {v}
            </text>
          </g>
        ))}
        {[-4, -2, 2, 4].map((v) => (
          <text
            x={xPx(v)}
            y={yPx(0) + 14}
            text-anchor="middle"
            font-family="var(--mono)"
            font-size="9"
            fill="#8a8a85"
          >
            {v}
          </text>
        ))}

        {/* Curves */}
        <polyline points={curve(relu)} fill="none" stroke="#8a8a85" stroke-width="1.6" stroke-dasharray="4 3" />
        <polyline points={curve(gelu)} fill="none" stroke="#5a5a55" stroke-width="1.8" />
        <polyline points={curve((x) => silu(x, beta()))} fill="none" stroke="#1a4f7a" stroke-width="2" />
        {showGated() ? (
          <polyline
            points={curve((x) => silu(x, beta()) * x)}
            fill="none"
            stroke="#1a4f7a"
            stroke-width="2.5"
            opacity="0.55"
            stroke-dasharray="6 3"
          />
        ) : null}

        {/* Legend */}
        <g transform={`translate(${X0 + W - 200}, ${Y0 + 10})`}>
          <line x1="0" y1="0" x2="20" y2="0" stroke="#8a8a85" stroke-width="1.6" stroke-dasharray="4 3" />
          <text x="26" y="4" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            ReLU(x)
          </text>
          <line x1="0" y1="16" x2="20" y2="16" stroke="#5a5a55" stroke-width="1.8" />
          <text x="26" y="20" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            GELU(x)
          </text>
          <line x1="0" y1="32" x2="20" y2="32" stroke="#1a4f7a" stroke-width="2" />
          <text x="26" y="36" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            SiLU/Swish(x; β={beta().toFixed(2)})
          </text>
          {showGated() ? (
            <g>
              <line x1="0" y1="48" x2="20" y2="48" stroke="#1a4f7a" stroke-width="2.5" opacity="0.55" stroke-dasharray="6 3" />
              <text x="26" y="52" font-family="var(--mono)" font-size="10" fill="#5a5a55">
                Swish(x) · x (gate)
              </text>
            </g>
          ) : null}
        </g>

        <text x={X0 + W / 2} y={Y0 + H + 22} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          input x
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Swish sharpness β</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.05}
            value={beta()}
            onInput={(e) => setBeta(+e.currentTarget.value)}
            aria-valuetext={`Swish beta parameter ${beta().toFixed(2)}, larger means sharper transition`}
          />
          <span class="value">{beta().toFixed(2)}</span>
        </label>
        <label style={{ display: "flex", "align-items": "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={showGated()}
            onInput={(e) => setShowGated(e.currentTarget.checked)}
            aria-label="Toggle Swish times x gated curve"
          />
          <span>Show Swish · x (gate output)</span>
        </label>
      </div>

      <figcaption>
        ReLU is the historical baseline (sharp zero, identity above). GELU smooths the corner.
        SiLU/Swish is GELU's smoother cousin and the activation inside SwiGLU's gate. <strong>
        Swish(x) · x is what SwiGLU actually outputs in 1D</strong> — it is not just a sigmoid
        gate but a bilinear product, which is why it can introduce small negative dips and steeper
        upward slopes. The hidden-dim 8/3 × d convention compensates for SwiGLU's two-projection
        cost vs ReLU/GELU's one.
      </figcaption>
    </figure>
  );
}
