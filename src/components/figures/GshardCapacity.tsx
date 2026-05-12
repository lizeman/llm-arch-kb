/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * GShard expert capacity demo.
 * For B tokens, E experts, top-K routing, capacity per expert is
 *   capacity = ceil(C * K * B / E)
 * Each token deterministically picks K experts (pseudo-random gate). Tokens that arrive at an
 * already-full expert are *dropped* (sent through residual unchanged).
 *
 * Show:
 *   - Per-expert load (with cap line)
 *   - Number of dropped tokens
 *   - Slider for capacity factor C
 */

const E = 12;
const B = 64;
const K = 2;

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

export default function GshardCapacity() {
  const [C, setC] = createSignal(1.25);

  const result = createMemo(() => {
    const cap = Math.ceil((C() * K * B) / E);
    const counts = new Array(E).fill(0);
    let dropped = 0;
    for (let t = 0; t < B; t++) {
      const scores = Array.from({ length: E }, (_, e) => gateScore(t, e));
      const picks = topK(scores, K);
      for (const e of picks) {
        if (counts[e] < cap) counts[e]++;
        else dropped++;
      }
    }
    return { counts, cap, dropped };
  });

  // Geometry
  const X0 = 70;
  const Y0 = 50;
  const W = 560;
  const H = 200;
  const colW = W / E;

  return (
    <figure class="figure" data-testid="gshard-capacity">
      <svg viewBox="0 0 700 360" role="img" aria-label="GShard expert capacity visualization">
        <title>
          GShard's expert capacity is a hard cap on tokens per expert per batch. Tokens routed
          to a full expert get dropped (passed through residual unchanged). Drag the capacity
          factor C to see the drop count change.
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
          Per-expert load (B = {B}, E = {E}, K = {K}, capacity = {result().cap} tokens/expert)
        </text>

        {/* Capacity line */}
        <line
          x1={X0}
          y1={Y0 + H - (result().cap / Math.max(...result().counts, result().cap)) * H}
          x2={X0 + W}
          y2={Y0 + H - (result().cap / Math.max(...result().counts, result().cap)) * H}
          stroke="#1a4f7a"
          stroke-dasharray="4 3"
          stroke-width="1.2"
        />
        <text
          x={X0 + W + 4}
          y={Y0 + H - (result().cap / Math.max(...result().counts, result().cap)) * H + 4}
          font-family="var(--mono)"
          font-size="9"
          fill="#1a4f7a"
        >
          cap
        </text>

        {/* Bars */}
        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke="#e3e3dc" />
        {result().counts.map((c, e) => {
          const maxBar = Math.max(...result().counts, result().cap);
          const barH = (c / maxBar) * H;
          const x = X0 + e * colW + 4;
          return (
            <g>
              <rect
                x={x}
                y={Y0 + H - barH}
                width={colW - 8}
                height={barH}
                fill={c >= result().cap ? "#1a4f7a" : "#5a5a55"}
                opacity={c >= result().cap ? 0.85 : 0.5}
              />
              <text
                x={x + (colW - 8) / 2}
                y={Y0 + H + 14}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#5a5a55"
              >
                e{e}
              </text>
              <text
                x={x + (colW - 8) / 2}
                y={Y0 + H - barH - 4}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#5a5a55"
              >
                {c}
              </text>
            </g>
          );
        })}

        {/* Stats */}
        <g transform={`translate(${X0}, ${Y0 + H + 50})`}>
          <text x="0" y="0" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Total token-expert routings: {B * K} ({B} tokens × top-{K})
          </text>
          <text x="0" y="18" font-family="var(--mono)" font-size="11" fill={result().dropped > 0 ? "#1a4f7a" : "#5a5a55"}>
            Dropped (capacity overflow): {result().dropped} ({((result().dropped / (B * K)) * 100).toFixed(1)}%)
          </text>
          <text x="0" y="36" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Capacity factor C = {C().toFixed(2)} →{" "}
            cap = ⌈C · K · B / E⌉ = ⌈{(C() * K * B / E).toFixed(2)}⌉ = {result().cap}
          </text>
          <text x="0" y="58" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            C = 1.0 = perfectly balanced ideal (zero slack); C ≥ 1.25 in production.
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Capacity factor C</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={C()}
            onInput={(e) => setC(+e.currentTarget.value)}
            aria-valuetext={`capacity factor ${C().toFixed(2)}, capacity ${result().cap} tokens per expert`}
          />
          <span class="value">{C().toFixed(2)}</span>
        </label>
      </div>

      <figcaption>
        Each expert can hold at most ⌈C · K · B / E⌉ tokens per batch. With C = 1.0 and a perfectly
        balanced router, every expert gets exactly K · B / E tokens. In practice, gate scores are
        never that uniform — a few experts overflow, and the surplus tokens are <strong>dropped
        </strong>, contributing nothing to that block's compute. C &gt; 1 buys slack for routing
        imbalance at the cost of more padding compute. Production GShard / Switch typically use
        C ∈ [1.25, 2.0].
      </figcaption>
    </figure>
  );
}
