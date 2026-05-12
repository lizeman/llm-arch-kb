export type Chronological = {
  data: { year: number; month?: number; order?: number; title: string };
};

export function compareChronological<T extends Chronological>(a: T, b: T): number {
  if (a.data.order !== undefined && b.data.order !== undefined) return a.data.order - b.data.order;
  if (a.data.year !== b.data.year) return a.data.year - b.data.year;
  const am = a.data.month ?? 0;
  const bm = b.data.month ?? 0;
  if (am !== bm) return am - bm;
  return a.data.title.localeCompare(b.data.title);
}

export function sortChronological<T extends Chronological>(items: T[]): T[] {
  return [...items].sort(compareChronological);
}

export function compareByDate(
  a: { year: number; month?: number },
  b: { year: number; month?: number },
): number {
  if (a.year !== b.year) return a.year - b.year;
  return (a.month ?? 0) - (b.month ?? 0);
}

export function monthName(m: number | undefined, style: "short" | "long" = "short"): string {
  if (!m) return "";
  return new Date(2000, m - 1, 1).toLocaleString("en-US", { month: style });
}

export function isoMonth(year: number, month?: number): string {
  return month ? `${year}-${String(month).padStart(2, "0")}` : `${year}`;
}

export function groupByYear<T>(
  items: T[],
  getYear: (item: T) => number,
): { years: number[]; byYear: Map<number, T[]> } {
  const byYear = new Map<number, T[]>();
  for (const item of items) {
    const year = getYear(item);
    const arr = byYear.get(year) ?? [];
    arr.push(item);
    byYear.set(year, arr);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  return { years, byYear };
}
