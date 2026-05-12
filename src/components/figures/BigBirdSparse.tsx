/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * BigBird sparse attention pattern visualization.
 * For sequence length L, mark cells (q, k) that are attended:
 *   - Window: |q - k| <= W
 *   - Random: r random keys per query (deterministic by seed)
 *   - Global: G fixed positions visible to/from every query
 *
 * Sliders for W, r, G. Color cells by which pattern includes them.
 */

const L = 64;

function rngForQuery(q: number, seed: number, count: number, max: number): number[] {
  // Tiny LCG seeded by q + seed; pick `count` distinct positions in [0, max)
  let s = ((q + 1) * 2654435761 + (seed + 7) * 40503) >>> 0;
  const out: Set<number> = new Set();
  while (out.size < count && out.size < max) {
    s = (s * 1103515245 + 12345) >>> 0;
    out.add(s % max);
  }
  return Array.from(out);
}

export default function BigBirdSparse() {
  const [W, setW] = createSignal(4);
  const [R, setR] = createSignal(3);
  const [G, setG] = createSignal(2);

  // Geometry
  const cellSize = 8;
  const X0 = 80;
  const Y0 = 50;

  const totalCells = createMemo(() => L * L);
  const attendedCells = createMemo(() => {
    const set = new Set<string>();
    for (let q = 0; q < L; q++) {
      // Window
      for (let k = Math.max(0, q - W()); k <= Math.min(L - 1, q + W()); k++) {
        set.add(`${q}.${k}`);
      }
      // Random
      const r = rngForQuery(q, 17, R(), L);
      for (const k of r) set.add(`${q}.${k}`);
      // Global
      for (let g = 0; g < G(); g++) {
        set.add(`${q}.${g}`);
        set.add(`${g}.${q}`);
      }
    }
    return set;
  });

  function cellKind(q: number, k: number): "window" | "random" | "global" | null {
    if (k < G() || q < G()) return "global";
    if (Math.abs(q - k) <= W()) return "window";
    if (rngForQuery(q, 17, R(), L).includes(k)) return "random";
    return null;
  }

  return (
    <figure class="figure" data-testid="bigbird-sparse">
      <svg viewBox="0 0 700 600" role="img" aria-label="BigBird sparse attention pattern">
        <title>
          BigBird's three structured patterns: a window of width 2W around the diagonal, R random
          keys per query, and G global positions visible to and from everyone. Drag sliders to
          see the patterns combine.
        </title>

        <text
          x={X0 + (L * cellSize) / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Attention pattern (L = {L}; sparsity = {((1 - attendedCells().size / totalCells()) * 100).toFixed(1)}%)
        </text>

        {/* Background grid */}
        <rect x={X0} y={Y0} width={L * cellSize} height={L * cellSize} fill="#fafaf7" stroke="#e3e3dc" />

        {/* Cells */}
        {Array.from({ length: L }, (_, q) =>
          Array.from({ length: L }, (_, k) => {
            const kind = cellKind(q, k);
            if (!kind) return null;
            const fill = kind === "window" ? "#1a4f7a" : kind === "global" ? "#5a5a55" : "#8a8a85";
            const opacity = kind === "window" ? 0.85 : kind === "global" ? 0.7 : 0.55;
            return (
              <rect
                x={X0 + k * cellSize}
                y={Y0 + q * cellSize}
                width={cellSize - 0.4}
                height={cellSize - 0.4}
                fill={fill}
                opacity={opacity}
              />
            );
          }),
        )}

        {/* Axis labels */}
        <text x={X0 - 6} y={Y0 + 6} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          q=0
        </text>
        <text x={X0 - 6} y={Y0 + L * cellSize} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          q={L - 1}
        </text>
        <text x={X0} y={Y0 + L * cellSize + 14} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          k=0
        </text>
        <text x={X0 + L * cellSize} y={Y0 + L * cellSize + 14} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          k={L - 1}
        </text>

        {/* Legend */}
        <g transform={`translate(${X0 + L * cellSize + 30}, ${Y0 + 10})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="11" font-weight="600" fill="#1a1a1a">
            Patterns
          </text>
          <rect x="0" y="14" width="14" height="14" fill="#1a4f7a" opacity="0.85" />
          <text x="20" y="25" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Window (|q−k| ≤ W)
          </text>
          <rect x="0" y="34" width="14" height="14" fill="#8a8a85" opacity="0.55" />
          <text x="20" y="45" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Random (R per query)
          </text>
          <rect x="0" y="54" width="14" height="14" fill="#5a5a55" opacity="0.7" />
          <text x="20" y="65" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Global (first G rows/cols)
          </text>

          <text x="0" y="100" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Attended: {attendedCells().size}/{totalCells()} cells
          </text>
          <text x="0" y="116" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Naive dense: O(L²) = {L * L}
          </text>
          <text x="0" y="132" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            BigBird: O(W + R + G)·L ≈ {(W() * 2 + R() + G() * 2) * L}
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Window width W</span>
          <input
            type="range"
            aria-label="Window width W"
            min={0}
            max={16}
            step={1}
            value={W()}
            onInput={(e) => setW(+e.currentTarget.value)}
            aria-valuetext={`window width ${W()} on each side of the diagonal`}
          />
          <span class="value">{W()}</span>
        </label>
        <label>
          <span>Random keys per query R</span>
          <input
            type="range"
            aria-label="Random keys per query R"
            min={0}
            max={8}
            step={1}
            value={R()}
            onInput={(e) => setR(+e.currentTarget.value)}
            aria-valuetext={`${R()} random keys per query`}
          />
          <span class="value">{R()}</span>
        </label>
        <label>
          <span>Global positions G</span>
          <input
            type="range"
            aria-label="Global positions G"
            min={0}
            max={6}
            step={1}
            value={G()}
            onInput={(e) => setG(+e.currentTarget.value)}
            aria-valuetext={`${G()} global positions visible to/from every query`}
          />
          <span class="value">{G()}</span>
        </label>
      </div>

      <figcaption>
        BigBird combines three patterns. The <strong>window</strong> (blue) gives every query
        local context. The <strong>random</strong> picks (light gray) provide long-range
        connectivity and let the paper prove universal approximation properties. The
        <strong>global</strong> set (dark gray) connects every query to a small fixed group
        and vice versa — the rows AND columns at indices 0..G−1 are filled. Total attended
        cells grow O(L), not O(L²).
      </figcaption>
    </figure>
  );
}
