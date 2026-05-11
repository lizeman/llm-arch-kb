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
