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
        {(() => {
          const profiles = selectedProfiles();
          // Union of categories adopted by at least one selected model,
          // preserving the canonical category order from the first profile that has each.
          const categorySet = new Set<string>();
          const categoryLabels = new Map<string, string>();
          for (const p of profiles) {
            for (const g of p.adoptedByCategory) {
              categorySet.add(g.category);
              if (!categoryLabels.has(g.category)) categoryLabels.set(g.category, g.categoryLabel);
            }
          }
          // Reorder by the order they appear in any profile's groups (stable).
          const orderedCats: { category: string; categoryLabel: string }[] = [];
          for (const p of profiles) {
            for (const g of p.adoptedByCategory) {
              if (
                categorySet.has(g.category) &&
                !orderedCats.find((c) => c.category === g.category)
              ) {
                orderedCats.push({ category: g.category, categoryLabel: g.categoryLabel });
              }
            }
          }
          const techsFor = (p: ModelProfile, cat: string): AdoptedTechnique[] => {
            const g = p.adoptedByCategory.find((g) => g.category === cat);
            return g?.techniques ?? [];
          };

          return (
            <div class="h2h-compare-wrap" role="region" aria-label="Head-to-head model comparison">
              <table class="h2h-compare">
                <colgroup>
                  <col class="h2h-compare-labelcol" />
                  <For each={profiles}>{() => <col class="h2h-compare-valcol" />}</For>
                </colgroup>

                <thead>
                  <tr class="h2h-compare-namerow">
                    <th scope="col" />
                    <For each={profiles}>
                      {(p) => (
                        <th scope="col" class="h2h-compare-modelhead">
                          <a href={p.href}>{p.name}</a>
                          <span class="h2h-compare-org">{p.organization}</span>
                        </th>
                      )}
                    </For>
                  </tr>
                  <tr class="h2h-compare-metarow">
                    <th scope="col" />
                    <For each={profiles}>
                      {(p) => (
                        <td class="h2h-compare-modelmeta">
                          <span>{p.yearLabel}</span>
                          <span class="h2h-compare-sep">·</span>
                          <span>
                            {p.parametersTotal}
                            <Show when={p.parametersActive}>
                              <span class="h2h-compare-sub"> ({p.parametersActive} active)</span>
                            </Show>
                          </span>
                          <span class="h2h-compare-sep">·</span>
                          <span>{formatContext(p.contextLength)} ctx</span>
                          <span class="h2h-compare-sep">·</span>
                          <span class="h2h-compare-disclosure">{p.disclosure}</span>
                        </td>
                      )}
                    </For>
                  </tr>
                </thead>

                <tbody>
                  <tr class="h2h-compare-sectionrow">
                    <th
                      scope="colgroup"
                      colspan={profiles.length + 1}
                      class="h2h-compare-sectionhead"
                    >
                      <span class="section-eyebrow">Architecture</span>
                    </th>
                  </tr>
                  <For each={props.archSlots}>
                    {(slot) => (
                      <tr class="h2h-compare-row">
                        <th scope="row" class="h2h-compare-rowlabel">
                          {slot.label}
                        </th>
                        <For each={profiles}>
                          {(p) => {
                            const v = p.architecture[slot.key];
                            const missing = !v || v === "—";
                            return (
                              <td class="h2h-compare-val" classList={{ "is-missing": missing }}>
                                {missing ? "—" : v}
                              </td>
                            );
                          }}
                        </For>
                      </tr>
                    )}
                  </For>
                </tbody>

                <Show when={orderedCats.length > 0}>
                  <tbody>
                    <tr class="h2h-compare-sectionrow">
                      <th
                        scope="colgroup"
                        colspan={profiles.length + 1}
                        class="h2h-compare-sectionhead"
                      >
                        <span class="section-eyebrow">Adopted techniques</span>
                      </th>
                    </tr>
                    <For each={orderedCats}>
                      {(cat) => (
                        <tr class="h2h-compare-row">
                          <th scope="row" class="h2h-compare-rowlabel">
                            {cat.categoryLabel}
                          </th>
                          <For each={profiles}>
                            {(p) => {
                              const techs = techsFor(p, cat.category);
                              const empty = techs.length === 0;
                              return (
                                <td
                                  class="h2h-compare-val h2h-compare-techs"
                                  classList={{ "is-missing": empty }}
                                >
                                  <Show
                                    when={!empty}
                                    fallback={<>—</>}
                                  >
                                    <ul class="h2h-tech-chips">
                                      <For each={techs}>
                                        {(t) => (
                                          <li>
                                            <a
                                              class="h2h-tech-chip"
                                              href={t.href}
                                              title={t.title}
                                            >
                                              {t.abbreviation}
                                            </a>
                                          </li>
                                        )}
                                      </For>
                                    </ul>
                                  </Show>
                                </td>
                              );
                            }}
                          </For>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </Show>
              </table>

              <p class="h2h-compare-footnote">
                <span aria-hidden="true">—</span> means the choice was not publicly disclosed
                by the model's developers, per the
                {" "}<a href="../about/">citation policy</a>. Empty technique rows likewise mean
                no adoption claim has been documented for that category.
              </p>
            </div>
          );
        })()}
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
