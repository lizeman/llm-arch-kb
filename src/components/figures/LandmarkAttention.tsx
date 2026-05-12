/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Landmark Attention visualization.
 * Sequence of length L is divided into chunks of size B. Each chunk ends with a landmark token.
 * For each query:
 *   Stage 1: attend to all landmarks (C of them, where C = L/B)
 *   Stage 2: pick top-K chunks; attend to all B tokens within each
 *
 * Cost: O(C + K * B) per query, vs O(L) naive.
 */

const L = 128;

function landmarkScore(q: number, c: number): number {
  // Pseudo-random "relevance" of chunk c to query q
  const h = ((q + 1) * 2654435761) ^ ((c + 17) * 40503);
  return (h & 0xffff) / 0x10000;
}

export default function LandmarkAttention() {
  const [B, setB] = createSignal(16);
  const [K, setK] = createSignal(2);

  const C = createMemo(() => Math.ceil(L / B()));

  // Pick the K best-scoring landmarks for a representative query (q = L - 1)
  const selected = createMemo(() => {
    const q = L - 1;
    const scores = Array.from({ length: C() }, (_, c) => ({
      c,
      s: landmarkScore(q, c),
    }));
    scores.sort((a, b) => b.s - a.s);
    return new Set(scores.slice(0, K()).map((x) => x.c));
  });

  // Geometry
  const X0 = 50;
  const Y0 = 60;
  const cellW = 8;
  const rowH = 50;

  return (
    <figure class="figure" data-testid="landmark-attention">
      <svg viewBox="0 0 700 300" role="img" aria-label="Landmark Attention two-stage selection">
        <title>
          Landmark Attention: each chunk has a landmark token (red); queries first attend to all
          landmarks, pick top-K chunks, then attend within those chunks only.
        </title>

        <text
          x={X0 + L * cellW / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >{`Sequence (L = ${L}) divided into ${C()} chunks of B = ${B()}`}</text>

        {/* Background grid */}
        <rect x={X0} y={Y0} width={L * cellW} height={rowH} fill="#fafaf7" stroke="#e3e3dc" />

        {/* Tokens, color-coded */}
        {Array.from({ length: L }, (_, i) => {
          const c = Math.floor(i / B());
          const isLandmark = (i + 1) % B() === 0;
          const isSelectedChunk = selected().has(c);
          let fill = "#5a5a55";
          let opacity = 0.3;
          if (isLandmark) {
            fill = "#1a4f7a";
            opacity = isSelectedChunk ? 0.95 : 0.65;
          } else if (isSelectedChunk) {
            fill = "#1a4f7a";
            opacity = 0.55;
          }
          return (
            <rect
              x={X0 + i * cellW}
              y={Y0}
              width={cellW - 0.5}
              height={rowH}
              fill={fill}
              opacity={opacity}
            />
          );
        })}

        {/* Chunk dividers */}
        {Array.from({ length: C() + 1 }, (_, c) => (
          <line
            x1={X0 + c * B() * cellW}
            y1={Y0 - 2}
            x2={X0 + c * B() * cellW}
            y2={Y0 + rowH + 2}
            stroke="#8a8a85"
            stroke-width="0.6"
          />
        ))}

        {/* Stage labels */}
        <g transform={`translate(${X0}, ${Y0 + rowH + 40})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            Two-stage attention
          </text>
          <text x="0" y="22" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Stage 1: query attends to {C()} landmarks (dark blue ticks) — picks top-{K()}
          </text>
          <text x="0" y="40" font-family="var(--mono)" font-size="11" fill="#1a4f7a">
            Stage 2: full attention within {K()} selected chunks ({K() * B()} tokens, highlighted)
          </text>
          <text x="0" y="62" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Total keys touched: {C() + K() * B()} (vs naive {L}) — {(L / Math.max(1, C() + K() * B())).toFixed(2)}× fewer
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Chunk size B</span>
          <input
            type="range"
            min={4}
            max={32}
            step={4}
            value={B()}
            onInput={(e) => setB(+e.currentTarget.value)}
            aria-valuetext={`chunk size ${B()} tokens per chunk, ${C()} chunks total`}
          />
          <span class="value">{B()}</span>
        </label>
        <label>
          <span>Top-K chunks to expand</span>
          <input
            type="range"
            min={1}
            max={C()}
            step={1}
            value={Math.min(K(), C())}
            onInput={(e) => setK(+e.currentTarget.value)}
            aria-valuetext={`expand top ${K()} chunks at full attention`}
          />
          <span class="value">{Math.min(K(), C())}</span>
        </label>
      </div>

      <figcaption>
        Each chunk ends with a learnable <strong>landmark token</strong> (dark blue tick). At
        inference, the query first attends only to the C landmarks — a cheap selection step that
        gates which chunks are interesting. Then, full attention runs only within the top-K
        chunks (the highlighted regions). Per-query cost drops from O(L) to O(C + K·B). The
        landmark tokens are trained jointly with the rest of the network, so they learn to
        encode each chunk's content well enough to support the selection.
      </figcaption>
    </figure>
  );
}
