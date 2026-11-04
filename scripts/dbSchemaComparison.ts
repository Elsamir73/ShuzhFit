export type ColumnMap = Readonly<Record<string, readonly string[]>>;

export function findMissingColumns(expected: ColumnMap, actual: ColumnMap): string[] {
  const missing: string[] = [];

  for (const tableName of Object.keys(expected).sort()) {
    const expectedColumns = expected[tableName] ?? [];
    const actualColumns = actual[tableName];
    if (!actualColumns) {
      missing.push(`${tableName} (table)`);
    }

    const actualColumnSet = new Set(actualColumns ?? []);
    for (const columnName of expectedColumns) {
      if (!actualColumnSet.has(columnName)) {
        missing.push(`${tableName}.${columnName}`);
      }
    }
  }

  return missing;
}
