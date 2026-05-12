/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * FlashAttention tiling visualizer.
 * Show the Q × K^T attention matrix grid (logical, not values) and outline the active
 * (B_r × B_c) tile being processed. Slider for B_r (query block size) and B_c (key block).
 *
 * Two side-by-side panels:
 *   Left: full L × L attention matrix grid; current tile highlighted in blue.
 *   Right: HBM/SRAM bookkeeping — show what's in each memory tier for the current tile.
 *
 * The narrative: with naive attention, the entire L × L matrix materializes in HBM. With
 * FlashAttention, only B_r × B_c (the current tile) is in SRAM at any moment, and we never
 * write the full matrix to HBM.
 */

const L = 64;

export default function FlashTiling() {
  const [Br, setBr] = createSignal(16);
  const [Bc, setBc] = createSignal(16);
  const [tileQ, setTileQ] = createSignal(0);
  const [tileK, setTileK] = createSignal(0);

  const tilesQ = createMemo(() => Math.ceil(L / Br()));
  const tilesK = createMemo(() => Math.ceil(L / Bc()));

  // Geometry — left panel
  const X0 = 50;
  const Y0 = 40;
  const SIZE = 240;
  const cellSize = createMemo(() => SIZE / L);

  // Right panel
  const X1 = 380;

  const naiveBytes = createMemo(() => L * L * 2); // bf16 attention matrix
  const flashBytes = createMemo(() => Br() * Bc() * 2 + (Br() + Bc()) * 64 * 2); // tile + Q/K rows in SRAM

  // Highlighted tile bounds
  const tileQ_clamped = createMemo(() => Math.min(tileQ(), tilesQ() - 1));
  const tileK_clamped = createMemo(() => Math.min(tileK(), tilesK() - 1));

  return (
    <figure class="figure" data-testid="flash-tiling">
      <svg viewBox="0 0 700 380" role="img" aria-label="FlashAttention tile visualization">
        <title>
          FlashAttention processes the L × L attention matrix in (B_r × B_c) tiles. Only one
          tile is in SRAM at a time; the full matrix is never materialized in HBM.
        </title>

        {/* LEFT: Q × K^T grid */}
        <text
          x={X0 + SIZE / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Attention matrix (L × L = {L} × {L})
        </text>

        <rect
          x={X0}
          y={Y0}
          width={SIZE}
          height={SIZE}
          fill="#f1f1ec"
          stroke="#e3e3dc"
        />
        {/* Causal-mask shading: upper triangle is masked out */}
        <path
          d={`M ${X0} ${Y0} L ${X0 + SIZE} ${Y0} L ${X0 + SIZE} ${Y0 + SIZE} Z`}
          fill="#fafaf7"
          opacity="0.7"
        />

        {/* Tile grid lines */}
        {Array.from({ length: tilesQ() + 1 }, (_, i) => (
          <line
            x1={X0}
            y1={Y0 + i * Br() * cellSize()}
            x2={X0 + SIZE}
            y2={Y0 + i * Br() * cellSize()}
            stroke="#5a5a55"
            stroke-width="0.6"
            opacity="0.35"
          />
        ))}
        {Array.from({ length: tilesK() + 1 }, (_, j) => (
          <line
            x1={X0 + j * Bc() * cellSize()}
            y1={Y0}
            x2={X0 + j * Bc() * cellSize()}
            y2={Y0 + SIZE}
            stroke="#5a5a55"
            stroke-width="0.6"
            opacity="0.35"
          />
        ))}

        {/* Highlight the active tile */}
        {(() => {
          const qi = tileQ_clamped();
          const kj = tileK_clamped();
          const tx = X0 + kj * Bc() * cellSize();
          const ty = Y0 + qi * Br() * cellSize();
          const tw = Math.min(Bc() * cellSize(), X0 + SIZE - tx);
          const th = Math.min(Br() * cellSize(), Y0 + SIZE - ty);
          return <rect x={tx} y={ty} width={tw} height={th} fill="#1a4f7a" opacity="0.55" />;
        })()}

        <text x={X0} y={Y0 + SIZE + 18} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          K (keys)
        </text>
        <text
          x={X0 - 8}
          y={Y0 + SIZE / 2}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
          transform={`rotate(-90, ${X0 - 8}, ${Y0 + SIZE / 2})`}
        >
          Q (queries)
        </text>

        {/* RIGHT: memory bookkeeping */}
        <text
          x={X1 + 130}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Memory traffic per attention call
        </text>

        {/* Naive */}
        <g transform={`translate(${X1}, ${Y0 + 10})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="11" font-weight="600" fill="#1a1a1a">
            Naive attention
          </text>
          <text x="0" y="20" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            HBM ↔ compute: writes full L × L matrix
          </text>
          <rect x="0" y="30" width={Math.min(260, naiveBytes() / 32)} height="14" fill="#8a8a85" opacity="0.7" />
          <text x={Math.min(260, naiveBytes() / 32) + 6} y="42" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            {(naiveBytes() / 1024).toFixed(1)} KB
          </text>
        </g>

        {/* Flash */}
        <g transform={`translate(${X1}, ${Y0 + 90})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="11" font-weight="600" fill="#1a1a1a">
            FlashAttention (current tile)
          </text>
          <text x="0" y="20" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            SRAM holds only B_r × B_c plus Q/K row strips
          </text>
          <rect x="0" y="30" width={Math.min(260, flashBytes() / 32)} height="14" fill="#1a4f7a" opacity="0.85" />
          <text x={Math.min(260, flashBytes() / 32) + 6} y="42" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            {(flashBytes() / 1024).toFixed(1)} KB
          </text>
        </g>

        {/* Tile counters */}
        <g transform={`translate(${X1}, ${Y0 + 180})`}>
          <text x="0" y="0" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Tile grid: {tilesQ()} × {tilesK()} ({tilesQ() * tilesK()} tiles total)
          </text>
          <text x="0" y="20" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Active tile: ({tileQ_clamped()}, {tileK_clamped()})
          </text>
          <text x="0" y="40" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Reduction: {(naiveBytes() / Math.max(1, flashBytes())).toFixed(1)}× less SRAM at peak
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Q tile size B_r</span>
          <input
            type="range"
            min={4}
            max={32}
            step={4}
            value={Br()}
            onInput={(e) => {
              const v = +e.currentTarget.value;
              setBr(v);
              if (tileQ() >= Math.ceil(L / v)) setTileQ(0);
            }}
            aria-valuetext={`query tile size B_r ${Br()}`}
          />
          <span class="value">{Br()}</span>
        </label>
        <label>
          <span>K tile size B_c</span>
          <input
            type="range"
            min={4}
            max={32}
            step={4}
            value={Bc()}
            onInput={(e) => {
              const v = +e.currentTarget.value;
              setBc(v);
              if (tileK() >= Math.ceil(L / v)) setTileK(0);
            }}
            aria-valuetext={`key tile size B_c ${Bc()}`}
          />
          <span class="value">{Bc()}</span>
        </label>
        <label>
          <span>Active Q-tile index</span>
          <input
            type="range"
            min={0}
            max={tilesQ() - 1}
            step={1}
            value={tileQ_clamped()}
            onInput={(e) => setTileQ(+e.currentTarget.value)}
            aria-valuetext={`active query tile ${tileQ_clamped()} of ${tilesQ() - 1}`}
          />
          <span class="value">{tileQ_clamped()}</span>
        </label>
        <label>
          <span>Active K-tile index</span>
          <input
            type="range"
            min={0}
            max={tilesK() - 1}
            step={1}
            value={tileK_clamped()}
            onInput={(e) => setTileK(+e.currentTarget.value)}
            aria-valuetext={`active key tile ${tileK_clamped()} of ${tilesK() - 1}`}
          />
          <span class="value">{tileK_clamped()}</span>
        </label>
      </div>

      <figcaption>
        Naive attention writes the full L×L matrix to HBM, then reads it back for the softmax —
        for L = 8K head_dim = 128 in bf16, that's hundreds of MB per layer per call. FlashAttention
        keeps only the highlighted (B_r × B_c) tile in SRAM at any moment, plus the
        corresponding Q and K row strips, and never materializes the full matrix. With well-chosen
        tile sizes the whole computation lives on-chip.
      </figcaption>
    </figure>
  );
}
