/** @jsxImportSource solid-js */
import { createSignal } from "solid-js";

export type Cell = string | number | boolean | null | undefined;

export interface ExportButtonsProps {
  /** Logical filename stem (e.g. "model-arch-matrix"). */
  filename: string;
  /** Row-oriented payload — header row first, data rows after. */
  rows: () => Cell[][];
  /** Optional accessible label suffix. */
  label?: string;
}

function escapeCsvCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeMdCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  // Pipes break Markdown tables; escape; collapse newlines to spaces.
  return String(v).replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(escapeCsvCell).join(",")).join("\n");
}

function toMarkdown(rows: Cell[][]): string {
  if (rows.length === 0) return "";
  const [header, ...rest] = rows;
  const widths = header.map(() => 0);
  const headerLine = `| ${header.map(escapeMdCell).join(" | ")} |`;
  const sep = `| ${widths.map(() => "---").join(" | ")} |`;
  const body = rest.map((r) => `| ${r.map(escapeMdCell).join(" | ")} |`);
  return [headerLine, sep, ...body].join("\n");
}

function downloadBlob(content: string, mime: string, name: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the click frame so Firefox / Safari don't race.
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export default function ExportButtons(props: ExportButtonsProps) {
  const [copyMsg, setCopyMsg] = createSignal<string | null>(null);

  const doCsv = () => {
    const csv = toCsv(props.rows());
    downloadBlob(csv, "text/csv;charset=utf-8", `${props.filename}.csv`);
  };

  const doMarkdown = async () => {
    const md = toMarkdown(props.rows());
    const ok = await copyToClipboard(md);
    setCopyMsg(ok ? "copied" : "copy failed");
    setTimeout(() => setCopyMsg(null), 1600);
  };

  return (
    <div class="cmp-export" role="group" aria-label={`Export ${props.label ?? "table"}`}>
      <button type="button" class="cmp-export-btn" onClick={doCsv}>
        Download CSV
      </button>
      <button type="button" class="cmp-export-btn" onClick={doMarkdown}>
        Copy Markdown
      </button>
      <span class="cmp-export-msg" aria-live="polite">
        {copyMsg() ?? ""}
      </span>
    </div>
  );
}
