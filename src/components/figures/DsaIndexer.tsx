/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * DSA indexer + top-K visualizer.
 * For a single query at position L-1, generate pseudo-random "indexer scores" for keys
 * 0..L-1. Show:
 *   - All L keys as a row of cells, opacity proportional to indexer score
 *   - The top-K selected cells highlighted in blue
 *   - Cost panel: full-MLA O(L) vs DSA O(K)
 */

const L = 256;

function indexerScore(k: number, query_seed: number): number {
  // Six "needle" peaks whose positions depend on the query seed — illustrative of
  // how a different query attends to a different set of historical positions.
  let s = 0;
  for (let p = 0; p < 6; p++) {
    // Hash (seed, p) to a position in [0, L)
    const h = (((query_seed + 1) * 2654435761) ^ ((p + 11) * 40503)) >>> 0;
    const peak = h % 240 + 8;
    const off = k - peak;
    s += Math.exp(-(off * off) / 30);
  }
  // Background pseudo-noise
  const hh = ((k + 1) * 2654435761) ^ ((query_seed + 7) * 40503);
  s += ((hh & 0xff) / 0x100) * 0.25;
  return s;
}

export default function DsaIndexer() {
  const [K, setK] = createSignal(32);
  const [seed, setSeed] = createSignal(0);

  const scores = createMemo(() => {
    const out: number[] = new Array(L);
    for (let k = 0; k < L; k++) out[k] = indexerScore(k, seed());
    return out;
  });

  const topKSet = createMemo(() => {
    const indexed = scores().map((s, i) => ({ s, i }));
    indexed.sort((a, b) => b.s - a.s);
    const set = new Set<number>();
    for (let j = 0; j < Math.min(K(), L); j++) set.add(indexed[j].i);
    return set;
  });

  const maxScore = createMemo(() => Math.max(...scores()));

  // Geometry
  const X0 = 50;
  const Y0 = 60;
  const W = 600;
  const ROW_H = 40;
  const cellW = W / L;

  return (
    <figure class="figure" data-testid="dsa-indexer">
      <svg viewBox="0 0 700 280" role="img" aria-label="DSA indexer top-K key selection">
        <title>
          DSA's Lightning Indexer scores all L keys for the current query; full attention runs
          only over the top-K selected. Drag K to see the selection sparsify.
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
          Indexer scores over L = {L} keys (gray) — top-{K()} selected (blue)
        </text>

        {/* Keys row, opacity = score */}
        <g>
          {scores().map((s, k) => {
            const op = s / maxScore();
            const isTopK = topKSet().has(k);
            return (
              <rect
                x={X0 + k * cellW}
                y={Y0}
                width={Math.max(0.5, cellW - 0.3)}
                height={ROW_H}
                fill={isTopK ? "#1a4f7a" : "#5a5a55"}
                opacity={isTopK ? Math.max(0.55, op) : op * 0.65}
              />
            );
          })}
        </g>
        <text x={X0} y={Y0 + ROW_H + 16} font-family="var(--mono)" font-size="9" fill="#8a8a85">
          key index 0
        </text>
        <text x={X0 + W} y={Y0 + ROW_H + 16} text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8a8a85">
          key index {L - 1} (just before current query)
        </text>

        {/* Cost panel */}
        <g transform={`translate(${X0}, ${Y0 + 80})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            Per-token attention cost
          </text>

          <text x="0" y="22" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Full MLA: {L} key dot products
          </text>
          <rect x="160" y="12" width={Math.min(440, L * 1.6)} height="14" fill="#8a8a85" opacity="0.7" />
          <text x={Math.min(440, L * 1.6) + 168} y="24" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            O(L)
          </text>

          <text x="0" y="48" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            DSA: {K()} key dot products
          </text>
          <rect x="160" y="38" width={Math.min(440, K() * 1.6)} height="14" fill="#1a4f7a" opacity="0.85" />
          <text x={Math.min(440, K() * 1.6) + 168} y="50" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            O(K)
          </text>

          <text x="0" y="78" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Sparsity: {((1 - K() / L) * 100).toFixed(0)}% of keys skipped — {(L / Math.max(1, K())).toFixed(1)}× speedup
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Top-K budget</span>
          <input
            type="range"
            aria-label="Top-K budget"
            min={4}
            max={L}
            step={1}
            value={K()}
            onInput={(e) => setK(+e.currentTarget.value)}
            aria-valuetext={`top-K budget ${K()} of ${L} keys`}
          />
          <span class="value">{K()}</span>
        </label>
        <label>
          <span>Query seed (regenerate score pattern)</span>
          <input
            type="range"
            aria-label="Query seed (regenerate score pattern)"
            min={0}
            max={31}
            step={1}
            value={seed()}
            onInput={(e) => setSeed(+e.currentTarget.value)}
            aria-valuetext={`query seed ${seed()}; changes the indexer score pattern`}
          />
          <span class="value">{seed()}</span>
        </label>
      </div>

      <figcaption>
        The indexer concentrates score mass on a small number of "needle" positions — exactly
        the keys the full attention would also up-weight. By restricting MLA's expensive
        per-query work to the top-{K()} highest-indexer-score keys, DSA cuts attention compute
        from O(L) to O(K) without changing the cached representation. The cost is one cheap
        indexer pass over all L keys, with much smaller hidden dim than the main attention.
      </figcaption>
    </figure>
  );
}
