/** @jsxImportSource solid-js */
import { createMemo } from "solid-js";
import type { CellContext, ColumnDef, Row } from "@tanstack/solid-table";
import CompareMatrix, { type CompareColumn, type FilterDef } from "./CompareMatrix";

export type TechRow = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  abbreviation: string;
  href: string;
  year: number;
  month: number | null;
  yearLabel: string;
  status: string;
  adopters: number;
  summary: string;
};

export interface TechniqueMatrixProps {
  rows: TechRow[];
  categories: { key: string; label: string }[];
  statuses: { key: string; label: string }[];
  yearBounds: { min: number; max: number };
}

function yearDef(): ColumnDef<TechRow> {
  return {
    accessorKey: "year",
    cell: (info: CellContext<TechRow, unknown>) => (
      <span class="cmp-mono">{info.row.original.yearLabel}</span>
    ),
    sortingFn: (a: Row<TechRow>, b: Row<TechRow>) => {
      if (a.original.year !== b.original.year) return a.original.year - b.original.year;
      return (a.original.month ?? 0) - (b.original.month ?? 0);
    },
  };
}

function categoryDef(): ColumnDef<TechRow> {
  return {
    accessorKey: "categoryLabel",
    cell: (info: CellContext<TechRow, unknown>) => (
      <span class="cmp-cat">{info.row.original.categoryLabel}</span>
    ),
    sortingFn: (a: Row<TechRow>, b: Row<TechRow>) =>
      a.original.categoryLabel.localeCompare(b.original.categoryLabel),
  };
}

function titleDef(): ColumnDef<TechRow> {
  return {
    accessorKey: "title",
    cell: (info: CellContext<TechRow, unknown>) => {
      const r = info.row.original;
      return (
        <span>
          <a href={r.href}>{r.title}</a>
          <span class="cmp-abbr">{r.abbreviation}</span>
        </span>
      );
    },
    sortingFn: (a: Row<TechRow>, b: Row<TechRow>) =>
      a.original.title.localeCompare(b.original.title),
  };
}

function statusDef(): ColumnDef<TechRow> {
  return {
    accessorKey: "status",
    cell: (info: CellContext<TechRow, unknown>) => (
      <span class="cmp-mono">{info.row.original.status}</span>
    ),
    sortingFn: (a: Row<TechRow>, b: Row<TechRow>) =>
      a.original.status.localeCompare(b.original.status),
  };
}

function adoptersDef(): ColumnDef<TechRow> {
  return {
    accessorKey: "adopters",
    cell: (info: CellContext<TechRow, unknown>) => (
      <span class="cmp-adopters">{info.row.original.adopters}</span>
    ),
    sortingFn: (a: Row<TechRow>, b: Row<TechRow>) =>
      a.original.adopters - b.original.adopters,
  };
}

function summaryDef(): ColumnDef<TechRow> {
  return {
    accessorKey: "summary",
    enableSorting: false,
    cell: (info: CellContext<TechRow, unknown>) => (
      <span class="cmp-summary">{info.row.original.summary}</span>
    ),
  };
}

export default function TechniqueMatrix(props: TechniqueMatrixProps) {
  const columns = createMemo<CompareColumn<TechRow>[]>(() => [
    {
      id: "year",
      header: "Year",
      exportHeader: "Year",
      exportAccessor: (r) => r.yearLabel,
      def: yearDef(),
    },
    {
      id: "categoryLabel",
      header: "Category",
      exportHeader: "Category",
      exportAccessor: (r) => r.categoryLabel,
      def: categoryDef(),
    },
    {
      id: "title",
      header: "Technique",
      exportHeader: "Technique",
      exportAccessor: (r) => `${r.title} (${r.abbreviation})`,
      def: titleDef(),
    },
    {
      id: "status",
      header: "Status",
      exportHeader: "Status",
      exportAccessor: (r) => r.status,
      def: statusDef(),
    },
    {
      id: "adopters",
      header: "Adopters",
      exportHeader: "Adopters",
      exportAccessor: (r) => r.adopters,
      def: adoptersDef(),
    },
    {
      id: "summary",
      header: "Summary",
      exportHeader: "Summary",
      exportAccessor: (r) => r.summary,
      def: summaryDef(),
    },
  ]);

  const filters: FilterDef[] = [
    {
      key: "category",
      legend: "Category",
      accessor: (r) => (r as TechRow).category,
      options: props.categories,
    },
    {
      key: "status",
      legend: "Status",
      accessor: (r) => (r as TechRow).status,
      options: props.statuses,
    },
    {
      key: "year",
      legend: "Year",
      accessor: (r) => (r as TechRow).year,
      options: [],
      mode: "year-range",
      bounds: props.yearBounds,
    },
  ];

  return (
    <CompareMatrix
      ns="tech"
      data={props.rows}
      columns={columns()}
      filters={filters}
      searchable={true}
      searchAccessor={(r) => `${r.title} ${r.abbreviation} ${r.categoryLabel}`}
      exportFilename="technique-matrix"
      caption="Technique matrix"
      initialSort={[{ id: "year", desc: false }]}
    />
  );
}
