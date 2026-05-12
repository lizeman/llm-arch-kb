/** @jsxImportSource solid-js */
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/solid-table";
import FilterChips, { type ChipOption } from "./FilterChips";
import ExportButtons, { type Cell } from "./ExportButtons";
import { createUrlWriter, debounce, readUrl } from "./UrlState";

export interface FilterDef {
  /** Querystring key (without namespace prefix). */
  key: string;
  legend: string;
  /** Resolves a row's value for this filter. */
  accessor: (row: unknown) => string | string[] | number | null | undefined;
  /** Allowed options. "all" is added automatically as the first option. */
  options: ChipOption[];
  /** Special "year-range" mode renders two number inputs instead of chips. */
  mode?: "chip" | "year-range";
  /** Year-range only: min/max bounds for the inputs. */
  bounds?: { min: number; max: number };
}

/**
 * Compare-column = stable id + header + a TanStack ColumnDef + export metadata.
 *
 * TanStack ColumnDef is a discriminated union (id vs accessorKey vs accessorFn),
 * so we keep our wrapper simple and pass the def through verbatim.
 */
export type CompareColumn<TData> = {
  /** Stable id used for sort/filter URL state and header rendering. */
  id: string;
  /** Header text shown in the table and exports. */
  header: string;
  /** Export accessor; falls back to the header value if omitted. */
  exportAccessor?: (row: TData) => Cell;
  /** Header label used in exports (defaults to `header`). */
  exportHeader?: string;
  /** The TanStack column definition. `id` is patched in by CompareMatrix. */
  def: ColumnDef<TData>;
};

export interface CompareMatrixProps<TData> {
  /** URL-state namespace (e.g. "arch", "heat", "tech"). */
  ns: string;
  /** Data rows. */
  data: TData[];
  /** Column definitions. */
  columns: CompareColumn<TData>[];
  /** Filter chip groups above the table. */
  filters?: FilterDef[];
  /** Global text search? (live search box.) */
  searchable?: boolean;
  /** Field name(s) that the global search inspects. */
  searchAccessor?: (row: TData) => string;
  /** Filename stem for CSV export. */
  exportFilename: string;
  /** Optional caption for screen readers. */
  caption?: string;
  /** Initial sort (column id + direction). Secondary year-asc sort handled by component. */
  initialSort?: { id: string; desc: boolean }[];
  /** Mobile fallback render — Solid component called when narrow. */
  mobileFallback?: (rows: () => TData[]) => unknown;
  /** Threshold (px) below which mobile fallback engages. */
  mobileBreakpoint?: number;
}

/**
 * Generic compare-table host built on TanStack Solid.
 *
 * Renders sortable headers, filter chips, live search, and an export bar.
 * URL state for filter/sort/search is debounced into the querystring.
 */
