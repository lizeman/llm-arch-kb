/** @jsxImportSource solid-js */
import { For } from "solid-js";

export interface MultiSelectFocusProps {
  /** All available pill options (slug + display name). */
  options: { value: string; label: string }[];
  /** Currently selected slugs (2-6 collapses the matrix). */
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  /** Minimum number to engage focus mode. */
  min?: number;
  /** Maximum number allowed. */
  max?: number;
}

/**
 * Pill list of all models; selecting 2-6 collapses the matrix to those rows.
 * Visual mirror of FilterChips, but explicitly multi-select. No new chrome.
 */
export default function MultiSelectFocus(props: MultiSelectFocusProps) {
  const min = () => props.min ?? 2;
  const max = () => props.max ?? 6;
  const count = () => props.selected.length;

  return (
    <div class="cmp-focus">
      <div class="cmp-focus-header">
        <span class="cmp-focus-legend">Focus on models</span>
        <span class="cmp-focus-meta">
          {count() === 0
            ? "Select 2–6 to compare side-by-side"
            : `${count()} selected (max ${max()})`}
          {count() > 0 && (
            <>
              {" · "}
              <button
                type="button"
                class="cmp-focus-clear"
                onClick={props.onClear}
              >
                clear
              </button>
            </>
          )}
        </span>
      </div>
      <div class="cmp-focus-pills" role="group" aria-label="Focus selection">
        <For each={props.options}>
          {(opt) => {
            const isSelected = () => props.selected.includes(opt.value);
            const atCap = () => !isSelected() && count() >= max();
            return (
              <button
                type="button"
                class="cmp-chip"
                classList={{ "is-active": isSelected() }}
                aria-pressed={isSelected()}
                disabled={atCap()}
                onClick={() => props.onToggle(opt.value)}
              >
                <span class="cmp-chip-label">{opt.label}</span>
              </button>
            );
          }}
        </For>
      </div>
      {count() === 1 && (
        <p class="cmp-focus-hint">
          One more to engage focus mode (minimum {min()}).
        </p>
      )}
    </div>
  );
}
