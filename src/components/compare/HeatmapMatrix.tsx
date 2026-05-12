/** @jsxImportSource solid-js */
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import FilterChips, { type ChipOption } from "./FilterChips";
import MultiSelectFocus from "./MultiSelectFocus";
import ExportButtons, { type Cell } from "./ExportButtons";
import AdoptionStats from "./AdoptionStats";
import { createUrlWriter, debounce, readUrl } from "./UrlState";

export interface HeatmapModelRow {
  slug: string;
  name: string;
  organization: string;
  year: number;
  disclosure: string;
  href: string;
}

export interface HeatmapColumnSpec {
  cat: string;
  catLabel: string;
  slug: string;
  title: string;
  abbreviation: string;
  href: string;
  /** Set of model slugs that adopt this technique. */
  adopted: string[];
}

export interface HeatmapProps {
  models: HeatmapModelRow[];
  columns: HeatmapColumnSpec[];
  categoryOptions: ChipOption[];
  organizationOptions: ChipOption[];
  mobileBreakpoint?: number;
}

/**
 * Model × technique adoption heatmap.
 *
 * Owns its own filter chips (category, organization, year range), live search,
 * multi-select focus, adoption-stat footer, and CSV/Markdown export. Row+column
 * hover highlight via the `tr:hover` and `td:hover` CSS selectors using
 * `:has()` for cross-axis lighting.
 */
