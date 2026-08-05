export type CsvRow = Record<string, string>;

function detectDelimiter(header: string): string {
  const candidates = [",", ";", "\t"];
  return candidates.reduce((best, candidate) =>
    header.split(candidate).length > header.split(best).length ? candidate : best
  );
}

export function parseCsv(content: string): CsvRow[] {
  const normalized = content.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(normalized.split(/\r?\n/, 1)[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

export function createCsv(rows: Array<Record<string, string>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((values) => values.map(escape).join(","))
    .join("\r\n");
}