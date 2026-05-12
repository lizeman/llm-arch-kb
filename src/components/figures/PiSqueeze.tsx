/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Position Interpolation visualization.
 * Show two number lines:
 *   Top: target positions 0..L_new (the inference-time range)
 *   Bottom: effective positions after PI squeeze: t -> t/s, mapping back to 0..L_train
 *
 * The model only ever sees positions in the [0, L_train] range, even at inference time on a
 * length-L_new sequence. Slider for s (extension factor).
 */

export default function PiSqueeze() {
  const [s, setS] = createSignal(4);
  const L_TRAIN = 4096;

  const L_NEW = createMemo(() => Math.round(L_TRAIN * s()));

  // Geometry
  const X0 = 60;
  const W = 580;
  const Y_TOP = 60;
  const Y_BOTTOM = 220;

  // Sample positions to mark — 11 evenly spaced positions over the new range
  const samplePositions = createMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 10; i++) out.push((i / 10) * L_NEW());
    return out;
  });

  return (
    <figure class="figure" data-testid="pi-squeeze">
      <svg viewBox="0 0 700 320" role="img" aria-label="Position Interpolation squeeze visualization">
        <title>
          Position Interpolation maps each inference-time position t in [0, L_new] to t/s in
          [0, L_train], so the model never sees a position outside its trained range. All
          positions get the same uniform compression.
        </title>

        <text
          x={X0 + W / 2}
          y={Y_TOP - 30}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Inference position t (range 0..L_new = {L_NEW().toLocaleString()})
        </text>

        {/* Top number line */}
        <line x1={X0} y1={Y_TOP} x2={X0 + W} y2={Y_TOP} stroke="#1a4f7a" stroke-width="2" />
        {samplePositions().map((p, i) => {
          const x = X0 + (p / L_NEW()) * W;
          return (
            <g>
              <line x1={x} y1={Y_TOP - 5} x2={x} y2={Y_TOP + 5} stroke="#1a4f7a" stroke-width="1.5" />
              <text x={x} y={Y_TOP - 8} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#5a5a55">
                {Math.round(p).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Squeeze arrows: each position maps to its compressed position */}
        {samplePositions().map((p, i) => {
          const xTop = X0 + (p / L_NEW()) * W;
          const xBot = X0 + (p / s() / L_TRAIN) * W;
          return (
            <g>
              <line
                x1={xTop}
                y1={Y_TOP + 8}
                x2={xBot}
                y2={Y_BOTTOM - 8}
                stroke="#5a5a55"
                stroke-width="1"
                opacity="0.4"
              />
            </g>
          );
        })}

        <text
          x={X0 + W / 2}
          y={Y_BOTTOM + 30}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="13"
          font-weight="600"
          fill="#1a1a1a"
        >
          Effective position t/s seen by RoPE (range 0..L_train = {L_TRAIN.toLocaleString()})
        </text>

        {/* Bottom number line */}
        <line x1={X0} y1={Y_BOTTOM} x2={X0 + W} y2={Y_BOTTOM} stroke="#1a4f7a" stroke-width="2" />
        {samplePositions().map((p, i) => {
          const x = X0 + (p / s() / L_TRAIN) * W;
          return (
            <g>
              <line x1={x} y1={Y_BOTTOM - 5} x2={x} y2={Y_BOTTOM + 5} stroke="#1a4f7a" stroke-width="1.5" />
              <text x={x} y={Y_BOTTOM + 18} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#5a5a55">
                {Math.round(p / s()).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Status text */}
        <text
          x={X0}
          y={Y_BOTTOM + 60}
          font-family="var(--mono)"
          font-size="11"
          fill="#1a1a1a"
        >
          Extension factor s = {s().toFixed(1)}× — every position uniformly compressed
        </text>
        <text
          x={X0}
          y={Y_BOTTOM + 78}
          font-family="var(--mono)"
          font-size="11"
          fill="#5a5a55"
        >
          Token at distance 1 now appears at distance 1/{s().toFixed(1)} in RoPE's view —
          {s() > 4 ? " fast dimensions lose resolution" : " manageable resolution loss"}.
        </text>
      </svg>

      <div class="controls">
        <label>
          <span>Extension factor s</span>
          <input
            type="range"
            min={1}
            max={32}
            step={0.5}
            value={s()}
            onInput={(e) => setS(+e.currentTarget.value)}
            aria-valuetext={`extension factor ${s().toFixed(1)} compressing positions`}
          />
          <span class="value">{s().toFixed(1)}×</span>
        </label>
      </div>

      <figcaption>
        Position Interpolation's mechanism in one move: divide every inference-time position by
        the extension factor s before applying RoPE. The model sees only positions it was
        trained on; the cost is that <em>every</em> dimension's rotation rate appears
        s× slower than at training time. Fast dimensions, which used to span the full unit
        circle in a few tokens, now span it in s × few tokens — losing the short-range
        resolution that local attention depends on. YaRN and LongRoPE address this by treating
        fast and slow dimensions differently.
      </figcaption>
    </figure>
  );
}
