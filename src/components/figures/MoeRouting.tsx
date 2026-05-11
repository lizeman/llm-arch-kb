/** @jsxImportSource solid-js */
import { createMemo, createSignal, For } from "solid-js";

/**
 * Top-K expert routing visualizer.
 *
 * Shows N tokens above and E routed experts below, with deterministic pseudo-random gating
 * scores. The user manipulates K (top-K) and E (expert count) and optionally enables a
 * persistent shared expert. The figure draws connection lines and a per-expert utilization
 * bar, matching the DeepSeekMoE routing math.
 *
 * Plan §11.4 contract: SVG viewBox, ≥44px touch targets, aria-valuetext on sliders,
 * prefers-reduced-motion via tokens.css, <=400 lines.
 */

const N_TOKENS = 12;

// Deterministic pseudo-random gate logit: (tokenIdx, expertIdx) -> score in [0, 1).
function gateScore(t: number, e: number): number {
  const h = ((t + 1) * 2654435761) ^ ((e + 17) * 40503);
  return (h & 0xffff) / 0x10000;
}

export default function MoeRouting() {
  const [k, setK] = createSignal(2);
  const [e, setE] = createSignal(8);
  const [hasShared, setHasShared] = createSignal(true);

  const expertCount = () => e();
  const k_clamped = () => Math.min(k(), expertCount());

  // Per-token: indices of top-K experts (descending by score)
  const routes = createMemo(() => {
    const E = expertCount();
    const K = k_clamped();
    const out: number[][] = [];
    for (let t = 0; t < N_TOKENS; t++) {
      const scores = Array.from({ length: E }, (_, ei) => ({ ei, s: gateScore(t, ei) }));
      scores.sort((a, b) => b.s - a.s);
      out.push(scores.slice(0, K).map((x) => x.ei));
    }
    return out;
  });

  const utilization = createMemo(() => {
    const E = expertCount();
    const counts = new Array(E).fill(0);
    for (const row of routes()) for (const ei of row) counts[ei]++;
    return counts;
  });

  // Geometry
  const tokenY = 70;
  const expertY = 270;
  const tokenLeft = 60;
  const tokenStride = (640 - 60) / (N_TOKENS - 1);

  const expertStride = createMemo(() => (640 - 60) / Math.max(1, expertCount() - 1));
  const expertX = (ei: number) => 60 + ei * expertStride();

  return (
    <figure class="figure" data-testid="moe-routing">
      <svg viewBox="0 0 720 480" role="img" aria-label="Mixture-of-experts top-K routing visualization">
        <title>Tokens (top) routed to top-K experts (bottom). Optional shared expert at far right is always active.</title>

        <text x={350} y={28} text-anchor="middle"
          font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
          {N_TOKENS} tokens · {expertCount()} routed experts · top-K = {k_clamped()}
          {hasShared() ? " · 1 shared expert" : ""}
        </text>

        <text x={20} y={tokenY - 18} font-family="var(--mono)" font-size="10" fill="#5a5a55">tokens</text>
        <text x={20} y={expertY + 36} font-family="var(--mono)" font-size="10" fill="#5a5a55">experts</text>

        {/* Tokens */}
        <For each={Array.from({ length: N_TOKENS }, (_, i) => i)}>
          {(t) => (
            <g>
              <rect
                x={tokenLeft + t * tokenStride - 12}
                y={tokenY - 12}
                width={24}
                height={24}
                rx={3}
                fill="#e8eef4"
                stroke="#1a4f7a"
                stroke-width="1"
              />
              <text
                x={tokenLeft + t * tokenStride}
                y={tokenY + 4}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#1a4f7a"
              >t{t}</text>
            </g>
          )}
        </For>

        {/* Routed experts */}
        <For each={Array.from({ length: expertCount() }, (_, i) => i)}>
          {(ei) => (
            <g>
              <rect
                x={expertX(ei) - 14}
                y={expertY - 12}
                width={28}
                height={24}
                rx={3}
                fill={utilization()[ei]! > 0 ? "#fafaf7" : "#f1f1ec"}
                stroke="#1a4f7a"
                stroke-width="1.25"
                opacity={utilization()[ei]! > 0 ? 1 : 0.5}
              />
              <text
                x={expertX(ei)}
                y={expertY + 4}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="9"
                fill="#1a4f7a"
              >E{ei}</text>
              {/* Utilization bar above expert */}
              <rect
                x={expertX(ei) - 14}
                y={expertY - 16 - utilization()[ei]! * 4}
                width={28}
                height={utilization()[ei]! * 4}
                fill="#1a4f7a"
                opacity="0.35"
              />
            </g>
          )}
        </For>

        {/* Shared expert at far right, lit for every token */}
        {hasShared() && (
          <g>
            <rect x={678} y={expertY - 12} width={32} height={24} rx={3}
              fill="#1a4f7a" stroke="#1a4f7a" stroke-width="1" />
            <text x={694} y={expertY + 4} text-anchor="middle"
              font-family="var(--mono)" font-size="9" fill="white">shr</text>
            <text x={694} y={expertY - 18} text-anchor="middle"
              font-family="var(--mono)" font-size="8" fill="#5a5a55">always on</text>
          </g>
        )}

        {/* Connecting lines */}
        <For each={routes()}>
          {(picks, t) => (
            <For each={picks}>
              {(ei, idx) => (
                <line
                  x1={tokenLeft + t() * tokenStride}
                  y1={tokenY + 14}
                  x2={expertX(ei)}
                  y2={expertY - 14}
                  stroke="#1a4f7a"
                  stroke-width={idx() === 0 ? 1.4 : 0.9}
                  opacity={idx() === 0 ? 0.85 : 0.5}
                />
              )}
            </For>
          )}
        </For>

        {hasShared() && (
          <For each={Array.from({ length: N_TOKENS }, (_, t) => t)}>
            {(t) => (
              <line
                x1={tokenLeft + t * tokenStride}
                y1={tokenY + 14}
                x2={694}
                y2={expertY - 14}
                stroke="#1a4f7a"
                stroke-width="0.55"
                opacity="0.3"
              />
            )}
          </For>
        )}

        {/* Activation footprint readout */}
        <text x={60} y={420} font-family="var(--mono)" font-size="11" fill="#5a5a55">
          activated params per token: {k_clamped()} routed expert{k_clamped() === 1 ? "" : "s"}
          {hasShared() ? " + 1 shared" : ""}
          &nbsp;of {expertCount()} routed total
        </text>
        <text x={60} y={440} font-family="var(--mono)" font-size="11" fill="#5a5a55">
          sparsity ratio: {((expertCount() - k_clamped()) / expertCount() * 100).toFixed(0)}% of routed FFN dormant per token
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>top-K</span>
          <input
            type="range"
            min={1}
            max={Math.max(1, expertCount())}
            step={1}
            value={k_clamped()}
            onInput={(e) => setK(+e.currentTarget.value)}
            aria-valuetext={`top-K equals ${k_clamped()} routed experts per token`}
          />
          <span class="value">{k_clamped()}</span>
        </label>
        <label>
          <span>Expert count E</span>
          <input
            type="range"
            min={2}
            max={32}
            step={1}
            value={expertCount()}
            onInput={(e2) => setE(+e2.currentTarget.value)}
            aria-valuetext={`${expertCount()} routed experts total`}
          />
          <span class="value">{expertCount()}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={hasShared()}
            onChange={(e3) => setHasShared(e3.currentTarget.checked)}
            aria-label="Toggle shared expert"
            style={{ width: "auto", "min-height": "auto" }}
          />
          <span>Shared expert</span>
          <span class="value">&nbsp;</span>
        </label>
      </div>

      <figcaption>
        Per token the gate picks <strong>K = {k_clamped()}</strong> of <strong>{expertCount()}</strong>
        {" "}routed experts (heavy line = top-1, lighter line = rank 2…K). With the shared expert
        on, every token also flows through the always-active expert at the far right — that's the
        "isolation" half of DeepSeekMoE.
      </figcaption>
    </figure>
  );
}
