import test from "node:test";
import assert from "node:assert/strict";
import {
  applyHashDiff,
  computeArchivedSourcePaths,
  emptySummary
} from "../src/import-summary.js";

test("applyHashDiff counts created, updated and unchanged records", () => {
  const summary = emptySummary();
  const records = [
    { slug: "new-country", contentHash: "hash-1" },
    { slug: "same-country", contentHash: "hash-2" },
    { slug: "changed-country", contentHash: "hash-3" }
  ];
  const existing = new Map([
    ["same-country", { content_hash: "hash-2" }],
    ["changed-country", { content_hash: "old-hash" }]
  ]);

  applyHashDiff(summary, records, existing);

  assert.equal(summary.created, 1);
  assert.equal(summary.updated, 1);
  assert.equal(summary.unchanged, 1);
  assert.equal(summary.archived, 0);
});

test("computeArchivedSourcePaths returns only missing sources", () => {
  const existingSources = ["content/countries/a.md", "content/countries/b.md"];
  const importedSources = new Set(["content/countries/b.md", "content/countries/c.md"]);

  const archived = computeArchivedSourcePaths(existingSources, importedSources);

  assert.deepEqual(archived, ["content/countries/a.md"]);
});
