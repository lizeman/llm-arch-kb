/** @jsxImportSource solid-js */
import { createMemo, createSignal, For } from "solid-js";

/**
 * StreamingLLM attention-sinks visualization: pinned sinks + sliding window over a sequence,
 * with the evicted middle region dropped.
 */

const TOTAL = 32;

type Region = "sink" | "window" | "evicted" | "future";

const REGION_STYLE: Record<Region, { fill: string; stroke: string; text: string }> = {
  sink: { fill: "#1a4f7a", stroke: "#1a4f7a", text: "white" },
  window: { fill: "#e8eef4", stroke: "#1a4f7a", text: "#1a4f7a" },
  evicted: { fill: "#f1f1ec", stroke: "#8a8a85", text: "#8a8a85" },
  future: { fill: "#fafaf7", stroke: "#e3e3dc", text: "#e3e3dc" },
};

export default function AttentionSinks() {
  const [pos, setPos] = createSignal(20);
  const [w, setW] = createSignal(8);
  const [sinks, setSinks] = createSignal(4);

  const windowStart = createMemo(() => Math.max(sinks(), pos() - w() + 1));
  // Counterfactual: what perplexity *would* be if sinks were S = 0 at this position.
  // (Used to populate the "without sinks" warning text — it does not depend on sinks().)
  const pplNoSinks = () => {
    if (pos() < w()) return 1.0;
    return Math.min(100, 1.0 + (pos() - w()) * 5);
  };

  // Cache size at the current position with the current S, W:
  //   visible sinks (positions 0..S-1 that have been generated) + window tokens.
  const cacheSize = createMemo(() => {
    const visibleSinks = Math.min(sinks(), pos() + 1);
    const windowTokens = Math.max(0, pos() - windowStart() + 1);
    return visibleSinks + windowTokens;
  });

  const cellSize = 18;
  const left = 60;
  const top = 80;

  function regionFor(t: number): Region {
    if (t > pos()) return "future";
    if (t < sinks()) return "sink";
    if (t >= windowStart()) return "window";
    return "evicted";
  }

  return (
    <figure class="figure" data-testid="attention-sinks">
      <svg viewBox="0 0 720 300" role="img" aria-label="Streaming LLM attention sinks visualization">
        <title>Token cache layout at position t with S pinned sink tokens and a W-token sliding window. Evicted middle tokens are dropped.</title>

        <text x={360} y={28} text-anchor="middle"
          font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
          Position t = {pos()} · Window W = {w()} · Sinks S = {sinks()}
        </text>

        <text x={left} y={top - 12} font-family="var(--mono)" font-size="10" fill="#5a5a55">
          tokens (oldest left)
        </text>

        <For each={Array.from({ length: TOTAL }, (_, i) => i)}>
          {(t) => {
            const region = regionFor(t);
            const style = REGION_STYLE[region];
            return (
              <g>
                <rect
                  x={left + t * cellSize}
                  y={top}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill={style.fill}
                  stroke={style.stroke}
                  stroke-width="1"
                  opacity={region === "future" ? 0.5 : 1}
                  stroke-dasharray={region === "evicted" ? "2 2" : undefined}
                />
                <text
                  x={left + t * cellSize + (cellSize - 1) / 2}
                  y={top + 12}
                  text-anchor="middle"
                  font-family="var(--mono)"
                  font-size="7"
                  fill={style.text}
                >{t}</text>
              </g>
            );
          }}
        </For>

        {/* Legend */}
        <g transform={`translate(${left}, ${top + 50})`}>
          <rect x={0} y={0} width={14} height={14} fill="#1a4f7a" stroke="#1a4f7a" />
          <text x={20} y={12} font-family="var(--mono)" font-size="10" fill="#5a5a55">pinned sink</text>

          <rect x={120} y={0} width={14} height={14} fill="#e8eef4" stroke="#1a4f7a" />
          <text x={140} y={12} font-family="var(--mono)" font-size="10" fill="#5a5a55">recent window</text>

          <rect x={260} y={0} width={14} height={14} fill="#f1f1ec" stroke="#8a8a85" stroke-dasharray="2 2" />
          <text x={280} y={12} font-family="var(--mono)" font-size="10" fill="#5a5a55">evicted</text>

          <rect x={360} y={0} width={14} height={14} fill="#fafaf7" stroke="#e3e3dc" opacity={0.5} />
          <text x={380} y={12} font-family="var(--mono)" font-size="10" fill="#5a5a55">future</text>
        </g>

        {/* Stats */}
        <g transform={`translate(${left}, ${top + 100})`}>
          <text x={0} y={0} font-family="var(--mono)" font-size="11" fill="#5a5a55">
            cache size: {cacheSize()} tokens
            &nbsp;({Math.min(sinks(), pos() + 1)} sinks + {Math.max(0, pos() - windowStart() + 1)} window)
          </text>
          <text x={0} y={20} font-family="var(--mono)" font-size="11" fill="#5a5a55">
            if S = 0, past position {w()}: perplexity ≈ {pplNoSinks().toFixed(1)}× baseline
          </text>
          <text x={0} y={40} font-family="var(--mono)" font-size="11" fill="#5a5a55"
            opacity={sinks() === 0 ? 1 : 0.4}>
            with S = 0: each query has nowhere to dump excess softmax mass → quality collapse
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Position t</span>
          <input
            type="range"
            aria-label="Position t"
            min={0}
            max={TOTAL - 1}
            step={1}
            value={pos()}
            onInput={(e) => setPos(+e.currentTarget.value)}
            aria-valuetext={`current position ${pos()}`}
          />
          <span class="value">{pos()}</span>
        </label>
        <label>
          <span>Window W</span>
          <input
            type="range"
            aria-label="Window W"
            min={1}
            max={16}
            step={1}
            value={w()}
            onInput={(e) => setW(+e.currentTarget.value)}
            aria-valuetext={`sliding window size ${w()}`}
          />
          <span class="value">{w()}</span>
        </label>
        <label>
          <span>Sinks S</span>
          <input
            type="range"
            aria-label="Sinks S"
            min={0}
            max={6}
            step={1}
            value={sinks()}
            onInput={(e) => setSinks(+e.currentTarget.value)}
            aria-valuetext={`${sinks()} pinned sink tokens`}
          />
          <span class="value">{sinks()}</span>
        </label>
      </div>

      <figcaption>
        Drag <strong>t</strong> past the window size. With <strong>S = 0</strong> (drag sinks
        slider to zero) the evicted tokens include the natural attention sinks, and pretrained
        models' attention collapses. With <strong>S ≥ 4</strong>, the first few tokens stay
        pinned and the model continues generating coherently for arbitrarily long streams.
      </figcaption>
    </figure>
  );
}
