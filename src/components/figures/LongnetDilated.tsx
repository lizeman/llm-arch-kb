/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * LongNet dilated-attention pattern visualization.
 * For sequence length L and head dilation r ∈ {1, 2, 4, ..., 2^(H-1)}, show:
 *   - Per-head: which keys each query attends to (stride-r within window W)
 *   - Combined receptive field across all heads
 */

const L = 64;

export default function LongnetDilated() {
  const [H, setH] = createSignal(4); // number of heads / dilation rates
  const [W, setW] = createSignal(4); // window per head (in stride units)
  const [headIdx, setHeadIdx] = createSignal(0); // currently highlighted head

  const dilations = createMemo(() => Array.from({ length: H() }, (_, i) => 1 << i));

  // For each query q, compute the set of keys attended at a given dilation r:
  //   {q - r, q - 2r, ..., q - W*r} ∩ [0, L)
  function attendedKeys(q: number, r: number): number[] {
    const out: number[] = [];
    for (let w = 0; w <= W(); w++) {
      const k = q - w * r;
      if (k >= 0) out.push(k);
    }
    return out;
  }

  // Combined: union across all dilations
  function combinedAttended(q: number): Set<number> {
    const set = new Set<number>();
    for (const r of dilations()) {
      for (const k of attendedKeys(q, r)) set.add(k);
    }
    return set;
  }

  // Geometry
  const cellSize = 8;
  const X0 = 50;
  const X1 = 380;
  const Y0 = 60;

  return (
    <figure class="figure" data-testid="longnet-dilated">
      <svg viewBox="0 0 700 600" role="img" aria-label="LongNet dilated attention pattern">
        <title>
          LongNet runs each attention head at a different stride r. The combined receptive field
          (right) covers a large portion of the sequence at O(L · log L) total cost.
        </title>

        {/* LEFT: single highlighted head */}
        <text
          x={X0 + (L * cellSize) / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Single head, dilation r = {dilations()[Math.min(headIdx(), H() - 1)]}
        </text>
        <rect x={X0} y={Y0} width={L * cellSize} height={L * cellSize} fill="#fafaf7" stroke="#e3e3dc" />
        {Array.from({ length: L }, (_, q) => {
          const r = dilations()[Math.min(headIdx(), H() - 1)];
          const ks = attendedKeys(q, r);
          return ks.map((k) => (
            <rect
              x={X0 + k * cellSize}
              y={Y0 + q * cellSize}
              width={cellSize - 0.4}
              height={cellSize - 0.4}
              fill="#1a4f7a"
              opacity="0.85"
            />
          ));
        })}

        {/* RIGHT: combined across heads */}
        <text
          x={X1 + (L * cellSize) / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Combined ({H()} heads, dilations [{dilations().join(", ")}])
        </text>
        <rect x={X1} y={Y0} width={L * cellSize} height={L * cellSize} fill="#fafaf7" stroke="#e3e3dc" />
        {Array.from({ length: L }, (_, q) => {
          const ks = combinedAttended(q);
          return Array.from(ks).map((k) => (
            <rect
              x={X1 + k * cellSize}
              y={Y0 + q * cellSize}
              width={cellSize - 0.4}
              height={cellSize - 0.4}
              fill="#1a4f7a"
              opacity="0.65"
            />
          ));
        })}

        {/* Labels */}
        <text x={X0} y={Y0 + L * cellSize + 14} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          k=0
        </text>
        <text
          x={X0 + L * cellSize}
          y={Y0 + L * cellSize + 14}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          k={L - 1}
        </text>
        <text x={X1} y={Y0 + L * cellSize + 14} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          k=0
        </text>
        <text
          x={X1 + L * cellSize}
          y={Y0 + L * cellSize + 14}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#8a8a85"
        >
          k={L - 1}
        </text>

        {/* Coverage stats */}
        <g transform={`translate(${X0}, ${Y0 + L * cellSize + 40})`}>
          <text x="0" y="0" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Per-head budget: W+1 = {W() + 1} keys per query
          </text>
          <text x="0" y="18" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Combined budget: H · (W+1) = {H() * (W() + 1)} keys per query
          </text>
          <text x="0" y="36" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Naive dense: L = {L} keys per query — {(L / Math.max(1, H() * (W() + 1))).toFixed(1)}× reduction
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Number of heads / dilation rates H</span>
          <input
            type="range"
            aria-label="Number of heads / dilation rates H"
            min={1}
            max={6}
            step={1}
            value={H()}
            onInput={(e) => {
              const v = +e.currentTarget.value;
              setH(v);
              if (headIdx() >= v) setHeadIdx(v - 1);
            }}
            aria-valuetext={`${H()} attention heads, dilations 1 to ${1 << (H() - 1)}`}
          />
          <span class="value">{H()}</span>
        </label>
        <label>
          <span>Window per head W</span>
          <input
            type="range"
            aria-label="Window per head W"
            min={1}
            max={16}
            step={1}
            value={W()}
            onInput={(e) => setW(+e.currentTarget.value)}
            aria-valuetext={`window of ${W()} stride steps per head`}
          />
          <span class="value">{W()}</span>
        </label>
        <label>
          <span>Highlighted head index</span>
          <input
            type="range"
            aria-label="Highlighted head index"
            min={0}
            max={H() - 1}
            step={1}
            value={Math.min(headIdx(), H() - 1)}
            onInput={(e) => setHeadIdx(+e.currentTarget.value)}
            aria-valuetext={`head index ${headIdx()}, dilation ${1 << headIdx()}`}
          />
          <span class="value">{Math.min(headIdx(), H() - 1)}</span>
        </label>
      </div>

      <figcaption>
        Each head attends to keys at a fixed stride r — head 0 attends locally (r = 1), head 1
        skips every other key (r = 2), and so on up to r = 2^(H−1). Per head's budget is small
        (W keys), but the union of all heads covers the sequence at multiple resolutions. Total
        cost is O(L · log L) when dilations span 1..L.
      </figcaption>
    </figure>
  );
}