export default function HeatmapMatrix(props: HeatmapProps) {
  const NS = "heat";
  const reader = readUrl(NS);
  const writer = createUrlWriter(NS);

  const [catFilter, setCatFilter] = createSignal<string>(reader.get("cat") ?? "all");
  const [orgFilter, setOrgFilter] = createSignal<string>(reader.get("org") ?? "all");
  const [yearMin, setYearMin] = createSignal<number | null>(
    reader.get("y_min") ? Number(reader.get("y_min")) : null,
  );
  const [yearMax, setYearMax] = createSignal<number | null>(
    reader.get("y_max") ? Number(reader.get("y_max")) : null,
  );
  const [searchInput, setSearchInput] = createSignal<string>(reader.get("q") ?? "");
  const [search, setSearch] = createSignal<string>(reader.get("q") ?? "");
  const [focus, setFocus] = createSignal<string[]>(reader.getList("focus"));
  const [sortMode, setSortMode] = createSignal<string>(reader.get("sort") ?? "year:asc");

  const writeSearch = debounce((v: string) => {
    setSearch(v);
    writer.set("q", v);
  }, 120);

  const breakpoint = props.mobileBreakpoint ?? 880;
  const [isNarrow, setIsNarrow] = createSignal(false);
  let tableRoot: HTMLDivElement | undefined;
  onMount(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia === "function") {
      const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
      setIsNarrow(mq.matches);
      mq.addEventListener?.("change", (e: MediaQueryListEvent) => setIsNarrow(e.matches));
    }

    // Column hover highlight: delegate at the wrapper. Row highlight is
    // handled by CSS :has(); column highlight requires JS because the column
    // header lives outside the hovered cell's row.
    const root = tableRoot;
    if (!root) return;
    let activeCol: string | null = null;
    const clearActive = () => {
      if (!activeCol) return;
      root.querySelectorAll(`[data-col="${CSS.escape(activeCol)}"]`).forEach((el) => {
        el.classList.remove("is-col-active");
      });
      activeCol = null;
    };
    const setActive = (slug: string) => {
      if (activeCol === slug) return;
      clearActive();
      activeCol = slug;
      root.querySelectorAll(`[data-col="${CSS.escape(slug)}"]`).forEach((el) => {
        el.classList.add("is-col-active");
      });
    };
    root.addEventListener("pointerover", (ev) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const cell = target.closest("td.heatmap-cell") as HTMLElement | null;
      if (cell && cell.dataset.col) setActive(cell.dataset.col);
    });
    root.addEventListener("pointerleave", clearActive);
  });

  // ---- Derived: filtered columns -----------------------------------------
  const visibleColumns = createMemo<HeatmapColumnSpec[]>(() => {
    const cat = catFilter();
    const q = search().trim().toLowerCase();
    return props.columns.filter((c) => {
      if (cat !== "all" && c.cat !== cat) return false;
      if (q) {
        const hay = `${c.abbreviation} ${c.title} ${c.catLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  // ---- Derived: filtered + sorted models ---------------------------------
  const visibleModels = createMemo<HeatmapModelRow[]>(() => {
    const org = orgFilter();
    const lo = yearMin();
    const hi = yearMax();
    const q = search().trim().toLowerCase();
    const focused = focus();
    const isFocusMode = focused.length >= 2 && focused.length <= 6;

    let rows = props.models.filter((m) => {
      if (org !== "all" && m.organization !== org) return false;
      if (lo !== null && m.year < lo) return false;
      if (hi !== null && m.year > hi) return false;
      if (q && !`${m.name} ${m.organization}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (isFocusMode) {
      rows = rows.filter((m) => focused.includes(m.slug));
    }

    const [field, dir] = sortMode().split(":");
    const mul = dir === "desc" ? -1 : 1;
    rows = rows.slice().sort((a, b) => {
      let cmp = 0;
      if (field === "name") cmp = a.name.localeCompare(b.name);
      else if (field === "org") cmp = a.organization.localeCompare(b.organization);
      else cmp = a.year - b.year; // default + secondary
      if (cmp === 0) cmp = a.year - b.year; // secondary year asc
      return cmp * mul;
    });
    return rows;
  });

  // ---- Column adoption stats over currently visible rows -----------------
  const colStats = createMemo(() => {
    const rows = visibleModels();
    const totals = new Map<string, number>();
    const adopted = new Set(rows.map((m) => m.slug));
    for (const c of visibleColumns()) {
      let n = 0;
      for (const s of c.adopted) if (adopted.has(s)) n++;
      totals.set(c.slug, n);
    }
    return { hits: totals, total: rows.length };
  });

  // ---- URL wiring --------------------------------------------------------
  function changeCat(v: string) {
    setCatFilter(v);
    writer.set("cat", v === "all" ? null : v);
  }
  function changeOrg(v: string) {
    setOrgFilter(v);
    writer.set("org", v === "all" ? null : v);
  }
  function changeYearMin(v: number | null) {
    setYearMin(v);
    writer.set("y_min", v);
  }
  function changeYearMax(v: number | null) {
    setYearMax(v);
    writer.set("y_max", v);
  }
  function changeSort(v: string) {
    setSortMode(v);
    writer.set("sort", v === "year:asc" ? null : v);
  }
  function toggleFocus(slug: string) {
    setFocus((prev) => {
      const exists = prev.includes(slug);
      let next: string[];
      if (exists) next = prev.filter((s) => s !== slug);
      else if (prev.length >= 6) next = prev; // cap
      else next = [...prev, slug];
      writer.set("focus", next.length === 0 ? null : next);
      return next;
    });
  }
  function clearFocus() {
    setFocus([]);
    writer.set("focus", null);
  }

  // ---- Export ------------------------------------------------------------
  const exportRows = () => {
    const header: Cell[] = ["Model", "Organization", "Year", ...visibleColumns().map((c) => c.abbreviation)];
    const rows: Cell[][] = [header];
    const cols = visibleColumns();
    for (const m of visibleModels()) {
      const row: Cell[] = [m.name, m.organization, m.year];
      for (const c of cols) row.push(c.adopted.includes(m.slug) ? "yes" : "");
      rows.push(row);
    }
    return rows;
  };

  // ---- Focus options for the multi-select pill list ----------------------
  const focusOptions = createMemo(() =>
    props.models.map((m) => ({ value: m.slug, label: m.name })),
  );

  // ---- Mobile card fallback ----------------------------------------------
  const MobileCards = () => (
    <div class="heatmap-cards">
      <For each={visibleModels()}>
        {(m) => {
          const adopted = visibleColumns().filter((c) => c.adopted.includes(m.slug));
          return (
            <section class="heatmap-card">
              <h3>
                <a href={m.href}>{m.name}</a>
                <span class="card-org">{m.organization}</span>
              </h3>
              <Show
                when={adopted.length > 0}
                fallback={<p class="card-empty">No documented adoptions for current filters.</p>}
              >
                <ul class="card-chips">
                  <For each={adopted}>
                    {(c) => (
                      <li>
                        <a class="chip-link" href={c.href} title={c.title}>
                          {c.abbreviation}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </section>
          );
        }}
      </For>
    </div>
  );

  return (
    <div class="cmp-matrix cmp-heatmap">
      <div class="cmp-controls">
        <FilterChips
          legend="Category"
          options={[{ key: "all", label: "All" }, ...props.categoryOptions]}
          active={catFilter()}
          onChange={changeCat}
        />
        <FilterChips
          legend="Organization"
          options={[{ key: "all", label: "All" }, ...props.organizationOptions]}
          active={orgFilter()}
          onChange={changeOrg}
        />
        <fieldset class="cmp-year-range" aria-label="Year range">
          <legend class="cmp-chips-legend">Year</legend>
          <label class="cmp-year-label">
            <span class="visually-hidden">From year</span>
            <input
              type="number"
              class="cmp-year-input"
              placeholder="min"
              value={yearMin() ?? ""}
              onInput={(e) => {
                const raw = e.currentTarget.value;
                changeYearMin(raw === "" ? null : Number(raw));
              }}
            />
          </label>
          <span class="cmp-year-sep" aria-hidden="true">–</span>
          <label class="cmp-year-label">
            <span class="visually-hidden">To year</span>
            <input
              type="number"
              class="cmp-year-input"
              placeholder="max"
              value={yearMax() ?? ""}
              onInput={(e) => {
                const raw = e.currentTarget.value;
                changeYearMax(raw === "" ? null : Number(raw));
              }}
            />
          </label>
        </fieldset>
        <label class="cmp-search">
          <span class="visually-hidden">Search</span>
          <input
            type="search"
            class="cmp-search-input"
            placeholder="Search models or techniques…"
            value={searchInput()}
            onInput={(e) => {
              const v = e.currentTarget.value;
              setSearchInput(v);
              writeSearch(v);
            }}
          />
        </label>
        <fieldset class="cmp-chips" aria-label="Sort">
          <legend class="cmp-chips-legend">Sort</legend>
          <For
            each={[
              { key: "year:asc", label: "Year ↑" },
              { key: "year:desc", label: "Year ↓" },
              { key: "name:asc", label: "Name A→Z" },
              { key: "org:asc", label: "Org A→Z" },
            ]}
          >
            {(opt) => (
              <button
                type="button"
                class="cmp-chip"
                classList={{ "is-active": sortMode() === opt.key }}
                aria-pressed={sortMode() === opt.key}
                onClick={() => changeSort(opt.key)}
              >
                <span class="cmp-chip-label">{opt.label}</span>
              </button>
            )}
          </For>
        </fieldset>
      </div>

      <MultiSelectFocus
        options={focusOptions()}
        selected={focus()}
        onToggle={toggleFocus}
        onClear={clearFocus}
      />

      <div class="cmp-toolbar">
        <ExportButtons filename="model-x-technique-matrix" rows={exportRows} label="heatmap" />
        <span class="cmp-rowcount">
          {visibleModels().length} models · {visibleColumns().length} techniques
        </span>
      </div>

      <Show when={!isNarrow()} fallback={<MobileCards />}>
        <div class="heatmap-wrap" ref={tableRoot}>
          <table class="heatmap">
            <caption class="visually-hidden">Model × technique adoption matrix</caption>
            <thead>
              <tr class="heatmap-grouprow">
                <th scope="col" class="heatmap-corner" rowspan="2">Model</th>
                <For
                  each={(() => {
                    // group adjacent columns by category for the group header row
                    const cols = visibleColumns();
                    const groups: { cat: string; label: string; count: number }[] = [];
                    for (const c of cols) {
                      const last = groups[groups.length - 1];
                      if (last && last.cat === c.cat) last.count++;
                      else groups.push({ cat: c.cat, label: c.catLabel, count: 1 });
                    }
                    return groups;
                  })()}
                >
                  {(g, i) => (
                    <th
                      scope="colgroup"
                      colspan={g.count}
                      class="heatmap-group"
                      classList={{ "group-sep": i() > 0 }}
                    >
                      {g.label}
                    </th>
                  )}
                </For>
              </tr>
              <tr>
                <For each={visibleColumns()}>
                  {(c, i) => {
                    const cols = visibleColumns();
                    const prev = i() > 0 ? cols[i() - 1] : undefined;
                    const newGroup = !prev || prev.cat !== c.cat;
                    return (
                      <th
                        scope="col"
                        class="heatmap-col"
                        classList={{ "group-sep": newGroup && i() > 0 }}
                        title={c.title}
                        data-col={c.slug}
                      >
                        <a href={c.href}>{c.abbreviation}</a>
                      </th>
                    );
                  }}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={visibleModels()}>
                {(m) => (
                  <tr data-row={m.slug}>
                    <th scope="row" class="heatmap-rowhead">
                      <a href={m.href}>{m.name}</a>
                    </th>
                    <For each={visibleColumns()}>
                      {(c, i) => {
                        const cols = visibleColumns();
                        const prev = i() > 0 ? cols[i() - 1] : undefined;
                        const newGroup = !prev || prev.cat !== c.cat;
                        const hit = c.adopted.includes(m.slug);
                        return (
                          <td
                            class="heatmap-cell"
                            classList={{ "group-sep": newGroup && i() > 0, "is-hit": hit }}
                            data-col={c.slug}
                            data-row={m.slug}
                          >
                            {hit ? (
                              <span class="dot" aria-label={`${m.name} adopts ${c.title}`}>●</span>
                            ) : (
                              <span class="empty-cell" aria-hidden="true"></span>
                            )}
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>
              <Show when={visibleModels().length === 0}>
                <tr>
                  <td class="cmp-empty" colspan={visibleColumns().length + 1}>
                    No models match the current filters.
                  </td>
                </tr>
              </Show>
            </tbody>
            <tfoot>
              <tr class="heatmap-statsrow">
                <th scope="row" class="heatmap-corner heatmap-statshead">Adopters</th>
                <For each={visibleColumns()}>
                  {(c, i) => {
                    const cols = visibleColumns();
                    const prev = i() > 0 ? cols[i() - 1] : undefined;
                    const newGroup = !prev || prev.cat !== c.cat;
                    return (
                      <td class="heatmap-statscell" classList={{ "group-sep": newGroup && i() > 0 }}>
                        <AdoptionStats
                          hits={colStats().hits.get(c.slug) ?? 0}
                          total={colStats().total}
                        />
                      </td>
                    );
                  }}
                </For>
              </tr>
            </tfoot>
          </table>
        </div>
      </Show>
    </div>
  );
}
