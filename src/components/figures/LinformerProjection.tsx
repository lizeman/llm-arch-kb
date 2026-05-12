/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Linformer projection visualization.
 * Show K matrix (L rows × d_h columns) being projected to (k rows × d_h columns) by E.
 * Slider for k (projection rank). Show resulting attention matrix is L × k.
 *
 * Use simple boxes/shapes to convey the dimensionality reduction.
 */

const L = 64;
const D_H = 32;

export default function LinformerProjection() {
  const [k, setK] = createSignal(16);

  // Geometry
  const X0 = 50;
  const Y0 = 70;
  const SCALE = 4;
  const k_clamped = () => Math.min(k(), L);

  const naiveCost = createMemo(() => L * L * D_H);
  const linformerCost = createMemo(() => L * k_clamped() * D_H + L * D_H * k_clamped());

  return (
    <figure class="figure" data-testid="linformer-projection">
      <svg viewBox="0 0 700 360" role="img" aria-label="Linformer K-projection visualization">
        <title>
          Linformer multiplies K and V by learned matrices E, F ∈ ℝ^(k × L) to reduce the
          sequence axis from L to k. The attention matrix is L × k instead of L × L.
        </title>

        {/* Original K matrix */}
        <text x={X0 + 50} y={Y0 - 20} text-anchor="middle" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
          K (L × d_h)
        </text>
        <rect
          x={X0}
          y={Y0}
          width={D_H * SCALE / 4}
          height={L * SCALE / 4}
          fill="#5a5a55"
          opacity="0.6"
          stroke="#5a5a55"
        />
        <text
          x={X0 - 5}
          y={Y0 + (L * SCALE) / 8}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#5a5a55"
        >{`L = ${L}`}</text>
        <text
          x={X0 + (D_H * SCALE) / 8}
          y={Y0 + (L * SCALE) / 4 + 12}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="9"
          fill="#5a5a55"
        >{`d_h = ${D_H}`}</text>

        {/* Multiplied by E (k × L) → produces K' = E·K (k × d_h) */}
        <text x={X0 + 105} y={Y0 + L * SCALE / 8 + 4} font-family="var(--mono)" font-size="20" fill="#5a5a55">
          →
        </text>
        <text x={X0 + 105} y={Y0 + L * SCALE / 8 + 28} font-family="var(--mono)" font-size="9" fill="#1a4f7a">
          E · K
        </text>

        {/* Projected K' = E^T K (k × d_h) */}
        <text
          x={X0 + 200}
          y={Y0 - 20}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="11"
          fill="#1a4f7a"
        >
          K' (k × d_h)
        </text>
        <rect
          x={X0 + 160}
          y={Y0}
          width={D_H * SCALE / 4}
          height={k_clamped() * SCALE / 4}
          fill="#1a4f7a"
          opacity="0.7"
          stroke="#1a4f7a"
        />
        <text
          x={X0 + 155}
          y={Y0 + (k_clamped() * SCALE) / 8}
          text-anchor="end"
          font-family="var(--mono)"
          font-size="9"
          fill="#1a4f7a"
        >{`k = ${k_clamped()}`}</text>

        {/* Resulting attention matrix Q K'^T (L × k) */}
        <text x={X0 + 380} y={Y0 - 20} text-anchor="middle" font-family="var(--mono)" font-size="11" fill="#1a4f7a">
          softmax(Q · K'^T)
        </text>
        <rect
          x={X0 + 340}
          y={Y0}
          width={k_clamped() * SCALE / 4}
          height={L * SCALE / 4}
          fill="#1a4f7a"
          opacity="0.6"
          stroke="#1a4f7a"
        />
        <text
          x={X0 + 340 + (k_clamped() * SCALE) / 8}
          y={Y0 + (L * SCALE) / 4 + 12}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="9"
          fill="#1a4f7a"
        >{`k = ${k_clamped()}`}</text>

        {/* Compare to naive */}
        <text x={X0 + 520} y={Y0 - 20} text-anchor="middle" font-family="var(--mono)" font-size="11" fill="#5a5a55">
          softmax(Q · K^T)
        </text>
        <rect
          x={X0 + 480}
          y={Y0}
          width={L * SCALE / 4}
          height={L * SCALE / 4}
          fill="#5a5a55"
          opacity="0.4"
          stroke="#5a5a55"
        />
        <text
          x={X0 + 480 + (L * SCALE) / 8}
          y={Y0 + (L * SCALE) / 4 + 12}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="9"
          fill="#5a5a55"
        >naive: L × L</text>

        {/* Cost panel */}
        <g transform={`translate(${X0}, ${Y0 + 130})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            FLOP comparison (d_h = {D_H})
          </text>
          <text x="0" y="22" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Naive softmax:    L · L · d_h = {(naiveCost() / 1000).toFixed(1)} K
          </text>
          <text x="0" y="38" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Linformer:        L · k · d_h × 2 ≈ {(linformerCost() / 1000).toFixed(1)} K
          </text>
          <text x="0" y="60" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Speedup: {(naiveCost() / Math.max(1, linformerCost())).toFixed(2)}× at this k
          </text>
          <text x="0" y="78" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Note: E and F are learned per layer; depend on a fixed sequence length.
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Projection rank k</span>
          <input
            type="range"
            aria-label="Projection rank k"
            min={1}
            max={L}
            step={1}
            value={k_clamped()}
            onInput={(e) => setK(+e.currentTarget.value)}
            aria-valuetext={`projection rank ${k_clamped()} of original sequence length ${L}`}
          />
          <span class="value">{k_clamped()}</span>
        </label>
      </div>

      <figcaption>
        Linformer compresses the sequence axis of K and V from L to k via two learned matrices
        E, F ∈ ℝ^(k × L). The attention matrix becomes L × k instead of L × L; total cost is
        O(L · k · d_h). The catch: <strong>E and F are tied to a specific L</strong>, so a model
        trained at L = 4096 doesn't transfer cleanly to L = 8192. Linformer was a clean
        encoder-side technique; for decoders the fixed-L coupling never made sense.
      </figcaption>
    </figure>
  );
}
