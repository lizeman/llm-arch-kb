/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * ALiBi slopes visualizer. For H heads, head h is assigned slope m_h = 2^{-8h/H}.
 * The bias added to attention logit (i, j) is -m_h * (i - j) for j <= i (causal).
 * Drag head index to see the bias kernel as a 1D line; drag head count to see the slope schedule.
 */

const SEQ = 64;

function alibiSlopes(H: number): number[] {
  // The original ALiBi schedule is geometric in 2^{-8/H}.
  const ratio = Math.pow(2, -8 / H);
  const out: number[] = [];
  let s = ratio;
  for (let h = 0; h < H; h++) {
    out.push(s);
    s *= ratio;
  }
  return out;
}

export default function AlibiSlopes() {
  const [H, setH] = createSignal(8);
  const [headIdx, setHeadIdx] = createSignal(0);

  const slopes = createMemo(() => alibiSlopes(H()));
  const slope = createMemo(() => slopes()[Math.min(headIdx(), slopes().length - 1)]);

  // 1D bias kernel: for query at position SEQ-1, plot bias vs key position 0..SEQ-1.
  const kernel = createMemo(() => {
    const q = SEQ - 1;
    const m = slope();
    const pts: { x: number; bias: number }[] = [];
    for (let k = 0; k <= q; k++) {
      pts.push({ x: k, bias: -m * (q - k) });
    }
    return pts;
  });

  // Geometry
  const X0 = 70;
  const Y0 = 40;
  const W = 540;
  const H_PX = 200;

  // Y range for the kernel chart
  const minBias = createMemo(() => Math.min(...kernel().map((p) => p.bias)));
  const yPx = (b: number) => {
    const minB = minBias();
    if (minB === 0) return Y0 + H_PX;
    return Y0 + H_PX - ((b - minB) / -minB) * H_PX;
  };
  const xPx = (k: number) => X0 + (k / (SEQ - 1)) * W;

  const polyline = createMemo(() =>
    kernel()
      .map((p) => `${xPx(p.x).toFixed(1)},${yPx(p.bias).toFixed(1)}`)
      .join(" "),
  );

  // Slopes panel — show bars
  const Y1 = 320;
  const SBAR_W = 8;
  const SBAR_GAP = 2;
  const slopePxScale = 60; // pixels per slope-magnitude

  return (
    <figure class="figure" data-testid="alibi-slopes">
      <svg viewBox="0 0 660 420" role="img" aria-label="ALiBi slopes and per-head bias kernel">
        <title>
          ALiBi assigns each head a fixed slope. Slope m_h is multiplied by query-key distance to
          produce a per-head linear bias on attention scores.
        </title>

        <text
          x={X0 + W / 2}
          y={Y0 - 12}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Bias added to attention logit (q = {SEQ - 1}, k) for head {headIdx()} (slope ={" "}
          {slope().toFixed(4)})
        </text>

        {/* Axes */}
        <line x1={X0} y1={Y0 + H_PX} x2={X0 + W} y2={Y0 + H_PX} stroke="#e3e3dc" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H_PX} stroke="#e3e3dc" />

        <text
          x={X0 - 8}
          y={Y0 + 10}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          0
        </text>
        <text
          x={X0 - 8}
          y={Y0 + H_PX + 4}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          {minBias().toFixed(2)}
        </text>
        <text
          x={X0 + W / 2}
          y={Y0 + H_PX + 22}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          key position k (0 = farthest, {SEQ - 1} = current)
        </text>

        <polyline points={polyline()} fill="none" stroke="#1a4f7a" stroke-width="2" />

        {/* Slopes panel */}
        <text
          x={X0 + W / 2}
          y={Y1 - 12}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          ALiBi slope schedule across {H()} heads
        </text>

        <line x1={X0} y1={Y1 + 60} x2={X0 + W} y2={Y1 + 60} stroke="#e3e3dc" />
        {slopes().map((s, i) => {
          const x = X0 + i * (SBAR_W + SBAR_GAP) + 8;
          const h = s * slopePxScale * 8; // emphasize visually
          const fill = i === headIdx() ? "#1a4f7a" : "#5a5a55";
          return <rect x={x} y={Y1 + 60 - h} width={SBAR_W} height={h} fill={fill} opacity="0.85" />;
        })}
        <text
          x={X0}
          y={Y1 + 78}
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          head 0 (steepest)
        </text>
        <text
          x={X0 + H() * (SBAR_W + SBAR_GAP) + 8}
          y={Y1 + 78}
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          head {H() - 1} (shallowest)
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Number of heads H</span>
          <input
            type="range"
            aria-label="Number of heads H"
            min={4}
            max={32}
            step={1}
            value={H()}
            onInput={(e) => {
              const v = +e.currentTarget.value;
              setH(v);
              if (headIdx() >= v) setHeadIdx(v - 1);
            }}
            aria-valuetext={`${H()} attention heads`}
          />
          <span class="value">{H()}</span>
        </label>
        <label>
          <span>Selected head index</span>
          <input
            type="range"
            aria-label="Selected head index"
            min={0}
            max={H() - 1}
            step={1}
            value={headIdx()}
            onInput={(e) => setHeadIdx(+e.currentTarget.value)}
            aria-valuetext={`head index ${headIdx()} of ${H() - 1}`}
          />
          <span class="value">{headIdx()}</span>
        </label>
      </div>

      <figcaption>
        Slopes follow the geometric schedule <code>m_h = 2^(-8h/H)</code>. <strong>Head 0</strong>{" "}
        has the steepest slope and so penalizes distance most aggressively (effectively local).{" "}
        <strong>Head H-1</strong> is nearly flat — almost equivalent to no positional bias.
        Different heads attend at different ranges, all from one fixed schedule.
      </figcaption>
    </figure>
  );
}
