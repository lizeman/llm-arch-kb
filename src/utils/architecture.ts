export type ArchKey =
  | "positional"
  | "normalization_placement"
  | "normalization_type"
  | "qk_norm"
  | "activation"
  | "attention"
  | "moe";

export const ARCH_SLOTS: readonly { key: ArchKey; label: string; shortLabel: string }[] = [
  { key: "positional", label: "Positional encoding", shortLabel: "Positional" },
  { key: "normalization_placement", label: "Norm placement", shortLabel: "Norm placement" },
  { key: "normalization_type", label: "Norm type", shortLabel: "Norm type" },
  { key: "qk_norm", label: "QK-Norm", shortLabel: "QK-Norm" },
  { key: "activation", label: "Activation", shortLabel: "Activation" },
  { key: "attention", label: "Attention", shortLabel: "Attention" },
  { key: "moe", label: "MoE", shortLabel: "MoE" },
];

export function displayArch(value: string | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "" || value === "null") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return value;
}
