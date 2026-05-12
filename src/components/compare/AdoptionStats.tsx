/** @jsxImportSource solid-js */

export interface AdoptionStatsProps {
  /** Number of adopters (filled cells in this column). */
  hits: number;
  /** Total rows (denominator). */
  total: number;
}

/**
 * Per-column adoption footer: "N/M" plus a thin inline bar using --accent
 * at low alpha — single token, no new color introduced.
 */
export default function AdoptionStats(props: AdoptionStatsProps) {
  const pct = () => {
    if (props.total === 0) return 0;
    return Math.max(0, Math.min(1, props.hits / props.total));
  };
  return (
    <div class="cmp-stats" title={`${props.hits} of ${props.total} models`}>
      <span class="cmp-stats-num">{props.hits}/{props.total}</span>
      <span class="cmp-stats-bar" aria-hidden="true">
        <span class="cmp-stats-fill" style={{ width: `${pct() * 100}%` }} />
      </span>
    </div>
  );
}
