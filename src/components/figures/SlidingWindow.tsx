/** @jsxImportSource solid-js */
import { createMemo, createSignal, For } from "solid-js";

/**
 * Sliding window attention visualization.
 *
 * Shows the causal × windowed attention mask as a grid of queries (rows) and keys (columns).
 * Cells light up if the query at row t attends to the key at column s, i.e. iff
 *    s <= t  AND  t - s < W.
 *
 * The slider controls W. Edge effects (first W positions seeing the full prefix) are made
 * explicit by the visualization.
 *
 * Plan §11.4 contract: SVG viewBox, ≥44px touch targets, aria-valuetext on slider,
 * prefers-reduced-motion via tokens.css, <=400 lines.
 */

const N = 16; // sequence length to display

export default function SlidingWindow() {
  const [w, setW] = createSignal(4);
  const [layers, setLayers] = createSignal(1);

  const effectiveReach = createMemo(() => w() * layers());
  const cellCount = createMemo(() => {
    let count = 0;
    for (let t = 0; t < N; t++) {
      const lo = Math.max(0, t - w() + 1);
      count += t - lo + 1;
    }
    return count;
  });
  const totalCausal = (N * (N + 1)) / 2;
  const ratio = createMemo(() => cellCount() / totalCausal);

  const cellSize = 22;
  const gridLeft = 80;
  const gridTop = 60;

  function isAttended(t: number, s: number): boolean {
    if (s > t) return false; // causal
    return t - s < w();
  }

  return (
    <figure class="figure" data-testid="sliding-window">
      <svg viewBox="0 0 720 480" role="img" aria-label="Sliding window attention mask">
        <title>Sliding window causal attention mask. Rows are queries, columns are keys. A cell is filled iff the query attends to the key.</title>

        <text x={gridLeft + (N * cellSize) / 2} y={28} text-anchor="middle"
          font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
          Causal × window mask: W = {w()}, sequence length = {N}
        </text>

        {/* Axis labels */}
        <text x={gridLeft - 8} y={gridTop - 12} text-anchor="end" font-family="var(--mono)" font-size="10" fill="#5a5a55">queries</text>
        <text x={gridLeft + N * cellSize / 2} y={gridTop - 12} text-anchor="middle"
          font-family="var(--mono)" font-size="10" fill="#5a5a55">keys →</text>

        {/* Column index labels */}
        <For each={Array.from({ length: N }, (_, i) => i)}>
          {(s) => (
            <text
              x={gridLeft + s * cellSize + cellSize / 2}
              y={gridTop - 2}
              text-anchor="middle"
              font-family="var(--mono)"
              font-size="9"
              fill="#8a8a85"
            >{s}</text>
          )}
        </For>

        {/* Row index labels */}
        <For each={Array.from({ length: N }, (_, i) => i)}>
          {(t) => (
            <text
              x={gridLeft - 6}
              y={gridTop + t * cellSize + cellSize / 2 + 3}
              text-anchor="end"
              font-family="var(--mono)"
              font-size="9"
              fill="#8a8a85"
            >{t}</text>
          )}
        </For>

        {/* Grid cells */}
        <For each={Array.from({ length: N }, (_, i) => i)}>
          {(t) => (
            <For each={Array.from({ length: N }, (_, j) => j)}>
              {(s) => {
                const attended = isAttended(t, s);
                const causalOnly = s <= t && !attended;
                return (
                  <rect
                    x={gridLeft + s * cellSize}
                    y={gridTop + t * cellSize}
                    width={cellSize - 1}
                    height={cellSize - 1}
                    fill={attended ? "#1a4f7a" : causalOnly ? "#e8eef4" : "#fafaf7"}
                    stroke="#e3e3dc"
                    stroke-width="0.5"
                    opacity={attended ? 0.85 : 1}
                  />
                );
              }}
            </For>
          )}
        </For>

        {/* Annotation: highlight a single query row's band */}
        <text x={gridLeft + N * cellSize + 18} y={gridTop + 6 * cellSize + 14}
          font-family="var(--mono)" font-size="10" fill="#5a5a55">
          row t = 5 attends to keys [{Math.max(0, 5 - w() + 1)}..5]
        </text>

        {/* Stats panel */}
        <g transform={`translate(${gridLeft}, ${gridTop + N * cellSize + 30})`}>
          <text x={0} y={0} font-family="var(--mono)" font-size="11" fill="#5a5a55">
            attended cells / full causal triangle: {cellCount()}/{totalCausal} = {(ratio() * 100).toFixed(1)}%
          </text>
          <text x={0} y={20} font-family="var(--mono)" font-size="11" fill="#5a5a55">
            effective receptive field after {layers()} layer{layers() === 1 ? "" : "s"}: ≈ W × L = {effectiveReach()} tokens
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Window size W</span>
          <input
            type="range"
            aria-label="Window size W"
            min={1}
            max={N}
            step={1}
            value={w()}
            onInput={(e) => setW(+e.currentTarget.value)}
            aria-valuetext={`window size ${w()}`}
          />
          <span class="value">{w()}</span>
        </label>
        <label>
          <span>Stacked layers</span>
          <input
            type="range"
            aria-label="Stacked layers"
            min={1}
            max={32}
            step={1}
            value={layers()}
            onInput={(e) => setLayers(+e.currentTarget.value)}
            aria-valuetext={`${layers()} stacked SWA layer${layers() === 1 ? "" : "s"}`}
          />
          <span class="value">{layers()}</span>
        </label>
      </div>

      <figcaption>
        <strong>W = {w()}</strong> means every query attends to itself and the previous{" "}
        {w() - 1} {w() === 2 ? "key" : "keys"}. The receptive field grows linearly with depth:
        after L layers, a token effectively sees ≈ W × L predecessors.
      </figcaption>
    </figure>
  );
}
