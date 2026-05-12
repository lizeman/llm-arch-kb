/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Memorizing Transformers kNN visualization.
 * A persistent memory bank holds N stored (key, value) pairs as 2D points (illustrative
 * projection of d-dim keys). A query is shown at the center; the top-K nearest neighbors are
 * highlighted and "retrieved" for the current attention pass.
 *
 * Slider for K (number of neighbors), N (memory size).
 */

function rngPoint(seed: number, span: number): { x: number; y: number } {
  let s = ((seed + 1) * 2654435761) >>> 0;
  s = (s * 1103515245 + 12345) >>> 0;
  const u1 = ((s & 0xffffffff) / 0xffffffff) || 1e-9;
  s = (s * 1103515245 + 12345) >>> 0;
  const u2 = ((s & 0xffffffff) / 0xffffffff) || 1e-9;
  return {
    x: Math.cos(2 * Math.PI * u1) * span * Math.sqrt(-2 * Math.log(u2)) * 0.4,
    y: Math.sin(2 * Math.PI * u1) * span * Math.sqrt(-2 * Math.log(u2)) * 0.4,
  };
}

export default function MemorizingKnn() {
  const [N, setN] = createSignal(80);
  const [K, setK] = createSignal(8);
  const [qx, setQx] = createSignal(0);
  const [qy, setQy] = createSignal(0);

  const points = createMemo(() => {
    const out: { x: number; y: number; idx: number }[] = [];
    for (let i = 0; i < N(); i++) {
      const p = rngPoint(i + 11, 1.0);
      out.push({ x: p.x, y: p.y, idx: i });
    }
    return out;
  });

  // Distance from query to each point, return top-K indices
  const topK = createMemo(() => {
    const dists = points().map((p) => ({
      idx: p.idx,
      d: (p.x - qx()) ** 2 + (p.y - qy()) ** 2,
    }));
    dists.sort((a, b) => a.d - b.d);
    return new Set(dists.slice(0, K()).map((p) => p.idx));
  });

  // Geometry
  const X0 = 60;
  const Y0 = 50;
  const SIZE = 360;
  const CX = X0 + SIZE / 2;
  const CY = Y0 + SIZE / 2;

  const screenX = (x: number) => CX + x * (SIZE / 2);
  const screenY = (y: number) => CY - y * (SIZE / 2);

  return (
    <figure class="figure" data-testid="memorizing-knn">
      <svg viewBox="0 0 700 440" role="img" aria-label="Memorizing Transformers kNN retrieval">
        <title>
          Memory bank of N (key, value) pairs shown as 2D points. The query (red cross) retrieves
          the K nearest neighbors (highlighted), which are then merged into the current
          attention pass.
        </title>

        <text
          x={CX}
          y={Y0 - 16}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >{`Memory bank (N = ${N()} stored K, V pairs)`}</text>

        {/* Bounding box */}
        <rect x={X0} y={Y0} width={SIZE} height={SIZE} fill="#fafaf7" stroke="#e3e3dc" />

        {/* Grid */}
        <line x1={CX} y1={Y0} x2={CX} y2={Y0 + SIZE} stroke="#e3e3dc" />
        <line x1={X0} y1={CY} x2={X0 + SIZE} y2={CY} stroke="#e3e3dc" />

        {/* Memory points */}
        {points().map((p) => {
          const isTop = topK().has(p.idx);
          return (
            <circle
              cx={screenX(p.x)}
              cy={screenY(p.y)}
              r={isTop ? 5 : 3}
              fill={isTop ? "#1a4f7a" : "#5a5a55"}
              opacity={isTop ? 0.95 : 0.45}
            />
          );
        })}

        {/* Retrieval lines */}
        {points()
          .filter((p) => topK().has(p.idx))
          .map((p) => (
            <line
              x1={screenX(qx())}
              y1={screenY(qy())}
              x2={screenX(p.x)}
              y2={screenY(p.y)}
              stroke="#1a4f7a"
              stroke-width="0.6"
              opacity="0.5"
            />
          ))}

        {/* Query */}
        <line
          x1={screenX(qx()) - 8}
          y1={screenY(qy())}
          x2={screenX(qx()) + 8}
          y2={screenY(qy())}
          stroke="#1a4f7a"
          stroke-width="2"
        />
        <line
          x1={screenX(qx())}
          y1={screenY(qy()) - 8}
          x2={screenX(qx())}
          y2={screenY(qy()) + 8}
          stroke="#1a4f7a"
          stroke-width="2"
        />
        <text
          x={screenX(qx()) + 12}
          y={screenY(qy()) - 10}
          font-family="var(--mono)"
          font-size="10"
          fill="#1a4f7a"
          font-weight="600"
        >query</text>

        {/* Stats */}
        <text x={X0} y={Y0 + SIZE + 24} font-family="var(--mono)" font-size="11" fill="#1a1a1a">
          Retrieved {K()} / {N()} keys for this query — attention runs only over these plus the
          local window.
        </text>
        <text x={X0} y={Y0 + SIZE + 42} font-family="var(--mono)" font-size="11" fill="#5a5a55">
          Effective reach = window + retrieved memory tokens, regardless of memory size N.
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Memory bank size N</span>
          <input
            type="range"
            min={20}
            max={200}
            step={5}
            value={N()}
            onInput={(e) => setN(+e.currentTarget.value)}
            aria-valuetext={`memory bank size ${N()} stored key-value pairs`}
          />
          <span class="value">{N()}</span>
        </label>
        <label>
          <span>Retrieval budget K</span>
          <input
            type="range"
            min={1}
            max={32}
            step={1}
            value={K()}
            onInput={(e) => setK(+e.currentTarget.value)}
            aria-valuetext={`retrieve top ${K()} nearest neighbors`}
          />
          <span class="value">{K()}</span>
        </label>
        <label>
          <span>Query X position</span>
          <input
            type="range"
            min={-0.8}
            max={0.8}
            step={0.02}
            value={qx()}
            onInput={(e) => setQx(+e.currentTarget.value)}
            aria-valuetext={`query x position ${qx().toFixed(2)}`}
          />
          <span class="value">{qx().toFixed(2)}</span>
        </label>
        <label>
          <span>Query Y position</span>
          <input
            type="range"
            min={-0.8}
            max={0.8}
            step={0.02}
            value={qy()}
            onInput={(e) => setQy(+e.currentTarget.value)}
            aria-valuetext={`query y position ${qy().toFixed(2)}`}
          />
          <span class="value">{qy().toFixed(2)}</span>
        </label>
      </div>

      <figcaption>
        The memory bank holds K, V pairs from past attention computations as a non-differentiable
        external store. For each query, a kNN index returns the top-K nearest historical keys —
        which the current layer then merges into its standard attention. Total cost per token is
        constant in memory size N (kNN is O(log N) with FAISS-style indexes), so the effective
        receptive field grows without growing the per-step compute.
      </figcaption>
    </figure>
  );
}
