/** @jsxImportSource solid-js */
import { createMemo, createSignal, For } from "solid-js";

/**
 * MHA → MQA → GQA → MLA: slider over group count G plus optional MLA latent dim d_c.
 * Shows KV cache size shrinking as we share K,V across heads or compress to a latent.
 */

const H = 16;
const D_H = 128;
const HEAD_DIM_VECTOR = H * D_H;

export default function MhaMqaGqaMla() {
  const [g, setG] = createSignal(8);
  const [useMla, setUseMla] = createSignal(false);
  const [dc, setDc] = createSignal(512);

  const headsPerGroup = () => H / g();

  const mhaCache = HEAD_DIM_VECTOR * 2;
  const cache = createMemo(() => {
    // MLA: latent + decoupled RoPE head.
    if (useMla()) return dc() + 64;
    return g() * D_H * 2;
  });
  const ratio = createMemo(() => mhaCache / cache());
  const variant = createMemo(() => {
    if (useMla()) return "MLA";
    if (g() === H) return "MHA";
    if (g() === 1) return "MQA";
    return "GQA";
  });

  return (
    <figure class="figure" data-testid="mha-mqa-gqa-mla">
      <svg viewBox="0 0 720 360" role="img" aria-label="Multi-head attention KV sharing visualization">
        <title>KV cache layout: query heads on top, key/value groups on bottom, connecting lines show which queries read from which KV store.</title>

        <text x="360" y="22" text-anchor="middle"
          font-family="var(--serif)" font-size="14" font-weight="600" fill="#1a1a1a">
          {variant()}: {H} query heads → {useMla() ? `latent d_c=${dc()}` : `${g()} KV group${g() === 1 ? "" : "s"}`}
        </text>

        <text x="40" y="60" font-family="var(--mono)" font-size="11" fill="#5a5a55">Queries</text>
        <For each={Array.from({ length: H }, (_, i) => i)}>
          {(i) => (
            <g>
              <rect
                x={40 + i * 38}
                y={70}
                width={32}
                height={36}
                rx={3}
                fill="#e8eef4"
                stroke="#1a4f7a"
                stroke-width="1"
              />
              <text
                x={56 + i * 38}
                y={92}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="10"
                fill="#1a4f7a"
              >Q{i}</text>
            </g>
          )}
        </For>

        <text x="40" y="230" font-family="var(--mono)" font-size="11" fill="#5a5a55">
          {useMla() ? "Latent c_KV (compressed)" : "KV groups"}
        </text>

        {useMla() ? (
          <g>
            <rect
              x={40}
              y={240}
              width={Math.min(640, 80 + dc() * 0.6)}
              height={36}
              rx={3}
              fill="#fafaf7"
              stroke="#1a4f7a"
              stroke-width="1.5"
            />
            <text
              x={40 + Math.min(640, 80 + dc() * 0.6) / 2}
              y={262}
              text-anchor="middle"
              font-family="var(--mono)"
              font-size="11"
              fill="#1a4f7a"
            >c_KV ∈ ℝ^{dc()}</text>
            <For each={Array.from({ length: H }, (_, i) => i)}>
              {(i) => (
                <line
                  x1={56 + i * 38}
                  y1={106}
                  x2={40 + Math.min(640, 80 + dc() * 0.6) / 2}
                  y2={240}
                  stroke="#1a4f7a"
                  stroke-width="0.6"
                  opacity="0.45"
                />
              )}
            </For>
          </g>
        ) : (
          <For each={Array.from({ length: g() }, (_, i) => i)}>
            {(gi) => {
              const width = (H * 38 - 6) / g();
              const x = 40 + gi * width;
              return (
                <g>
                  <rect
                    x={x + 2}
                    y={240}
                    width={width - 6}
                    height={36}
                    rx={3}
                    fill="#fafaf7"
                    stroke="#1a4f7a"
                    stroke-width="1.5"
                  />
                  <text
                    x={x + width / 2}
                    y={262}
                    text-anchor="middle"
                    font-family="var(--mono)"
                    font-size="11"
                    fill="#1a4f7a"
                  >K,V{g() === 1 ? "" : gi}</text>
                  <For each={Array.from({ length: H }, (_, qi) => qi).filter((qi) => Math.floor(qi / headsPerGroup()) === gi)}>
                    {(qi) => (
                      <line
                        x1={56 + qi * 38}
                        y1={106}
                        x2={x + width / 2}
                        y2={240}
                        stroke="#1a4f7a"
                        stroke-width="0.6"
                        opacity="0.45"
                      />
                    )}
                  </For>
                </g>
              );
            }}
          </For>
        )}

        <text x="40" y="320" font-family="var(--serif)" font-size="13" fill="#5a5a55">
          KV bytes / token / layer (fp16):
        </text>
        <text x="290" y="320" font-family="var(--mono)" font-size="13" font-weight="600" fill="#1a4f7a">
          {(cache() * 2 / 1024).toFixed(1)} KB
        </text>
        <text x="420" y="320" font-family="var(--serif)" font-size="13" fill="#5a5a55">
          ({ratio().toFixed(1)}× smaller than MHA)
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Group count G</span>
          <input
            type="range"
            aria-label="Group count G"
            min={1}
            max={H}
            step={1}
            value={g()}
            disabled={useMla()}
            onInput={(e) => setG(+e.currentTarget.value)}
            aria-valuetext={`${g()} key/value group${g() === 1 ? "" : "s"} (${headsPerGroup()} heads per group)`}
          />
          <span class="value">{g()}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={useMla()}
            onChange={(e) => setUseMla(e.currentTarget.checked)}
            aria-label="Switch to MLA latent compression"
            style={{ width: "auto", "min-height": "auto" }}
          />
          <span>MLA latent</span>
          <span class="value">&nbsp;</span>
        </label>
        <label>
          <span>Latent dim d_c</span>
          <input
            type="range"
            aria-label="Latent dim d_c"
            min={64}
            max={1024}
            step={32}
            value={dc()}
            disabled={!useMla()}
            onInput={(e) => setDc(+e.currentTarget.value)}
            aria-valuetext={`latent dimension ${dc()}`}
          />
          <span class="value">{dc()}</span>
        </label>
      </div>

      <figcaption>
        <strong>G = 16</strong> is MHA (no sharing). <strong>G = 1</strong> is MQA (every head shares one K, V).
        Intermediate G values are GQA. Switch to <strong>MLA</strong> to compress K, V into a small per-token latent.
      </figcaption>
    </figure>
  );
}
