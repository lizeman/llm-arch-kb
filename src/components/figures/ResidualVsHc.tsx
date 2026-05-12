/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Standard residual vs Hyper-Connections side-by-side diagram.
 * Left panel: single residual stream — sublayers read and write the same vector.
 * Right panel: n parallel streams — each sublayer reads via A, writes via B.
 *
 * Slider for n (streams), slider for layer count.
 */

const D = 32; // illustrative width

export default function ResidualVsHc() {
  const [n, setN] = createSignal(4);
  const [L, setL] = createSignal(6);

  // Geometry
  const X0 = 50;
  const X1 = 380;
  const Y0 = 50;
  const W_PANEL = 220;
  const ROW_H = 50;
  const STREAM_W = 14;

  function renderResidualPanel() {
    const x = X0;
    const cx = x + W_PANEL / 2;
    return (
      <g>
        <text x={cx} y={Y0 - 18} text-anchor="middle" font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
          Standard residual (n = 1)
        </text>
        {/* Single stream column */}
        <line x1={cx} y1={Y0} x2={cx} y2={Y0 + L() * ROW_H} stroke="#1a4f7a" stroke-width="3" opacity="0.4" />
        {Array.from({ length: L() }, (_, l) => {
          const yTop = Y0 + l * ROW_H;
          const yMid = yTop + ROW_H / 2;
          return (
            <g>
              {/* Sublayer block */}
              <rect x={cx - 60} y={yMid - 10} width="48" height="20" fill="#fafaf7" stroke="#1a4f7a" />
              <text x={cx - 36} y={yMid + 3} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#1a4f7a">
                f_{l}
              </text>
              {/* Read arrow */}
              <line x1={cx} y1={yMid - 5} x2={cx - 12} y2={yMid - 5} stroke="#1a4f7a" stroke-width="1" />
              {/* Write arrow */}
              <line x1={cx - 12} y1={yMid + 5} x2={cx} y2={yMid + 5} stroke="#1a4f7a" stroke-width="1" marker-end="url(#hc-arrow)" />
            </g>
          );
        })}
        <text x={cx} y={Y0 + L() * ROW_H + 18} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#5a5a55">
          1 stream × {L()} layers
        </text>
      </g>
    );
  }

  function renderHcPanel() {
    const x = X1;
    const N = n();
    const totalStreamsW = N * STREAM_W;
    const startX = x + (W_PANEL - totalStreamsW) / 2;
    return (
      <g>
        <text x={x + W_PANEL / 2} y={Y0 - 18} text-anchor="middle" font-family="var(--serif)" font-size="13" font-weight="600" fill="#1a1a1a">
          Hyper-Connections (n = {N})
        </text>
        {/* N stream columns */}
        {Array.from({ length: N }, (_, i) => {
          const sx = startX + i * STREAM_W + STREAM_W / 2;
          return (
            <line x1={sx} y1={Y0} x2={sx} y2={Y0 + L() * ROW_H} stroke="#1a4f7a" stroke-width="2" opacity="0.4" />
          );
        })}
        {Array.from({ length: L() }, (_, l) => {
          const yTop = Y0 + l * ROW_H;
          const yMid = yTop + ROW_H / 2;
          // Pseudo-randomize which streams the sublayer reads/writes
          const readStream = (l * 3 + 1) % N;
          const writeStream = (l * 5 + 2) % N;
          const readX = startX + readStream * STREAM_W + STREAM_W / 2;
          const writeX = startX + writeStream * STREAM_W + STREAM_W / 2;
          return (
            <g>
              {/* A row read line */}
              {Array.from({ length: N }, (_, i) => {
                const sx = startX + i * STREAM_W + STREAM_W / 2;
                const isPicked = i === readStream;
                return (
                  <line
                    x1={sx}
                    y1={yMid - 9}
                    x2={sx + (i < readStream ? 4 : i > readStream ? -4 : 0)}
                    y2={yMid - 9}
                    stroke="#5a5a55"
                    opacity={isPicked ? 0.8 : 0.25}
                    stroke-width={isPicked ? 1.5 : 0.7}
                  />
                );
              })}
              {/* read concentrating line into sublayer */}
              <line x1={startX} y1={yMid - 9} x2={startX + totalStreamsW} y2={yMid - 9} stroke="#5a5a55" stroke-width="0.5" opacity="0.4" />

              {/* Sublayer block to the right */}
              <rect x={startX + totalStreamsW + 12} y={yMid - 10} width="40" height="20" fill="#fafaf7" stroke="#1a4f7a" />
              <text x={startX + totalStreamsW + 32} y={yMid + 3} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#1a4f7a">
                f_{l}
              </text>
              {/* Read in (curved) */}
              <path
                d={`M ${readX} ${yMid - 5} Q ${startX + totalStreamsW + 6} ${yMid - 5}, ${startX + totalStreamsW + 12} ${yMid}`}
                fill="none"
                stroke="#1a4f7a"
                stroke-width="1"
                opacity="0.7"
              />
              {/* Write out (curved) */}
              <path
                d={`M ${startX + totalStreamsW + 12} ${yMid + 4} Q ${startX + totalStreamsW + 6} ${yMid + 5}, ${writeX} ${yMid + 9}`}
                fill="none"
                stroke="#1a4f7a"
                stroke-width="1"
                opacity="0.7"
                marker-end="url(#hc-arrow)"
              />
            </g>
          );
        })}
        <text x={x + W_PANEL / 2} y={Y0 + L() * ROW_H + 18} text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#5a5a55">
          {N} streams × {L()} layers ({N * L() * 2} learned A/B coefficients)
        </text>
      </g>
    );
  }

  return (
    <figure class="figure" data-testid="residual-vs-hc">
      <svg viewBox="0 0 700 480" role="img" aria-label="Standard residual vs Hyper-Connections diagram">
        <title>
          Standard residual: every sublayer reads from and writes to one residual stream.
          Hyper-Connections: each sublayer reads via a learned A combination and writes via a
          learned B combination across n parallel streams.
        </title>

        <defs>
          <marker id="hc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a4f7a" />
          </marker>
        </defs>

        {renderResidualPanel()}
        {renderHcPanel()}
      </svg>

      <div class="controls">
        <label>
          <span>HC streams n</span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={n()}
            onInput={(e) => setN(+e.currentTarget.value)}
            aria-valuetext={`${n()} hyper-connection streams`}
          />
          <span class="value">{n()}</span>
        </label>
        <label>
          <span>Layers L</span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={L()}
            onInput={(e) => setL(+e.currentTarget.value)}
            aria-valuetext={`${L()} transformer layers shown`}
          />
          <span class="value">{L()}</span>
        </label>
      </div>

      <figcaption>
        Standard residual (left): every sublayer reads from and writes to one stream — useful
        information from layer 5 has to share that vector space with information from every
        other layer. Hyper-Connections (right): n parallel streams, with learned read/write
        coefficients per layer. At n = 1 the two reduce to the same architecture; for n &gt; 1
        a sublayer can read from one stream and write to another, deferring information across
        many layers without contention.
      </figcaption>
    </figure>
  );
}
