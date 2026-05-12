/**
 * Tiny URL-state helper for the compare-page islands.
 *
 * Each table-island owns a namespace (a short prefix) so multiple tables can
 * coexist on the same page without clobbering each other's querystring keys.
 *
 * State is mirrored to `history.replaceState` so back/forward doesn't pile up,
 * and views are linkable: the `read` call on mount restores from the URL.
 */

export type UrlPrimitive = string | number | boolean | string[] | null | undefined;

export interface UrlReader {
  get(key: string): string | null;
  getList(key: string): string[];
}

export interface UrlWriter {
  set(key: string, value: UrlPrimitive): void;
  flush(): void;
}

const LIST_SEP = ",";

function keyOf(ns: string, key: string): string {
  return ns ? `${ns}.${key}` : key;
}

/** Read state from the current location.search, namespaced. */
export function readUrl(ns: string): UrlReader {
  if (typeof window === "undefined") {
    return {
      get: () => null,
      getList: () => [],
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    get(key: string) {
      const v = params.get(keyOf(ns, key));
      return v && v.length > 0 ? v : null;
    },
    getList(key: string) {
      const v = params.get(keyOf(ns, key));
      if (!v) return [];
      return v.split(LIST_SEP).map((s) => s.trim()).filter(Boolean);
    },
  };
}

/**
 * Debounced writer. Repeated `set` calls coalesce; `flush` writes immediately.
 * Empty / null values delete the key. Lists serialize as comma-joined strings.
 */
export function createUrlWriter(ns: string, debounceMs = 150): UrlWriter {
  let pending: Map<string, UrlPrimitive> = new Map();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function commit() {
    if (typeof window === "undefined") {
      pending.clear();
      return;
    }
    const url = new URL(window.location.href);
    const params = url.searchParams;
    for (const [k, v] of pending.entries()) {
      const full = keyOf(ns, k);
      if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
        params.delete(full);
      } else if (Array.isArray(v)) {
        params.set(full, v.join(LIST_SEP));
      } else if (typeof v === "boolean") {
        if (v) params.set(full, "1");
        else params.delete(full);
      } else {
        params.set(full, String(v));
      }
    }
    pending.clear();
    const search = params.toString();
    const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
    window.history.replaceState(null, "", next);
  }

  return {
    set(key, value) {
      pending.set(key, value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        commit();
      }, debounceMs);
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      commit();
    },
  };
}

/** Tiny debounce for non-URL signals (search input). */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, ms);
  }) as T;
}
