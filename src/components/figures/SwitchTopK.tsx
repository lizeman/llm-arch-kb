/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Switch top-1 vs top-K comparison.
 * For B tokens, E experts:
 *   - Top-1 (Switch): each token picks one expert; minimal compute, balance via aux loss.
 *   - Top-K: each token picks K experts; soft routing via softmax weights.
 *
 * Show:
 *   - Per-expert traffic for both schemes
 *   - Compute cost: K × FLOPs per token
 *   - Slider for K
 */

const E = 12;
const B = 64;

function gateScore(t: number, e: number): number {
  const h = ((t + 1) * 2654435761) ^ ((e + 17) * 40503);
  return (h & 0xffff) / 0x10000;
}

function topK(scores: number[], k: number): number[] {
  return scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.i);
}

export default function SwitchTopK() {
  const [K, setK] = createSignal(2);

  const switchTraffic = createMemo(() => {
    const counts = new Array(E).fill(0);
    for (let t = 0; t < B; t++) {
      const scores = Array.from({ length: E }, (_, e) => gateScore(t, e));
      const pick = topK(scores, 1);
      counts[pick[0]]++;
    }
    return counts;
  });

  const topkTraffic = createMemo(() => {
    const counts = new Array(E).fill(0);
    for (let t = 0; t < B; t++) {
      const scores = Array.from({ length: E }, (_, e) => gateScore(t, e));
      const picks = topK(scores, K());
      for (const e of picks) counts[e]++;
    }
    return counts;
  });

  // Geometry
  const X0 = 70;
  const Y0 = 60;
  const W = 560;
  const H = 100;
  const colW = W / E;
  const target = createMemo(() => B / E); // top-1 ideal
  const targetK = createMemo(() => (B * K()) / E); // top-K ideal

  function renderRow(values: number[], yCenter: number, color: string, title: string, target: number) {
    const maxBar = Math.max(target * 2.5, ...values);
    return (
      <g>
        <text
          x={X0 + W / 2}
          y={yCenter - H / 2 - 10}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="12"
          font-weight="600"
          fill="#1a1a1a"
        >{title}</text>
        <line x1={X0} y1={yCenter + H / 2} x2={X0 + W} y2={yCenter + H / 2} stroke="#e3e3dc" />
        <line
          x1={X0}
          y1={yCenter + H / 2 - (target / maxBar) * H}
          x2={X0 + W}
          y2={yCenter + H / 2 - (target / maxBar) * H}
          stroke="#1a4f7a"
          stroke-dasharray="3 3"
          stroke-width="1"
        />
        {values.map((v, e) => {
          const barH = (v / maxBar) * H;
          const x = X0 + e * colW + 4;
          return (
            <g>
              <rect x={x} y={yCenter + H / 2 - barH} width={colW - 8} height={barH} fill={color} opacity="0.85" />
              <text
                x={x + (colW - 8) / 2}
                y={yCenter + H / 2 + 14}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#5a5a55"
              >{`e${e}`}</text>
            </g>
          );
        })}
      </g>
    );
  }

  const switchCost = B; // 1 expert per token
  const topkCost = createMemo(() => B * K());

  return (
    <figure class="figure" data-testid="switch-topk">
      <svg viewBox="0 0 700 380" role="img" aria-label="Switch top-1 vs top-K routing comparison">
        <title>
          Switch routes each token to exactly one expert (top-1). Top-K (GShard / Mixtral) routes
          each token to K experts. Per-expert traffic and total compute are shown side by side.
        </title>

        {renderRow(switchTraffic(), Y0 + H / 2, "#1a4f7a", "Switch top-1 (one expert per token)", target())}
        {renderRow(topkTraffic(), Y0 + H + 60 + H / 2, "#5a5a55", `Top-K = ${K()} (K experts per token)`, targetK())}

        {/* Cost panel */}
        <g transform={`translate(${X0}, ${Y0 + 2 * H + 100})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            Compute per token
          </text>
          <text x="0" y="20" font-family="var(--mono)" font-size="11" fill="#1a4f7a">
            Switch: 1 expert × {B} tokens = {switchCost} expert calls
          </text>
          <text x="0" y="38" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Top-{K()}: {K()} experts × {B} tokens = {topkCost()} expert calls ({K()}× more compute)
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Comparison K (top-K branch only)</span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={K()}
            onInput={(e) => setK(+e.currentTarget.value)}
            aria-valuetext={`top-K branch routes each token to ${K()} experts`}
          />
          <span class="value">{K()}</span>
        </label>
      </div>

      <figcaption>
        Switch's contribution was the demonstration that <strong>top-1 routing</strong> trains
        stably at trillion-parameter scale, despite the conventional wisdom that top-2 (GShard)
        was the minimum needed for the gate to receive useful gradients. The savings are linear
        in K: top-1 does 1× expert FLOPs per token, top-2 does 2×, etc. Modern open MoE has
        actually moved back toward larger K (DeepSeek V3 uses top-8 across 256 experts) for
        quality gains — Switch's lesson held but the pendulum swung partway back.
      </figcaption>
    </figure>
  );
}
