/** @jsxImportSource solid-js */
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { createUrlWriter, debounce, readUrl } from "./UrlState";

export interface ArchSlotSpec {
  key: string;
  label: string;
  shortLabel: string;
}

export interface AdoptedTechnique {
  slug: string;
  title: string;
  abbreviation: string;
  href: string;
}

export interface CategoryGroup {
  category: string;
  categoryLabel: string;
  techniques: AdoptedTechnique[];
}

export interface ModelProfile {
  slug: string;
  name: string;
  organization: string;
  releaseDate: string;
  yearLabel: string;
  parametersTotal: string;
  parametersActive: string | null;
  contextLength: number;
  disclosure: string;
  href: string;
  architecture: Record<string, string>;
  adoptedByCategory: CategoryGroup[];
}

export interface HeadToHeadProps {
  profiles: ModelProfile[];
  archSlots: ArchSlotSpec[];
  defaultFocus: string[];
  /** Hard cap on simultaneous columns. */
  maxFocus?: number;
}

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(tokens % 1_000 === 0 ? 0 : 1)}K`;
  return String(tokens);
}

/**
 * Head-to-head model comparison.
 *
 * Top: a chip strip showing the currently focused models (with × to remove).
 * Middle: 1–maxFocus profile columns, each showing architecture slots and
 *   adopted techniques grouped by category.
 * Bottom: a picker — searchable list of every model in the corpus, click to
 *   toggle. Selecting beyond maxFocus drops the oldest selection (FIFO).
 *
 * URL state mirrored as `?focus=slug,slug,slug` so views are linkable.
 */
export default function HeadToHeadCompare(props: HeadToHeadProps) {
  const NS = "h2h";
  const reader = readUrl(NS);
  const writer = createUrlWriter(NS);
  const maxFocus = () => props.maxFocus ?? 3;

  const initialFocus = (() => {
    const fromUrl = reader.getList("focus");
    if (fromUrl.length > 0) return fromUrl.slice(0, maxFocus());
    return props.defaultFocus.slice(0, maxFocus());
  })();

  const [focus, setFocus] = createSignal<string[]>(initialFocus);
  const [searchInput, setSearchInput] = createSignal<string>(reader.get("q") ?? "");
  const [search, setSearch] = createSignal<string>(reader.get("q") ?? "");

  const debouncedSetSearch = debounce((v: string) => setSearch(v), 120);

  // Index profiles by slug for O(1) lookup.
  const profileBySlug = new Map(props.profiles.map((p) => [p.slug, p]));

  const selectedProfiles = createMemo(() =>
    focus()
      .map((slug) => profileBySlug.get(slug))
      .filter((p): p is ModelProfile => Boolean(p)),
  );

  const filteredModels = createMemo(() => {
    const q = search().trim().toLowerCase();
    if (!q) return props.profiles;
    return props.profiles.filter((p) => {
      const hay = `${p.name} ${p.slug} ${p.organization}`.toLowerCase();
      return hay.includes(q);
    });
  });

  function toggle(slug: string): void {
    const current = focus();
    if (current.includes(slug)) {
      setFocus(current.filter((s) => s !== slug));
    } else {
      const next = [...current, slug];
      // FIFO trim: keep most recent maxFocus selections
      setFocus(next.length > maxFocus() ? next.slice(next.length - maxFocus()) : next);
    }
  }

  function remove(slug: string): void {
    setFocus(focus().filter((s) => s !== slug));
  }

  function clearAll(): void {
    setFocus([]);
  }

  // Write URL state on every change, debounced
  const writeUrl = debounce(() => {
    writer.set("focus", focus());
    writer.set("q", search() || null);
  }, 150);

  onMount(() => {
    // Initial URL sync (in case defaults differ from URL)
    writeUrl();
  });

  // Watch signals via createMemo side-effect
  createMemo(() => {
    focus();
    search();
    writeUrl();
  });

  return (
    <div class="h2h-shell" data-count={selectedProfiles().length}>
      <div class="h2h-chips">
        <Show
          when={selectedProfiles().length > 0}
          fallback={
            <p class="h2h-empty">
              Pick up to {maxFocus()} models from the list below to compare them head-to-head.
            </p>
          }
        >
          <span class="h2h-chips-label">Comparing</span>
          <For each={selectedProfiles()}>
            {(p) => (
              <span class="h2h-chip">
                <a href={p.href}>{p.name}</a>
                <button
                  type="button"
                  class="h2h-chip-remove"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => remove(p.slug)}
                >
                  ×
                </button>
              </span>
            )}
          </For>
          <Show when={selectedProfiles().length > 1}>
            <button type="button" class="h2h-clear" onClick={clearAll}>
              Clear all
            </button>
          </Show>
        </Show>
      </div>

      <Show when={selectedProfiles().length > 0}>
        <div class={`h2h-grid h2h-grid--${selectedProfiles().length}`}>
          <For each={selectedProfiles()}>
            {(p) => (
              <article class="h2h-col" aria-label={`Profile: ${p.name}`}>
                <header class="h2h-col-header">
                  <h3>
                    <a href={p.href}>{p.name}</a>
                  </h3>
                  <p class="h2h-col-org">
                    <span>{p.organization}</span>
                    <span class="h2h-col-sep">·</span>
                    <span>{p.yearLabel}</span>
                  </p>
                  <dl class="h2h-stats">
                    <dt>Params</dt>
                    <dd>
                      {p.parametersTotal}
                      <Show when={p.parametersActive}>
                        <span class="h2h-stat-sub"> · {p.parametersActive} active</span>
                      </Show>
                    </dd>
                    <dt>Context</dt>
                    <dd>{formatContext(p.contextLength)} tokens</dd>
                    <dt>Disclosure</dt>
                    <dd class="h2h-disclosure">{p.disclosure}</dd>
                  </dl>
                </header>

                <section class="h2h-section">
                  <p class="section-eyebrow">Architecture</p>
                  <dl class="h2h-arch">
                    <For each={props.archSlots}>
                      {(slot) => (
                        <>
                          <dt>{slot.label}</dt>
                          <dd>{p.architecture[slot.key] ?? "—"}</dd>
                        </>
                      )}
                    </For>
                  </dl>
                </section>

                <section class="h2h-section">
                  <p class="section-eyebrow">Adopted techniques</p>
                  <Show
                    when={p.adoptedByCategory.length > 0}
                    fallback={<p class="h2h-empty-techs">No adoption claims documented yet.</p>}
                  >
                    <For each={p.adoptedByCategory}>
                      {(group) => (
                        <div class="h2h-tech-group">
                          <p class="h2h-tech-cat">{group.categoryLabel}</p>
                          <ul class="h2h-tech-chips">
                            <For each={group.techniques}>
                              {(t) => (
                                <li>
                                  <a class="h2h-tech-chip" href={t.href} title={t.title}>
                                    {t.abbreviation}
                                  </a>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      )}
                    </For>
                  </Show>
                </section>
              </article>
            )}
          </For>
        </div>
      </Show>

      <section class="h2h-picker">
        <header class="h2h-picker-head">
          <p class="section-eyebrow">All models</p>
          <h3>Pick to compare ({props.profiles.length} models)</h3>
          <label class="h2h-search">
            <span class="visually-hidden">Search models</span>
            <input
              type="search"
              placeholder="Search models or organization…"
              value={searchInput()}
              onInput={(e) => {
                setSearchInput(e.currentTarget.value);
                debouncedSetSearch(e.currentTarget.value);
              }}
            />
          </label>
        </header>

        <ul class="h2h-picker-list">
          <For each={filteredModels()}>
            {(p) => {
              const isSelected = createMemo(() => focus().includes(p.slug));
              const isFull = createMemo(() => !isSelected() && focus().length >= maxFocus());
              return (
                <li>
                  <button
                    type="button"
                    class="h2h-picker-item"
                    classList={{ "is-selected": isSelected(), "is-full": isFull() }}
                    aria-pressed={isSelected() ? "true" : "false"}
                    onClick={() => toggle(p.slug)}
                    title={
                      isFull()
                        ? `Adding will drop the oldest selection (max ${maxFocus()})`
                        : isSelected()
                          ? `Remove ${p.name}`
                          : `Add ${p.name} to comparison`
                    }
                  >
                    <span class="h2h-picker-name">{p.name}</span>
                    <span class="h2h-picker-meta">
                      <span class="h2h-picker-org">{p.organization}</span>
                      <span class="h2h-picker-sep">·</span>
                      <span class="h2h-picker-year">{p.yearLabel}</span>
                    </span>
                    <span class="h2h-picker-mark" aria-hidden="true">
                      {isSelected() ? "✓" : "+"}
                    </span>
                  </button>
                </li>
              );
            }}
          </For>
        </ul>

        <Show when={filteredModels().length === 0}>
          <p class="h2h-no-results">No models match "{search()}".</p>
        </Show>
      </section>
    </div>
  );
}
