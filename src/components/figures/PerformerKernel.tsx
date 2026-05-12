/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Performer kernel decomposition visualizer.
 * Show the matmul reordering identity:
 *   softmax(QK^T) V ≈ φ(Q) (φ(K)^T V)
 *
 * For an N × d Q, K, V and feature dim m:
 *   - Naive: forms N × N attention matrix, costs O(N² d)
 *   - Performer: forms φ(K)^T V (m × d), costs O(N m d) per matmul, total O(N m d)
 *
 * Slider for N (sequence length) and m (feature dim).
 */

const D = 32;

export default function PerformerKernel() {
  const [N, setN] = createSignal(256);
  const [m, setM] = createSignal(64);

  const naiveCost = createMemo(() => N() * N() * D + N() * N() * D);
  const performerCost = createMemo(() => N() * m() * D + m() * N() * D + N() * m() * D);
  const speedup = createMemo(() => naiveCost() / Math.max(1, performerCost()));

  // Geometry
  const X0 = 50;
  const Y0 = 80;

  // Naive flow boxes (top): Q, K, K^T, QK^T (N × N), V, output
  function box(x: number, y: number, w: number, h: number, color: string, label: string, opacity = 0.7) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={color} opacity={opacity} stroke={color} />
        <text
          x={x + w / 2}
          y={y - 6}
          text-anchor="middle"
          font-family="var(--mono)"
          font-size="9"
          fill="#5a5a55"
        >{label}</text>
      </g>
    );
  }

  const SCALE = 90; // px for the L axis at L=256
  const SCALE_D = 50; // px for d axis at d=32

  const Nbar = createMemo(() => (N() / 512) * SCALE);
  const dBar = SCALE_D / 2;
  const mBar = createMemo(() => (m() / 256) * SCALE);

  return (
    <figure class="figure" data-testid="performer-kernel">
      <svg viewBox="0 0 700 400" role="img" aria-label="Performer kernel-decomposition visualization">
        <title>
          Performer approximates softmax(QK^T) as φ(Q) · φ(K)^T, then exploits matmul
          associativity to compute φ(K)^T V first (an m × d matrix), avoiding the N × N
          attention matrix entirely.
        </title>

        {/* NAIVE path */}
        <text x={X0} y={Y0 - 36} font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
          Naive: forms the full N × N attention matrix
        </text>

        {box(X0, Y0, dBar, Nbar(), "#5a5a55", "Q (N×d)")}
        <text x={X0 + dBar + 16} y={Y0 + Nbar() / 2 + 4} font-family="var(--mono)" font-size="14" fill="#5a5a55">·</text>
        {box(X0 + dBar + 32, Y0, Nbar(), dBar, "#5a5a55", "K^T (d×N)")}
        <text x={X0 + dBar + 32 + Nbar() + 16} y={Y0 + dBar / 2 + 4} font-family="var(--mono)" font-size="14" fill="#5a5a55">=</text>

        {box(X0 + dBar + 32 + Nbar() + 36, Y0, Nbar(), Nbar(), "#8a8a85", "softmax(QK^T) (N×N)", 0.55)}

        {/* PERFORMER path */}
        <text x={X0} y={Y0 + 170 - 36} font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
          Performer: reorder via φ(Q)·(φ(K)^T·V), no N × N matrix ever materialized
        </text>

        {box(X0, Y0 + 170, dBar, Nbar(), "#1a4f7a", "Q (N×d)")}
        <text x={X0 + dBar + 16} y={Y0 + 170 + Nbar() / 2 + 4} font-family="var(--mono)" font-size="14" fill="#1a4f7a">φ</text>
        {box(X0 + dBar + 32, Y0 + 170, mBar(), Nbar(), "#1a4f7a", "φ(Q) (N×m)")}
        <text x={X0 + dBar + 32 + mBar() + 16} y={Y0 + 170 + Nbar() / 2 + 4} font-family="var(--mono)" font-size="14" fill="#1a4f7a">·</text>
        {box(X0 + dBar + 32 + mBar() + 32, Y0 + 170, dBar, mBar(), "#1a4f7a", "φ(K)^T V (m×d)")}
        <text x={X0 + dBar + 32 + mBar() + 32 + dBar + 16} y={Y0 + 170 + mBar() / 2 + 4} font-family="var(--mono)" font-size="14" fill="#1a4f7a">=</text>
        {box(X0 + dBar + 32 + mBar() + 32 + dBar + 36, Y0 + 170, dBar, Nbar(), "#1a4f7a", "output (N×d)")}

        {/* Cost panel */}
        <g transform={`translate(${X0}, ${Y0 + 320})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            FLOP comparison (N = {N()}, d = {D}, m = {m()})
          </text>
          <text x="0" y="20" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Naive O(N² d): {(naiveCost() / 1e6).toFixed(2)} M FLOPs
          </text>
          <text x="0" y="38" font-family="var(--mono)" font-size="11" fill="#1a4f7a">
            Performer O(N m d): {(performerCost() / 1e6).toFixed(2)} M FLOPs
          </text>
          <text x="0" y="58" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Speedup: {speedup().toFixed(1)}× at these settings
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Sequence length N</span>
          <input
            type="range"
            min={32}
            max={512}
            step={32}
            value={N()}
            onInput={(e) => setN(+e.currentTarget.value)}
            aria-valuetext={`sequence length ${N()}`}
          />
          <span class="value">{N()}</span>
        </label>
        <label>
          <span>Feature dim m</span>
          <input
            type="range"
            min={8}
            max={256}
            step={8}
            value={m()}
            onInput={(e) => setM(+e.currentTarget.value)}
            aria-valuetext={`random-feature dimension ${m()}`}
          />
          <span class="value">{m()}</span>
        </label>
      </div>

      <figcaption>
        Performer's mechanism: replace softmax(qk^T/√d) with ⟨φ(q), φ(k)⟩ for a random feature
        map φ : ℝ^d → ℝ^m, then exploit associativity to compute φ(K)^T V (an m × d matrix)
        before multiplying by φ(Q) — never forming the N × N matrix. Cost drops from O(N²d) to
        O(Nmd), linear in sequence length. The φ map is chosen so the approximation is unbiased
        for the softmax kernel and works with causal masking (via a cumulative-sum recurrence).
      </figcaption>
    </figure>
  );
}
