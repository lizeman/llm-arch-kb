/**
 * Citation export helpers.
 *
 * Three export formats:
 *   - BibTeX  (LaTeX)
 *   - CSL JSON  (Zotero, Pandoc, etc.)
 *   - RIS  (EndNote, Mendeley, etc.)
 *
 * All three accept the same shape so a single helper can map any
 * technique/model frontmatter to a citation record once and emit
 * multiple formats.
 */

export interface CitationFields {
  /** Paper title or knowledge-base entry title. */
  title: string;
  /** Author / group string as it appears on the entry ("Su, Lu, Pan, Wen, Liu" or "Llama Team"). */
  authors: string;
  /** Four-digit year. */
  year: number;
  /** arXiv ID (e.g. "2104.09864") if available — used as the canonical identifier. */
  arxivId?: string;
  /** Canonical URL (paper_url, model paper_url, or KB entry permalink). */
  url: string;
}

/**
 * Build a BibTeX key. Prefer the arXiv id (with dots replaced) since it is
 * stable and globally unique; otherwise derive from author + year.
 */
function bibKey(fields: CitationFields): string {
  if (fields.arxivId) return `arxiv_${fields.arxivId.replace(/\./g, "_")}`;
  const authorTag = fields.authors
    .split(/[\s,]+/)[0]!
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `${authorTag || "anon"}${fields.year}`;
}

/**
 * Convert a comma-separated author string into BibTeX "A and B and C" form.
 * Trailing "et al." becomes "and others" which BibTeX understands.
 */
function bibAuthors(authors: string): string {
  const trimmed = authors.replace(/\s+et al\.?\s*$/i, ", and others");
  return trimmed
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .join(" and ");
}

export function toBibTeX(fields: CitationFields): string {
  const key = bibKey(fields);
  const lines: string[] = [];
  lines.push(`@article{${key},`);
  lines.push(`  title         = {${fields.title}},`);
  lines.push(`  author        = {${bibAuthors(fields.authors)}},`);
  lines.push(`  year          = {${fields.year}},`);
  if (fields.arxivId) {
    lines.push(`  eprint        = {${fields.arxivId}},`);
    lines.push(`  archivePrefix = {arXiv},`);
  }
  lines.push(`  url           = {${fields.url}}`);
  lines.push(`}`);
  return lines.join("\n");
}

/**
 * Split an author string into CSL JSON `{family, given}` objects.
 * The KB doesn't reliably distinguish family vs given for non-Western
 * names, so we emit a single `literal` field when ambiguous and the
 * full string for "et al."-suffixed lists.
 */
function cslAuthors(authors: string): Array<{ literal: string }> {
  const cleaned = authors.replace(/\s+et al\.?\s*$/i, ", et al.");
  return cleaned
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => ({ literal: a }));
}

export interface CslJsonRecord {
  id: string;
  type: "article-journal";
  title: string;
  author: Array<{ literal: string }>;
  issued: { "date-parts": number[][] };
  URL: string;
  number?: string;
  source?: string;
}

export function toCslJson(fields: CitationFields): CslJsonRecord {
  const record: CslJsonRecord = {
    id: bibKey(fields),
    type: "article-journal",
    title: fields.title,
    author: cslAuthors(fields.authors),
    issued: { "date-parts": [[fields.year]] },
    URL: fields.url,
  };
  if (fields.arxivId) {
    record.number = fields.arxivId;
    record.source = "arXiv";
  }
  return record;
}

/** RIS field tags: TY = type, TI = title, AU = author (repeatable), PY = pub year, UR = url, ER = end record. */
export function toRis(fields: CitationFields): string {
  const lines: string[] = [];
  // JOUR is a reasonable generic choice for arXiv preprints.
  lines.push(`TY  - JOUR`);
  lines.push(`TI  - ${fields.title}`);
  const cleaned = fields.authors.replace(/\s+et al\.?\s*$/i, "");
  for (const a of cleaned.split(",").map((s) => s.trim()).filter(Boolean)) {
    lines.push(`AU  - ${a}`);
  }
  if (/\bet al\.?\s*$/i.test(fields.authors)) lines.push(`AU  - et al.`);
  lines.push(`PY  - ${fields.year}`);
  if (fields.arxivId) {
    lines.push(`JO  - arXiv`);
    lines.push(`AN  - arXiv:${fields.arxivId}`);
  }
  lines.push(`UR  - ${fields.url}`);
  lines.push(`ER  - `);
  return lines.join("\n");
}

/**
 * Map technique frontmatter to citation fields.
 * Works for any object with the technique-shape keys; we keep it
 * structurally typed so it can be called from both Astro components
 * and the JSON API endpoints.
 */
export interface TechniqueLikeFrontmatter {
  paper_title: string;
  introduced_by: string;
  year: number;
  arxiv_id?: string;
  paper_url: string;
}

export function entryToCitationFields(fm: TechniqueLikeFrontmatter): CitationFields {
  return {
    title: fm.paper_title,
    authors: fm.introduced_by,
    year: fm.year,
    arxivId: fm.arxiv_id,
    url: fm.paper_url,
  };
}
