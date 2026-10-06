export function toCsv(rows: ReadonlyArray<Readonly<Record<string, string | number | null>>>, columns: readonly string[]): string {
  const quote = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [columns.map(quote).join(","), ...rows.map((row) => columns.map((column) => quote(row[column] ?? "")).join(","))].join("\r\n");
}