export default function CompareMatrix<TData>(props: CompareMatrixProps<TData>) {
  const ns = props.ns;
  const reader = readUrl(ns);
  const writer = createUrlWriter(ns);

  // ---- Sorting state -----------------------------------------------------
  const initialSortState: SortingState = (() => {
    const s = reader.get("sort");
    if (s) {
      // "id:asc" or "id:desc"
      const [id, dir] = s.split(":");
      if (id) return [{ id, desc: dir === "desc" }];
    }
    return props.initialSort ?? [];
  })();
  const [sorting, setSorting] = createSignal<SortingState>(initialSortState);

  // ---- Column filters state ----------------------------------------------
  const initialFilters: ColumnFiltersState = (() => {
    if (!props.filters) return [];
    const out: ColumnFiltersState = [];
    for (const f of props.filters) {
      if (f.mode === "year-range") {
        const lo = reader.get(`${f.key}_min`);
        const hi = reader.get(`${f.key}_max`);
        if (lo || hi) {
          out.push({
            id: f.key,
            value: [lo ? Number(lo) : null, hi ? Number(hi) : null],
          });
        }
      } else {
        const v = reader.get(f.key);
        if (v && v !== "all") out.push({ id: f.key, value: v });
      }
    }
    return out;
  })();
  const [colFilters, setColFilters] = createSignal<ColumnFiltersState>(initialFilters);

  // ---- Global search -----------------------------------------------------
  const [search, setSearch] = createSignal<string>(reader.get("q") ?? "");
  const [searchDebounced, setSearchDebounced] = createSignal<string>(reader.get("q") ?? "");
  const writeSearchUrl = debounce((v: string) => {
    writer.set("q", v);
    setSearchDebounced(v);
  }, 120);

  // ---- Year-range raw input state (separate from colFilters for typing) --
  const [yearRange, setYearRange] = createSignal<Record<string, [number | null, number | null]>>(
    (() => {
      const seed: Record<string, [number | null, number | null]> = {};
      for (const f of props.filters ?? []) {
        if (f.mode === "year-range") {
          const lo = reader.get(`${f.key}_min`);
          const hi = reader.get(`${f.key}_max`);
          seed[f.key] = [lo ? Number(lo) : null, hi ? Number(hi) : null];
        }
      }
      return seed;
    })(),
  );

  // ---- Mobile breakpoint detection ---------------------------------------
  const breakpoint = props.mobileBreakpoint ?? 880;
  const [isNarrow, setIsNarrow] = createSignal(false);
  onMount(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener?.("change", onChange);
  });

  // ---- Wire filter changes to URL ----------------------------------------
  function setChipFilter(key: string, value: string) {
    setColFilters((prev) => {
      const next = prev.filter((f) => f.id !== key);
      if (value && value !== "all") next.push({ id: key, value });
      return next;
    });
    writer.set(key, value === "all" ? null : value);
  }

  function setYearRangeFilter(key: string, lo: number | null, hi: number | null) {
    setYearRange((prev) => ({ ...prev, [key]: [lo, hi] }));
    setColFilters((prev) => {
      const next = prev.filter((f) => f.id !== key);
      if (lo !== null || hi !== null) next.push({ id: key, value: [lo, hi] });
      return next;
    });
    writer.set(`${key}_min`, lo);
    writer.set(`${key}_max`, hi);
  }

  function onSortChange(next: SortingState | ((s: SortingState) => SortingState)) {
    const resolved = typeof next === "function" ? next(sorting()) : next;
    setSorting(resolved);
    if (resolved.length === 0) {
      writer.set("sort", null);
    } else {
      const s = resolved[0];
      writer.set("sort", `${s.id}:${s.desc ? "desc" : "asc"}`);
    }
  }

  function onSearchInput(e: InputEvent & { currentTarget: HTMLInputElement }) {
    const v = e.currentTarget.value;
    setSearch(v);
    writeSearchUrl(v);
  }

  // ---- Build TanStack column defs (patch in id + header) ----------------
  const augmentedColumns = createMemo<ColumnDef<TData>[]>(() => {
    return props.columns.map((c) => ({
      ...c.def,
      id: c.id,
      header: c.header,
    } as ColumnDef<TData>));
  });

  // For chip filters whose `id` isn't a real TanStack column, we apply the
  // filter via a row-level globalFilterFn alternative: precompute a `filtered`
  // memo that respects chip filters and search.
  const filteredData = createMemo<TData[]>(() => {
    const filters = colFilters();
    const q = searchDebounced().trim().toLowerCase();
    return props.data.filter((row) => {
      // Apply each filter
      for (const cf of filters) {
        const filterMeta = props.filters?.find((f) => f.key === cf.id);
        if (!filterMeta) continue;
        const v = filterMeta.accessor(row);
        if (filterMeta.mode === "year-range") {
          const [lo, hi] = cf.value as [number | null, number | null];
          if (typeof v !== "number") return false;
          if (lo !== null && v < lo) return false;
          if (hi !== null && v > hi) return false;
        } else {
          const want = String(cf.value);
          if (Array.isArray(v)) {
            if (!v.map(String).includes(want)) return false;
          } else if (String(v) === "undefined" || String(v) === "null" || v === null || v === undefined) {
            return false;
          } else if (String(v) !== want) {
            return false;
          }
        }
      }
      // Apply global search
      if (q && props.searchAccessor) {
        const hay = props.searchAccessor(row).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  const table = createSolidTable<TData>({
    get data() {
      return filteredData();
    },
    columns: augmentedColumns() as ColumnDef<TData>[],
    state: {
      get sorting() {
        return sorting();
      },
    },
    onSortingChange: onSortChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ---- Export payload ----------------------------------------------------
  const exportRows = () => {
    const header: Cell[] = props.columns.map((c) => c.exportHeader ?? c.header);
    const rows: Cell[][] = [header];
    for (const r of table.getSortedRowModel().rows) {
      const row: Cell[] = props.columns.map((c) => {
        if (c.exportAccessor) return c.exportAccessor(r.original);
        const v = (r.original as unknown as Record<string, Cell>)[c.id];
        return v ?? "";
      });
      rows.push(row);
    }
    return rows;
  };

  // ---- Render ------------------------------------------------------------
  return (
    <div class="cmp-matrix">
      <Show when={props.filters?.length || props.searchable}>
        <div class="cmp-controls">
          <For each={props.filters}>
            {(f) => {
              if (f.mode === "year-range") {
                const cur = () => yearRange()[f.key] ?? [null, null];
                return (
                  <fieldset class="cmp-year-range" aria-label={f.legend}>
                    <legend class="cmp-chips-legend">{f.legend}</legend>
                    <label class="cmp-year-label">
                      <span class="visually-hidden">From year</span>
                      <input
                        type="number"
                        class="cmp-year-input"
                        placeholder={String(f.bounds?.min ?? "")}
                        min={f.bounds?.min}
                        max={f.bounds?.max}
                        value={cur()[0] ?? ""}
                        onInput={(e) => {
                          const raw = e.currentTarget.value;
                          const lo = raw === "" ? null : Number(raw);
                          setYearRangeFilter(f.key, lo, cur()[1]);
                        }}
                      />
                    </label>
                    <span class="cmp-year-sep" aria-hidden="true">–</span>
                    <label class="cmp-year-label">
                      <span class="visually-hidden">To year</span>
                      <input
                        type="number"
                        class="cmp-year-input"
                        placeholder={String(f.bounds?.max ?? "")}
                        min={f.bounds?.min}
                        max={f.bounds?.max}
                        value={cur()[1] ?? ""}
                        onInput={(e) => {
                          const raw = e.currentTarget.value;
                          const hi = raw === "" ? null : Number(raw);
                          setYearRangeFilter(f.key, cur()[0], hi);
                        }}
                      />
                    </label>
                  </fieldset>
                );
              }
              const active = () => {
                const cf = colFilters().find((c) => c.id === f.key);
                return cf ? String(cf.value) : "all";
              };
              const optsWithAll: ChipOption[] = [
                { key: "all", label: "All" },
                ...f.options,
              ];
              return (
                <FilterChips
                  legend={f.legend}
                  options={optsWithAll}
                  active={active()}
                  onChange={(k) => setChipFilter(f.key, k)}
                />
              );
            }}
          </For>
          <Show when={props.searchable}>
            <label class="cmp-search">
              <span class="visually-hidden">Search</span>
              <input
                type="search"
                class="cmp-search-input"
                placeholder="Search…"
                value={search()}
                onInput={onSearchInput}
              />
            </label>
          </Show>
        </div>
      </Show>

      <div class="cmp-toolbar">
        <ExportButtons
          filename={props.exportFilename}
          rows={exportRows}
          label={props.exportFilename}
        />
        <span class="cmp-rowcount">
          {table.getRowModel().rows.length} of {props.data.length}
        </span>
      </div>

      <Show
        when={!(isNarrow() && props.mobileFallback)}
        fallback={<>{props.mobileFallback?.(() => table.getSortedRowModel().rows.map((r) => r.original))}</>}
      >
        <div class="cmp-table-wrap">
          <table class="cmp-table">
            <Show when={props.caption}>
              <caption class="visually-hidden">{props.caption}</caption>
            </Show>
            <thead>
              <For each={table.getHeaderGroups()}>
                {(hg) => (
                  <tr>
                    <For each={hg.headers}>
                      {(h) => {
                        const canSort = () => h.column.getCanSort();
                        const dir = () => h.column.getIsSorted();
                        const aria = () =>
                          dir() === "asc" ? "ascending" : dir() === "desc" ? "descending" : "none";
                        return (
                          <th
                            scope="col"
                            class="cmp-th"
                            classList={{ "is-sortable": canSort(), "is-sorted": !!dir() }}
                            aria-sort={aria()}
                          >
                            <Show
                              when={canSort()}
                              fallback={
                                <>
                                  {h.isPlaceholder
                                    ? null
                                    : flexRender(h.column.columnDef.header, h.getContext())}
                                </>
                              }
                            >
                              <button
                                type="button"
                                class="cmp-th-btn"
                                onClick={h.column.getToggleSortingHandler()}
                              >
                                <span>
                                  {h.isPlaceholder
                                    ? null
                                    : flexRender(h.column.columnDef.header, h.getContext())}
                                </span>
                                <span class="cmp-sort-arrow" aria-hidden="true">
                                  {dir() === "asc" ? "▲" : dir() === "desc" ? "▼" : ""}
                                </span>
                              </button>
                            </Show>
                          </th>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>
            </thead>
            <tbody>
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <tr>
                    <For each={row.getVisibleCells()}>
                      {(c) => (
                        <td class="cmp-td">
                          {flexRender(c.column.columnDef.cell, c.getContext())}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
              <Show when={table.getRowModel().rows.length === 0}>
                <tr>
                  <td class="cmp-empty" colspan={props.columns.length}>
                    No rows match the current filters.
                  </td>
                </tr>
              </Show>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
}
