/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("atlas_facts", {
    node_type: { type: "text", notNull: true },
    node_id: { type: "uuid", notNull: true },
    title: { type: "text", notNull: true },
    text: { type: "text", notNull: true },
    meta: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.addConstraint("atlas_facts", "atlas_facts_node_type_check", {
    check: "node_type IN ('country', 'location', 'atlas_entry')"
  });

  pgm.createIndex("atlas_facts", ["node_type", "node_id"], {
    name: "atlas_facts_node_unique_idx",
    unique: true
  });

  pgm.createTable("atlas_quotes", {
    id: { type: "bigserial", primaryKey: true },
    node_type: { type: "text", notNull: true },
    node_id: { type: "uuid", notNull: true },
    speaker_type: { type: "text", notNull: true },
    character_id: { type: "uuid", references: "characters", onDelete: "cascade" },
    speaker_name: { type: "text" },
    speaker_meta: { type: "text" },
    text: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.addConstraint("atlas_quotes", "atlas_quotes_node_type_check", {
    check: "node_type IN ('country', 'location', 'atlas_entry')"
  });

  pgm.addConstraint("atlas_quotes", "atlas_quotes_speaker_type_check", {
    check: "speaker_type IN ('character', 'world')"
  });

  pgm.addConstraint("atlas_quotes", "atlas_quotes_source_shape_check", {
    check:
      "(speaker_type = 'character' AND character_id IS NOT NULL AND speaker_name IS NULL) OR (speaker_type = 'world' AND character_id IS NULL AND speaker_name IS NOT NULL)"
  });

  pgm.createIndex("atlas_quotes", ["node_type", "node_id", "sort_order", "id"], {
    name: "atlas_quotes_node_order_idx"
  });

  pgm.dropTable("atlas_fragments", { ifExists: true });
  pgm.dropTable("atlas_viewpoints", { ifExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable("atlas_quotes", { ifExists: true });
  pgm.dropTable("atlas_facts", { ifExists: true });

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
