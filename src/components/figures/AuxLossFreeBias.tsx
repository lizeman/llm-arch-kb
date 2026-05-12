/** @jsxImportSource solid-js */
import { createMemo, createSignal, onCleanup } from "solid-js";

/**
 * Aux-loss-free routing demo: a per-expert bias is updated each step to push under-used
 * experts toward higher selection rates. Show:
 *   - per-expert raw traffic (without bias)
 *   - per-expert biased traffic (after bias correction)
 *   - the bias values themselves
 *
 * Each "step" simulates a batch of B tokens; for each token, we score E experts via fixed
 * pseudo-random gate values, add the bias, and pick top-K. Then we update biases:
 *   bias_e += gamma * (target - traffic_e)
 * where target = K/E (uniform load).
 */

const E = 16;
const B = 64;
const K = 4;

// Fixed pseudo-random gate scores per (expert, token) — deterministic across renders.
function rawScore(e: number, b: number, step: number): number {
  // Mix step in slightly so traffic distribution drifts
  const h = ((b + 1) * 2654435761) ^ ((e + 17) * 40503) ^ ((step + 7) * 8675309);
  return (h & 0xffff) / 0x10000;
}

function topKIndices(scores: number[], k: number): number[] {
  return scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.i);
}

export default function AuxLossFreeBias() {
  const [step, setStep] = createSignal(0);
  const [gamma, setGamma] = createSignal(0.05);
  const [biases, setBiases] = createSignal<number[]>(new Array(E).fill(0));
  const [running, setRunning] = createSignal(false);

  // Compute traffic for current step using current biases
  const traffic = createMemo(() => {
    const counts = new Array(E).fill(0);
    const rawCounts = new Array(E).fill(0);
    const bs = biases();
    const s = step();
    for (let b = 0; b < B; b++) {
      const scores = new Array(E);
      const rawScores = new Array(E);
      for (let e = 0; e < E; e++) {
        const r = rawScore(e, b, s);
        rawScores[e] = r;
        scores[e] = r + bs[e];
      }
      const picked = topKIndices(scores, K);
      const pickedRaw = topKIndices(rawScores, K);
      for (const ei of picked) counts[ei]++;
      for (const ei of pickedRaw) rawCounts[ei]++;
    }
    return { counts, rawCounts };
  });

  function doStep() {
    const target = (B * K) / E;
    const { counts } = traffic();
    const bs = biases().slice();
    const g = gamma();
    for (let e = 0; e < E; e++) {
      bs[e] += g * (target - counts[e]) / B;
    }
    setBiases(bs);
    setStep((s) => s + 1);
  }

  // Auto-run loop
  let timer: number | undefined;
  function tick() {
    if (!running()) return;
    doStep();
    timer = setTimeout(tick, 250) as unknown as number;
  }
  function toggleRun() {
    if (running()) {
      setRunning(false);
      if (timer !== undefined) clearTimeout(timer);
    } else {
      setRunning(true);
      tick();
    }
  }
  onCleanup(() => {
    if (timer !== undefined) clearTimeout(timer);
  });

  function reset() {
    setRunning(false);
    if (timer !== undefined) clearTimeout(timer);
    setBiases(new Array(E).fill(0));
    setStep(0);
  }

  // Geometry
  const X0 = 70;
  const Y0 = 40;
  const W = 560;
  const H = 100;
  const COL_W = W / E;
  const target = (B * K) / E;
  const maxBar = createMemo(() => Math.max(target * 2, ...traffic().counts, ...traffic().rawCounts));

  function renderRow(values: number[], yCenter: number, color: string, title: string) {
    return (
      <g>
        <text
          x={X0 + W / 2}
          y={yCenter - H / 2 - 8}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="12"
          font-weight="600"
          fill="#1a1a1a"
        >
          {title}
        </text>
        <line
          x1={X0}
          y1={yCenter + H / 2}
          x2={X0 + W}
          y2={yCenter + H / 2}
          stroke="#e3e3dc"
        />
        {/* Target line */}
        <line
          x1={X0}
          y1={yCenter + H / 2 - (target / maxBar()) * H}
          x2={X0 + W}
          y2={yCenter + H / 2 - (target / maxBar()) * H}
          stroke="#1a4f7a"
          stroke-dasharray="3 3"
          stroke-width="1"
        />
        {values.map((v, e) => {
          const barH = (v / maxBar()) * H;
          const x = X0 + e * COL_W + 3;
          return (
            <rect
              x={x}
              y={yCenter + H / 2 - barH}
              width={COL_W - 6}
              height={barH}
              fill={color}
              opacity="0.85"
            />
          );
        })}
      </g>
    );
  }

  return (
    <figure class="figure" data-testid="aux-loss-free-bias">
      <svg viewBox="0 0 700 380" role="img" aria-label="Aux-loss-free routing bias visualization">
        <title>
          Per-expert traffic before and after bias correction. The bias accumulates over steps to
          push under-used experts above the top-K threshold for more tokens.
        </title>

        {renderRow(traffic().rawCounts, Y0 + H / 2, "#8a8a85", "Raw routing (no bias) — uneven")}
        {renderRow(
          traffic().counts,
          Y0 + H + 60 + H / 2,
          "#1a4f7a",
          "Biased routing — pushed toward target",
        )}

        {/* Bias values */}
        <text
          x={X0 + W / 2}
          y={Y0 + 2 * H + 130}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="12"
          font-weight="600"
          fill="#1a1a1a"
        >
          Per-expert bias values (positive = give more tokens to this expert)
        </text>
        <line
          x1={X0}
          y1={Y0 + 2 * H + 165}
          x2={X0 + W}
          y2={Y0 + 2 * H + 165}
          stroke="#e3e3dc"
        />
        {biases().map((b, e) => {
          const h = Math.min(40, Math.abs(b) * 200);
          const baseY = Y0 + 2 * H + 165;
          const x = X0 + e * COL_W + 3;
          return (
            <g>
              <rect
                x={x}
                y={b >= 0 ? baseY - h : baseY}
                width={COL_W - 6}
                height={h}
                fill={b >= 0 ? "#1a4f7a" : "#5a5a55"}
                opacity="0.7"
              />
              <text
                x={x + (COL_W - 6) / 2}
                y={baseY + 14}
                text-anchor="middle"
                font-family="var(--mono)"
                font-size="8"
                fill="#5a5a55"
              >
                e{e}
              </text>
            </g>
          );
        })}
      </svg>

      <div class="controls">
        <button
          type="button"
          onClick={doStep}
          style={{ padding: "6px 14px", "min-height": "44px", "border-radius": "2px", border: "1px solid #1a4f7a", background: "#fff", color: "#1a4f7a", "font-family": "var(--serif)", cursor: "pointer" }}
        >
          Step (current: {step()})
        </button>
        <button
          type="button"
          onClick={toggleRun}
          style={{ padding: "6px 14px", "min-height": "44px", "border-radius": "2px", border: "1px solid #1a4f7a", background: running() ? "#1a4f7a" : "#fff", color: running() ? "#fff" : "#1a4f7a", "font-family": "var(--serif)", cursor: "pointer" }}
        >
          {running() ? "Pause" : "Run"}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{ padding: "6px 14px", "min-height": "44px", "border-radius": "2px", border: "1px solid #5a5a55", background: "#fff", color: "#5a5a55", "font-family": "var(--serif)", cursor: "pointer" }}
        >
          Reset
        </button>
        <label>
          <span>Update step γ</span>
          <input
            type="range"
            min={0.001}
            max={0.2}
            step={0.001}
            value={gamma()}
            onInput={(e) => setGamma(+e.currentTarget.value)}
            aria-valuetext={`bias update step size ${gamma().toFixed(3)}`}
          />
          <span class="value">{gamma().toFixed(3)}</span>
        </label>
      </div>

      <figcaption>
        Click <strong>Step</strong> or <strong>Run</strong>. The bias drifts to push under-used
        experts (raw traffic below the dashed target) above the top-K threshold for more tokens.
        After ~20 steps the biased routing (bottom row) is much flatter than the raw routing
        (top row), which converges to a balanced load <em>without</em> introducing an auxiliary
        loss term that would disturb the language-modeling gradient.
      </figcaption>
    </figure>
  );
}
