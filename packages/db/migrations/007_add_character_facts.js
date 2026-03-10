/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("character_facts", {
    id: { type: "bigserial", primaryKey: true },
    subject_character_id: { type: "uuid", notNull: true, references: "characters", onDelete: "restrict" },
    fact_text: { type: "text", notNull: true },
    comment_text: { type: "text", notNull: true },
    comment_author_character_id: { type: "uuid", references: "characters", onDelete: "set null" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createIndex("character_facts", ["archived_at", "sort_order", "id"], {
    name: "character_facts_visible_order_idx"
  });
};

exports.down = (pgm) => {
  pgm.dropTable("character_facts");
};

