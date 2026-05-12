/** @jsxImportSource solid-js */
import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import {
  starPath,
  formatParams,
  formatReleaseDate,
  type ModelPoint,
  type OrgLegendEntry,
} from "~/utils/model-timeline";

export interface ModelTimelineProps {
  points: ModelPoint[];
  legend: OrgLegendEntry[];
}

const VB_W = 900;
const VB_H = 440;
const PAD_LEFT = 64;
const PAD_RIGHT = 24;
const PAD_TOP = 32;
const PAD_BOTTOM = 68;
const INNER_W = VB_W - PAD_LEFT - PAD_RIGHT;
const INNER_H = VB_H - PAD_TOP - PAD_BOTTOM;

export default function ModelTimeline(props: ModelTimelineProps) {
  const [hovered, setHovered] = createSignal<string | null>(null);
  const [filter, setFilter] = createSignal<string | null>(null);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    requestAnimationFrame(() => setMounted(true));
  });

  const scales = createMemo(() => {
    const pts = props.points;
    if (pts.length === 0) {
      return { xScale: (_: number) => 0, yScale: (_: number) => 0, years: [], yTicks: [] };
    }
    const tMin = Math.min(...pts.map((p) => p.releaseTs));
    const tMax = Math.max(...pts.map((p) => p.releaseTs));
    const bMin = Math.min(...pts.map((p) => p.paramsTotalB));
    const bMax = Math.max(...pts.map((p) => p.paramsTotalB));
    const lMin = Math.floor(Math.log10(bMin));
    const lMax = Math.ceil(Math.log10(bMax));
    const tPad = (tMax - tMin) * 0.025;
    const xMin = tMin - tPad;
    const xMax = tMax + tPad;
    const xScale = (t: number) => PAD_LEFT + ((t - xMin) / (xMax - xMin)) * INNER_W;
    const yScale = (b: number) =>
      PAD_TOP + ((lMax - Math.log10(b)) / (lMax - lMin)) * INNER_H;

    const years: { year: number; x: number }[] = [];
    const yearStart = new Date(xMin).getUTCFullYear();
    const yearEnd = new Date(xMax).getUTCFullYear();
    for (let y = yearStart; y <= yearEnd; y++) {
      const t = Date.UTC(y, 0, 1);
      if (t >= xMin && t <= xMax) years.push({ year: y, x: xScale(t) });
    }

    const yTicks: { value: number; y: number; label: string }[] = [];
    for (let p = lMin; p <= lMax; p++) {
      const v = 10 ** p;
      const label = v >= 1000 ? `${v / 1000}T` : `${v}B`;
      yTicks.push({ value: v, y: yScale(v), label });
    }

    return { xScale, yScale, years, yTicks };
  });

  const placed = createMemo(() => {
    const orgFilter = filter();
    const s = scales();
    return props.points.map((p, i) => ({
      ...p,
      i,
      x: s.xScale(p.releaseTs),
      y: s.yScale(p.paramsTotalB),
      dimmed: orgFilter !== null && p.orgKey !== orgFilter,
    }));
  });

  const hoveredPoint = createMemo(() => {
    const slug = hovered();
    if (!slug) return null;
    return placed().find((p) => p.slug === slug) ?? null;
  });

  function toggleFilter(key: string) {
    setFilter(filter() === key ? null : key);
  }

  return (
    <figure
      class={`timeline ${mounted() ? "is-mounted" : ""}`}
      aria-label="Open-weight models in the knowledge base, plotted by release date and parameter count"
    >
      <div class="timeline-legend" role="list">
        <For each={props.legend}>
          {(entry) => (
            <button
              type="button"
              role="listitem"
              class={`tl-chip ${filter() === entry.key ? "is-active" : ""}`}
              style={{ "--swatch": entry.color }}
              onClick={() => toggleFilter(entry.key)}
              aria-pressed={filter() === entry.key}
              title={`${entry.label} — ${entry.count} model${entry.count === 1 ? "" : "s"}`}
            >
              <span class="tl-chip__swatch" />
              <span class="tl-chip__label">{entry.label}</span>
              <span class="tl-chip__count">{entry.count}</span>
            </button>
          )}
        </For>
        <span class="tl-chip-sep" aria-hidden="true">·</span>
        <span class="tl-chip tl-chip--shape">
          <span class="tl-shape tl-shape--dot" aria-hidden="true" /> dense
        </span>
        <span class="tl-chip tl-chip--shape">
          <span class="tl-shape tl-shape--star" aria-hidden="true" /> MoE
        </span>
      </div>

      <div class="timeline-svg-wrap">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          class="timeline-svg"
          role="img"
          aria-label="Scatter plot: x-axis release date, y-axis total parameters on a log scale"
          preserveAspectRatio="xMidYMid meet"
        >
          <For each={scales().yTicks}>
            {(tick) => (
              <>
                <line
                  class="tl-grid"
                  x1={PAD_LEFT}
                  y1={tick.y}
                  x2={PAD_LEFT + INNER_W}
                  y2={tick.y}
                />
                <text class="tl-axis-tick" x={PAD_LEFT - 12} y={tick.y + 4} text-anchor="end">
                  {tick.label}
                </text>
              </>
            )}
          </For>

          <line
            class="tl-axis"
            x1={PAD_LEFT}
            y1={PAD_TOP + INNER_H}
            x2={PAD_LEFT + INNER_W}
            y2={PAD_TOP + INNER_H}
          />
          <line class="tl-axis" x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + INNER_H} />

          <For each={scales().years}>
            {(yr) => (
              <>
                <line
                  class="tl-tick-v"
                  x1={yr.x}
                  y1={PAD_TOP + INNER_H}
                  x2={yr.x}
                  y2={PAD_TOP + INNER_H + 5}
                />
                <text
                  class="tl-axis-tick"
                  x={yr.x}
                  y={PAD_TOP + INNER_H + 20}
                  text-anchor="middle"
                >
                  {yr.year}
                </text>
              </>
            )}
          </For>

          <text
            class="tl-axis-label"
            x={PAD_LEFT + INNER_W / 2}
            y={VB_H - 22}
            text-anchor="middle"
          >
            release date
          </text>
          <text
            class="tl-axis-label"
            x={18}
            y={PAD_TOP + INNER_H / 2}
            text-anchor="middle"
            transform={`rotate(-90, 18, ${PAD_TOP + INNER_H / 2})`}
          >
            parameters (log)
          </text>

          <For each={placed()}>
            {(p) => {
              const isHover = () => hovered() === p.slug;
              return (
                <a href={p.href} aria-label={`${p.name}, ${p.organization}, ${formatParams(p.paramsTotalB, p.paramsActiveB, p.isMoE)}, ${formatReleaseDate(p.releaseDate)}`}>
                  <g
                    class={`tl-point ${p.isMoE ? "is-moe" : "is-dense"} ${p.dimmed ? "is-dim" : ""}`}
                    style={{ "--idx": p.i }}
                    onMouseEnter={() => setHovered(p.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(p.slug)}
                    onBlur={() => setHovered(null)}
                  >
                    {p.isMoE ? (
                      <path
                        d={starPath(p.x, p.y, isHover() ? 8.5 : 6.8)}
                        fill={p.color}
                        stroke="#1a1a1a"
                        stroke-width={isHover() ? 1 : 0.7}
                      />
                    ) : (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHover() ? 6.2 : 4.6}
                        fill={p.color}
                        stroke="#1a1a1a"
                        stroke-width={isHover() ? 0.9 : 0}
                      />
                    )}
                    {/* invisible hit target to make tiny shapes easy to grab */}
                    <circle
                      class="tl-hit"
                      cx={p.x}
                      cy={p.y}
                      r={12}
                      fill="transparent"
                    />
                  </g>
                </a>
              );
            }}
          </For>

          <Show when={hoveredPoint()}>
            {(p) => {
              const point = () => p()!;
              const W = 220;
              const H = 58;
              const tx = () =>
                point().x + 14 + W > PAD_LEFT + INNER_W ? point().x - 14 - W : point().x + 14;
              const ty = () =>
                Math.max(PAD_TOP, Math.min(point().y - H / 2, PAD_TOP + INNER_H - H));
              return (
                <g class="tl-tooltip" pointer-events="none">
                  <line
                    class="tl-cross"
                    x1={point().x}
                    y1={PAD_TOP}
                    x2={point().x}
                    y2={PAD_TOP + INNER_H}
                  />
                  <line
                    class="tl-cross"
                    x1={PAD_LEFT}
                    y1={point().y}
                    x2={PAD_LEFT + INNER_W}
                    y2={point().y}
                  />
                  <rect class="tl-tt-box" x={tx()} y={ty()} width={W} height={H} rx={2} />
                  <rect
                    class="tl-tt-accent"
                    x={tx()}
                    y={ty()}
                    width={3}
                    height={H}
                    fill={point().color}
                  />
                  <text class="tl-tt-title" x={tx() + 14} y={ty() + 18}>
                    {point().name}
                  </text>
                  <text class="tl-tt-meta" x={tx() + 14} y={ty() + 34}>
                    {point().organization} · {formatParams(point().paramsTotalB, point().paramsActiveB, point().isMoE)}
                  </text>
                  <text class="tl-tt-meta" x={tx() + 14} y={ty() + 48}>
                    {formatReleaseDate(point().releaseDate)} · {point().isMoE ? "MoE" : "dense"}
                  </text>
                </g>
              );
            }}
          </Show>
        </svg>
      </div>

      <figcaption>
        {props.points.length} open-weight models with disclosed parameter counts, plotted by release date and total parameters (log scale).
        Hover a point for details, click it to open the model entry, click a company chip to highlight that family.
      </figcaption>
    </figure>
  );
}
