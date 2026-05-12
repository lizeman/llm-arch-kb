/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * LightningTiles: visualize lightning attention's two-part computation across blocks of size B.
 *  - Intra-block: dense attention within each block (O(B^2 * d))
 *  - Inter-block: linear-attention prefix-sum recurrence between blocks (O(B * d * d))
 *
 * Show:
 *   - Sequence of L tokens divided into ceil(L/B) blocks
 *   - Per-block intra cost
 *   - Inter-block recurrence cost (the carried d × d state)
 *   - Total cost vs naive O(L^2)
 */

const D = 64;

export default function LightningTiles() {
  const [L, setL] = createSignal(2048);
  const [B, setB] = createSignal(128);

  const numBlocks = createMemo(() => Math.ceil(L() / B()));

  const intraCost = createMemo(() => numBlocks() * B() * B() * D);
  const interCost = createMemo(() => numBlocks() * B() * D * D);
  const totalCost = createMemo(() => intraCost() + interCost());
  const naiveCost = createMemo(() => L() * L() * D);
  const speedup = createMemo(() => naiveCost() / Math.max(1, totalCost()));

  // Geometry
  const X0 = 50;
  const Y0 = 50;
  const W = 600;
  const ROW_H = 50;
  const blockW = createMemo(() => W / numBlocks());

  return (
    <figure class="figure" data-testid="lightning-tiles">
      <svg viewBox="0 0 700 360" role="img" aria-label="Lightning Attention block decomposition">
        <title>
          Lightning Attention splits a length-L sequence into blocks of size B. Within each block
          it runs dense softmax attention; between blocks it carries a d × d state via linear
          attention's recurrence. Total cost is O(L * (B + d²/B)).
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
          Sequence of L = {L().toLocaleString()} tokens divided into {numBlocks()} blocks of B = {B()}
        </text>

        {/* Blocks */}
        <g>
          {Array.from({ length: numBlocks() }, (_, b) => {
            const x = X0 + b * blockW();
            return (
              <rect
                x={x}
                y={Y0}
                width={Math.max(0.5, blockW() - 1)}
                height={ROW_H}
                fill="#1a4f7a"
                opacity={0.25 + (b / Math.max(1, numBlocks() - 1)) * 0.4}
              />
            );
          })}
        </g>

        {/* Inter-block carried state arrows */}
        {Array.from({ length: numBlocks() - 1 }, (_, b) => {
          const x = X0 + (b + 1) * blockW();
          return (
            <g>
              <line
                x1={x - blockW() / 4}
                y1={Y0 + ROW_H + 18}
                x2={x + blockW() / 8}
                y2={Y0 + ROW_H + 18}
                stroke="#5a5a55"
                stroke-width="1"
                marker-end="url(#arrow)"
              />
            </g>
          );
        })}

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5a5a55" />
          </marker>
        </defs>

        <text x={X0} y={Y0 + ROW_H + 36} font-family="var(--mono)" font-size="9" fill="#5a5a55">
          intra-block: dense attention within each tile
        </text>
        <text x={X0} y={Y0 + ROW_H + 50} font-family="var(--mono)" font-size="9" fill="#5a5a55">
          inter-block: linear-recurrent d × d state ({D} × {D} = {(D * D).toLocaleString()} carried floats)
        </text>

        {/* Cost breakdown */}
        <g transform={`translate(${X0}, ${Y0 + 130})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            FLOP breakdown (with d = {D})
          </text>

          <text x="0" y="22" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Naive O(L² · d):
          </text>
          <rect x="200" y="14" width={Math.min(440, naiveCost() / 1e7)} height="12" fill="#8a8a85" opacity="0.7" />
          <text x="640" y="24" text-anchor="end" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            {(naiveCost() / 1e9).toFixed(2)} G
          </text>

          <text x="0" y="46" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Lightning intra (L · B · d):
          </text>
          <rect x="200" y="38" width={Math.min(440, intraCost() / 1e7)} height="12" fill="#1a4f7a" opacity="0.85" />
          <text x="640" y="48" text-anchor="end" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            {(intraCost() / 1e9).toFixed(3)} G
          </text>

          <text x="0" y="70" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            Lightning inter (L · d² / B):
          </text>
          <rect x="200" y="62" width={Math.min(440, interCost() / 1e7)} height="12" fill="#5a5a55" opacity="0.85" />
          <text x="640" y="72" text-anchor="end" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            {(interCost() / 1e9).toFixed(3)} G
          </text>

          <text x="0" y="100" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Total speedup: {speedup().toFixed(1)}× over naive at L = {L().toLocaleString()}
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Sequence length L</span>
          <input
            type="range"
            aria-label="Sequence length L"
            min={256}
            max={32768}
            step={256}
            value={L()}
            onInput={(e) => setL(+e.currentTarget.value)}
            aria-valuetext={`sequence length ${L().toLocaleString()}`}
          />
          <span class="value">{L().toLocaleString()}</span>
        </label>
        <label>
          <span>Block size B</span>
          <input
            type="range"
            aria-label="Block size B"
            min={32}
            max={512}
            step={32}
            value={B()}
            onInput={(e) => setB(+e.currentTarget.value)}
            aria-valuetext={`block size ${B()}`}
          />
          <span class="value">{B()}</span>
        </label>
      </div>

      <figcaption>
        The intra-block term grows linearly in L (each of L/B blocks does O(B² · d) work);
        the inter-block term also grows linearly in L (each of L/B blocks updates a d × d
        state at O(B · d²) cost). Total is O(L · (B + d²/B)) — minimized at B ≈ d. Compare to
        naive softmax attention's O(L² · d). At L = 32K the speedup is ~30× before kernel fusion
        and double-digits more after.
      </figcaption>
    </figure>
  );
}
