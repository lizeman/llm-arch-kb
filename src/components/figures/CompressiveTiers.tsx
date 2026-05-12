/** @jsxImportSource solid-js */
import { createMemo, createSignal } from "solid-js";

/**
 * Compressive Transformer two-tier memory diagram.
 * Layout (left to right): compressed memory | short-term cache | current attention window.
 * Slider for compression ratio c (each c short-term tokens become 1 compressed slot).
 * Slider for short-term cache size N_mem.
 */

export default function CompressiveTiers() {
  const [c, setC] = createSignal(4);
  const [Nmem, setNmem] = createSignal(16);
  const [Nwin, setNwin] = createSignal(8);

  const Ncomp = createMemo(() => 16); // illustrative compressed-memory length
  const totalReach = createMemo(() => Ncomp() * c() + Nmem() + Nwin());

  // Geometry
  const X0 = 50;
  const Y0 = 70;
  const slotH = 30;
  const compW = 16;
  const memW = 16;
  const winW = 16;

  return (
    <figure class="figure" data-testid="compressive-tiers">
      <svg viewBox="0 0 700 320" role="img" aria-label="Compressive Transformer two-tier memory">
        <title>
          Compressive Transformer maintains three regions of context: compressed long-term
          memory (one slot per c original tokens), short-term cache (full resolution), and the
          current attention window. Drag c to see compression ratio change.
        </title>

        {/* Compressed memory */}
        <text
          x={X0 + (Ncomp() * compW) / 2}
          y={Y0 - 14}
          text-anchor="middle"
          font-family="var(--serif)"
          font-size="12"
          font-weight="600"
          fill="#1a1a1a"
        >Compressed memory ({Ncomp()} slots × c = {Ncomp() * c()} effective tokens)</text>
        {Array.from({ length: Ncomp() }, (_, i) => (
          <rect
            x={X0 + i * compW}
            y={Y0}
            width={compW - 1}
            height={slotH}
            fill="#5a5a55"
            opacity="0.5"
          />
        ))}

        {/* Divider */}
        <line
          x1={X0 + Ncomp() * compW + 6}
          y1={Y0 - 6}
          x2={X0 + Ncomp() * compW + 6}
          y2={Y0 + slotH + 6}
          stroke="#8a8a85"
          stroke-width="0.6"
        />

        {/* Short-term cache */}
        <g transform={`translate(${X0 + Ncomp() * compW + 12}, 0)`}>
          <text
            x={(Nmem() * memW) / 2}
            y={Y0 - 14}
            text-anchor="middle"
            font-family="var(--serif)"
            font-size="12"
            font-weight="600"
            fill="#1a1a1a"
          >Short-term cache ({Nmem()} tokens, full resolution)</text>
          {Array.from({ length: Nmem() }, (_, i) => (
            <rect
              x={i * memW}
              y={Y0}
              width={memW - 1}
              height={slotH}
              fill="#1a4f7a"
              opacity="0.7"
            />
          ))}
        </g>

        {/* Divider */}
        <line
          x1={X0 + Ncomp() * compW + 12 + Nmem() * memW + 6}
          y1={Y0 - 6}
          x2={X0 + Ncomp() * compW + 12 + Nmem() * memW + 6}
          y2={Y0 + slotH + 6}
          stroke="#8a8a85"
          stroke-width="0.6"
        />

        {/* Current window */}
        <g transform={`translate(${X0 + Ncomp() * compW + 12 + Nmem() * memW + 12}, 0)`}>
          <text
            x={(Nwin() * winW) / 2}
            y={Y0 - 14}
            text-anchor="middle"
            font-family="var(--serif)"
            font-size="12"
            font-weight="600"
            fill="#1a1a1a"
          >Window ({Nwin()})</text>
          {Array.from({ length: Nwin() }, (_, i) => (
            <rect
              x={i * winW}
              y={Y0}
              width={winW - 1}
              height={slotH}
              fill="#1a4f7a"
              opacity={0.4 + (i / Nwin()) * 0.5}
            />
          ))}
        </g>

        {/* Eviction arrow: short-term overflow → compress c tokens into 1 slot */}
        <g transform={`translate(${X0 + Ncomp() * compW + 8}, ${Y0 + slotH + 30})`}>
          <text x="0" y="0" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            On overflow: c = {c()} oldest short-term slots → compressed into 1 long-term slot
          </text>
          <text x="0" y="16" font-family="var(--mono)" font-size="10" fill="#5a5a55">
            via mean-pooling, 1D conv, or attention-based compression
          </text>
        </g>

        {/* Stats */}
        <g transform={`translate(${X0}, ${Y0 + 130})`}>
          <text x="0" y="0" font-family="var(--serif)" font-size="12" font-weight="600" fill="#1a1a1a">
            Effective reach
          </text>
          <text x="0" y="22" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            {Ncomp()} compressed × c {`(${c()})`} + {Nmem()} short-term + {Nwin()} window = {totalReach()} tokens
          </text>
          <text x="0" y="40" font-family="var(--mono)" font-size="11" fill="#5a5a55">
            Per query attends to: {Ncomp() + Nmem() + Nwin()} slots (vs {totalReach()} raw tokens)
          </text>
          <text x="0" y="58" font-family="var(--mono)" font-size="11" fill="#1a1a1a">
            Memory savings: {(totalReach() / (Ncomp() + Nmem() + Nwin())).toFixed(1)}× via long-term compression
          </text>
        </g>
      </svg>

      <div class="controls">
        <label>
          <span>Compression ratio c</span>
          <input
            type="range"
            min={1}
            max={32}
            step={1}
            value={c()}
            onInput={(e) => setC(+e.currentTarget.value)}
            aria-valuetext={`compression ratio ${c()} short-term tokens per long-term slot`}
          />
          <span class="value">{c()}</span>
        </label>
        <label>
          <span>Short-term cache size</span>
          <input
            type="range"
            min={4}
            max={32}
            step={1}
            value={Nmem()}
            onInput={(e) => setNmem(+e.currentTarget.value)}
            aria-valuetext={`short-term cache size ${Nmem()} tokens`}
          />
          <span class="value">{Nmem()}</span>
        </label>
        <label>
          <span>Current window size</span>
          <input
            type="range"
            min={4}
            max={16}
            step={1}
            value={Nwin()}
            onInput={(e) => setNwin(+e.currentTarget.value)}
            aria-valuetext={`current attention window size ${Nwin()} tokens`}
          />
          <span class="value">{Nwin()}</span>
        </label>
      </div>

      <figcaption>
        Three tiers of context, from coarsest to finest: <strong>compressed memory</strong> at
        c× compression, <strong>short-term cache</strong> at full resolution, and the
        <strong> current window</strong>. When the short-term cache overflows, the c oldest
        slots get compressed into a single long-term slot. Per-query attention cost is the sum
        of slot counts (Ncomp + Nmem + Nwin) but the effective receptive field reaches Ncomp·c
        + Nmem + Nwin original tokens.
      </figcaption>
    </figure>
  );
}
