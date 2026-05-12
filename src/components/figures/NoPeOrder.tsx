/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * NoPe order leakage demo.
 * Show two L × L attention masks side by side:
 *   - Bidirectional (encoder-style): symmetric. With no PE, attention is permutation-invariant.
 *   - Causal (decoder-style): lower-triangular. Each query has a different number of accessible
 *     keys (0 left of itself, 1 left of itself, ...). That asymmetry IS the position signal.
 *
 * Slider: token position to highlight. Show the highlighted query's row in each mask.
 * The "accessible keys" count for the highlighted query — different across positions in causal,
 * identical across positions in bidirectional.
 */

const L = 32;

export default function NoPeOrder() {
  const [t, setT] = createSignal(8);

  // Two L×L masks side by side. cellSize chosen so both grids + gutters fit the viewBox width.
  const cellSize = 9;
  const X0 = 50;
  const X1 = X0 + L * cellSize + 40; // 40px gutter between the two masks
  const Y0 = 50;

  const accessibleBidir = L;
  const accessibleCausal = createMemo(() => t() + 1);

  function maskCell(i: number, j: number, kind: "bidir" | "causal", highlighted: boolean) {
    const xBase = kind === "bidir" ? X0 : X1;
    const inMask = kind === "bidir" ? true : j <= i;
    const isQueryRow = i === t();
    let fill = inMask ? "#1a4f7a" : "#fafaf7";
    let opacity = inMask ? 0.18 : 0;
    if (isQueryRow && inMask) {
      fill = "#1a4f7a";
      opacity = 0.85;
    } else if (isQueryRow) {
      fill = "#e3e3dc";
      opacity = 0.5;
    }
    return (
      <rect
        x={xBase + j * cellSize}
        y={Y0 + i * cellSize}
        width={cellSize - 0.5}
        height={cellSize - 0.5}
        fill={fill}
        opacity={opacity}
        stroke={isQueryRow && inMask ? "#1a4f7a" : "none"}
        stroke-width="0.4"
      />
    );
  }

  const cells = createMemo(() => {
    const rows: { i: number; j: number }[] = [];
    for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) rows.push({ i, j });
    return rows;
  });

  return (
    <figure class="figure" data-testid="nope-order">
      <svg viewBox="0 0 700 500" role="img" aria-label="NoPE causal mask order leakage demonstration">
        <title>
          Two attention masks: bidirectional (every query sees every key) and causal (each query
          sees only itself and earlier keys). With no positional encoding, the causal mask is the
          only thing that distinguishes position 0 from position L-1.
        </title>

        <text
          x={X0 + (L * cellSize) / 2}
          y={Y0 - 12}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Bidirectional mask
        </text>
        <text
          x={X1 + (L * cellSize) / 2}
          y={Y0 - 12}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Causal mask
        </text>

        {cells().map((c) => maskCell(c.i, c.j, "bidir", false))}
        {cells().map((c) => maskCell(c.i, c.j, "causal", false))}

        {/* Axis labels */}
        <text x={X0} y={Y0 + L * cellSize + 16} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          k = 0
        </text>
        <text
          x={X0 + L * cellSize}
          y={Y0 + L * cellSize + 16}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          k = {L - 1}
        </text>
        <text x={X1} y={Y0 + L * cellSize + 16} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          k = 0
        </text>
        <text
          x={X1 + L * cellSize}
          y={Y0 + L * cellSize + 16}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          k = {L - 1}
        </text>

        <text
          x={X0 - 6}
          y={Y0 + t() * cellSize + cellSize / 2 + 3}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#1a4f7a"
        >
          q={t()}
        </text>
        <text
          x={X1 - 6}
          y={Y0 + t() * cellSize + cellSize / 2 + 3}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#1a4f7a"
        >
          q={t()}
        </text>

        {/* Counters */}
        <g transform={`translate(${X0}, ${Y0 + L * cellSize + 50})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            Query at position {t()}
          </text>
          <text x="0" y="22" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Bidirectional: {accessibleBidir} accessible keys (same for every query)
          </text>
          <text x="0" y="42" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Causal: {accessibleCausal()} accessible keys (varies by position)
          </text>
          <text x="0" y="68" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            With no positional encoding, the causal "accessible keys" count IS the position signal.
          </text>
          <text x="0" y="84" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Bidirectional + no PE = permutation-invariant. The model literally cannot distinguish positions.
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Highlighted query position</span>
          <input
            type="range"
            aria-label="Highlighted query position"
            min={0}
            max={L - 1}
            step={1}
            value={t()}
            onInput={(e) => setT(+e.currentTarget.value)}
            aria-valuetext={`query position ${t()} of ${L - 1}`}
          />
          <span class="value">{t()}</span>
        </label>
      </div>

      <figcaption>
        The two masks differ only in which keys each query is allowed to attend to. In the
        bidirectional case (left), every query sees every key — a swap of two tokens leaves the
        attention pattern identical. In the causal case (right), the query at position {t()} sees{" "}
        {accessibleCausal()} keys; a different position sees a different number. <strong>That
        count, propagating through L stacked attention layers, is enough for a NoPE decoder to
        recover token order.</strong>
      </figcaption>
    </figure>
  );
}
