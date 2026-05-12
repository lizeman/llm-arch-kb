/** @jsxImportSource solid-js */
import { createMemo } from "solid-js";
import type { CellContext, ColumnDef, Row } from "@tanstack/solid-table";
import CompareMatrix, { type CompareColumn, type FilterDef } from "./CompareMatrix";

type ArchKeyish =
  | "positional"
  | "normalization_placement"
  | "normalization_type"
  | "qk_norm"
  | "activation"
  | "attention"
  | "moe";

export interface ArchSlotInfo {
  key: ArchKeyish;
  label: string;
  shortLabel: string;
}

export type ArchRow = {
  slug: string;
  name: string;
  organization: string;
  release_date: string;
  year: number;
  disclosure: string;
  href: string;
} & Partial<Record<ArchKeyish, string>>;

export interface ArchMatrixProps {
  rows: ArchRow[];
  slots: ArchSlotInfo[];
  organizations: string[];
  disclosures: string[];
  yearBounds: { min: number; max: number };
}

function nameDef(): ColumnDef<ArchRow> {
  return {
    accessorKey: "name",
    cell: (info: CellContext<ArchRow, unknown>) => {
      const r = info.row.original;
      return (
        <span>
          <a href={r.href}>{r.name}</a>
          <span class="cmp-row-org">{r.organization}</span>
        </span>
      );
    },
    sortingFn: (a: Row<ArchRow>, b: Row<ArchRow>) =>
      a.original.name.localeCompare(b.original.name),
  };
}

function releaseDef(): ColumnDef<ArchRow> {
  return {
    accessorKey: "release_date",
    cell: (info: CellContext<ArchRow, unknown>) => (
      <span class="cmp-mono">{info.row.original.release_date}</span>
    ),
    sortingFn: (a: Row<ArchRow>, b: Row<ArchRow>) =>
      a.original.release_date.localeCompare(b.original.release_date),
  };
}

function slotDef(key: ArchKeyish): ColumnDef<ArchRow> {
  return {
    id: key,
    accessorFn: (r) => r[key] ?? "—",
    cell: (info: CellContext<ArchRow, unknown>) => <>{info.row.original[key] ?? "—"}</>,
    sortingFn: (a: Row<ArchRow>, b: Row<ArchRow>) =>
      String(a.original[key] ?? "").localeCompare(String(b.original[key] ?? "")),
  };
}

export default function ArchMatrix(props: ArchMatrixProps) {
  const columns = createMemo<CompareColumn<ArchRow>[]>(() => [
    {
      id: "name",
      header: "Model",
      exportHeader: "Model",
      exportAccessor: (r) => r.name,
      def: nameDef(),
    },
    {
      id: "release_date",
      header: "Released",
      exportHeader: "Released",
      exportAccessor: (r) => r.release_date,
      def: releaseDef(),
    },
    ...props.slots.map((s) => ({
      id: s.key,
      header: s.shortLabel,
      exportHeader: s.label,
      exportAccessor: (r: ArchRow) => r[s.key] ?? "—",
      def: slotDef(s.key),
    })),
  ]);

  const filters: FilterDef[] = [
    {
      key: "organization",
      legend: "Organization",
      accessor: (r) => (r as ArchRow).organization,
      options: props.organizations.map((o) => ({ key: o, label: o })),
    },
    {
      key: "disclosure",
      legend: "Disclosure",
      accessor: (r) => (r as ArchRow).disclosure,
      options: props.disclosures.map((d) => ({ key: d, label: d })),
    },
    {
      key: "year",
      legend: "Year",
      accessor: (r) => (r as ArchRow).year,
      options: [],
      mode: "year-range",
      bounds: props.yearBounds,
    },
  ];

  return (
    <CompareMatrix
      ns="arch"
      data={props.rows}
      columns={columns()}
      filters={filters}
      searchable={true}
      searchAccessor={(r) => `${r.name} ${r.organization}`}
      exportFilename="model-arch-matrix"
      caption="Model architecture matrix"
      initialSort={[{ id: "release_date", desc: false }]}
    />
  );
}
