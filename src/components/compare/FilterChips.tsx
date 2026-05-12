/** @jsxImportSource solid-js */
import { For } from "solid-js";

export type ChipOption = {
  key: string;
  label: string;
  count?: number;
};

export interface FilterChipsProps {
  /** Visible label, rendered as a small mono eyebrow. */
  legend: string;
  options: ChipOption[];
  /** Single-select active key, or "all" / empty for none. */
  active: string;
  onChange: (key: string) => void;
}

/**
 * Visually mirrors `.filter-chips` from CategoryLayout — same border, same
 * accent, no new tokens. Single-select pill row.
 */
export default function FilterChips(props: FilterChipsProps) {
  return (
    <fieldset class="cmp-chips" aria-label={props.legend}>
      <legend class="cmp-chips-legend">{props.legend}</legend>
      <For each={props.options}>
        {(opt) => {
          const isActive = () => props.active === opt.key;
          return (
            <button
              type="button"
              class="cmp-chip"
              classList={{ "is-active": isActive() }}
              aria-pressed={isActive()}
              onClick={() => props.onChange(opt.key)}
            >
              <span class="cmp-chip-label">{opt.label}</span>
              {opt.count !== undefined && (
                <span class="cmp-chip-count">{opt.count}</span>
              )}
            </button>
          );
        }}
      </For>
    </fieldset>
  );
}
