/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("atlas_viewpoints", {
    id: { type: "bigserial", primaryKey: true },
    atlas_entry_id: { type: "uuid", notNull: true, references: "atlas_entries", onDelete: "cascade" },
    speaker_name: { type: "text", notNull: true },
    speaker_meta: { type: "text" },
    text: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createIndex("atlas_viewpoints", ["atlas_entry_id", "archived_at", "sort_order", "id"], {
    name: "atlas_viewpoints_visible_order_idx"
  });

  pgm.createTable("atlas_fragments", {
    id: { type: "bigserial", primaryKey: true },
    atlas_entry_id: { type: "uuid", notNull: true, references: "atlas_entries", onDelete: "cascade" },
    kind: { type: "text", notNull: true, default: "detail" },
    title: { type: "text", notNull: true },
    text: { type: "text", notNull: true },
    meta: { type: "text" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.addConstraint("atlas_fragments", "atlas_fragments_kind_check", {
    check: "kind IN ('detail', 'quote', 'ritual', 'object', 'saying', 'memory')"
  });

  pgm.createIndex("atlas_fragments", ["atlas_entry_id", "archived_at", "sort_order", "id"], {
    name: "atlas_fragments_visible_order_idx"
  });
};

exports.down = (pgm) => {
  pgm.dropTable("atlas_fragments");
  pgm.dropTable("atlas_viewpoints");
};
