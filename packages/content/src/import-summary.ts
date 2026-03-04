export type ImportSummary = {
  created: number;
  updated: number;
  unchanged: number;
  archived: number;
};

export type HashTrackedRecord = {
  slug: string;
  contentHash: string;
};

export type ExistingHashRow = {
  content_hash: string;
};

export function emptySummary(): ImportSummary {
  return {
    created: 0,
    updated: 0,
    unchanged: 0,
    archived: 0
  };
}

export function applyHashDiff(
  summary: ImportSummary,
  records: HashTrackedRecord[],
  existingBySlug: Map<string, ExistingHashRow>
): void {
  for (const record of records) {
    const existingRow = existingBySlug.get(record.slug);
    if (!existingRow) {
      summary.created += 1;
      continue;
    }

    if (existingRow.content_hash === record.contentHash) {
      summary.unchanged += 1;
      continue;
    }

    summary.updated += 1;
  }
}

export function computeArchivedSourcePaths(
  existingSources: Iterable<string>,
  importedSources: Set<string>
): string[] {
  const archived: string[] = [];

  for (const source of existingSources) {
    if (!importedSources.has(source)) {
      archived.push(source);
    }
  }

  return archived;
}
