/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType("atlas_kind", [
    "geography",
    "social",
    "history",
    "belief",
    "object",
    "event",
    "other"
  ]);

  pgm.createType("entity_type", [
    "episode",
    "character",
    "atlas_entry",
    "episode_series",
    "country",
    "location"
  ]);

  pgm.createTable("episode_series", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    title_ru: { type: "text", notNull: true },
    brand_color: { type: "text" },
    summary: { type: "text" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("countries", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    title_ru: { type: "text", notNull: true },
    flag_emoji: { type: "text" },
    flag_asset_path: { type: "text" },
    flag_colors: { type: "jsonb" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("locations", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    title_ru: { type: "text", notNull: true },
    country_id: { type: "uuid", references: "countries", onDelete: "set null" },
    summary: { type: "text" },
    description_markdown: { type: "text" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("episodes", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    series_id: { type: "uuid", notNull: true, references: "episode_series", onDelete: "restrict" },
    country_id: { type: "uuid", notNull: true, references: "countries", onDelete: "restrict" },
    episode_number: { type: "integer", notNull: true },
    global_order: { type: "integer", notNull: true, unique: true },
    title_native: { type: "text" },
    title_ru: { type: "text", notNull: true },
    summary: { type: "text" },
    content_markdown: { type: "text" },
    reading_minutes: { type: "integer" },
    published_at: { type: "timestamptz" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.addConstraint("episodes", "episodes_series_episode_number_unique", {
    unique: ["series_id", "episode_number"]
  });

  pgm.createTable("atlas_entries", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    kind: { type: "atlas_kind", notNull: true },
    title_ru: { type: "text", notNull: true },
    summary: { type: "text" },
    content_markdown: { type: "text" },
    country_id: { type: "uuid", references: "countries", onDelete: "set null" },
    location_id: { type: "uuid", references: "locations", onDelete: "set null" },
    published_at: { type: "timestamptz" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("characters", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    name_ru: { type: "text", notNull: true },
    name_native: { type: "text" },
    affiliation_id: { type: "uuid", references: "atlas_entries", onDelete: "set null", deferrable: "initially deferred" },
    gender: { type: "text" },
    race: { type: "text" },
    height_cm: { type: "integer" },
    age: { type: "integer" },
    birth_country_id: { type: "uuid", references: "countries", onDelete: "set null" },
    favorite_food: { type: "text" },
    orientation: { type: "text" },
    description: { type: "text" },
    quote: { type: "text" },
    bio_markdown: { type: "text" },
    stats: { type: "jsonb" },
    published_at: { type: "timestamptz" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("character_traits", {
    id: { type: "bigserial", primaryKey: true },
    character_id: { type: "uuid", notNull: true, references: "characters", onDelete: "cascade" },
    text: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 }
  });

  pgm.createTable("character_rumors", {
    id: { type: "bigserial", primaryKey: true },
    character_id: { type: "uuid", notNull: true, references: "characters", onDelete: "cascade" },
    text: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 }
  });

  pgm.createTable("episode_characters", {
    episode_id: { type: "uuid", notNull: true, references: "episodes", onDelete: "cascade" },
    character_id: { type: "uuid", notNull: true, references: "characters", onDelete: "cascade" }
  });
  pgm.addConstraint("episode_characters", "episode_characters_unique", {
    unique: ["episode_id", "character_id"]
  });

  pgm.createTable("episode_locations", {
    episode_id: { type: "uuid", notNull: true, references: "episodes", onDelete: "cascade" },
    location_id: { type: "uuid", notNull: true, references: "locations", onDelete: "cascade" }
  });
  pgm.addConstraint("episode_locations", "episode_locations_unique", {
    unique: ["episode_id", "location_id"]
  });

  pgm.createTable("atlas_links", {
    id: { type: "bigserial", primaryKey: true },
    from_type: { type: "entity_type", notNull: true },
    from_id: { type: "uuid", notNull: true },
    to_type: { type: "entity_type", notNull: true },
    to_id: { type: "uuid", notNull: true },
    label: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("atlas_links", "atlas_links_unique", {
    unique: ["from_type", "from_id", "to_type", "to_id", "label"]
  });

  pgm.createTable("import_runs", {
    id: { type: "bigserial", primaryKey: true },
    started_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    ended_at: { type: "timestamptz" },
    status: { type: "text", notNull: true },
    schema_version: { type: "integer", notNull: true },
    summary: { type: "jsonb" }
  });

  pgm.createTable("import_errors", {
    id: { type: "bigserial", primaryKey: true },
    run_id: { type: "bigint", notNull: true, references: "import_runs", onDelete: "cascade" },
    entity_type: { type: "entity_type" },
    source_path: { type: "text" },
    message: { type: "text", notNull: true },
    details: { type: "jsonb" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("search_queue", {
    id: { type: "bigserial", primaryKey: true },
    entity_type: { type: "entity_type", notNull: true },
    entity_id: { type: "uuid", notNull: true },
    action: { type: "text", notNull: true },
    payload: { type: "jsonb" },
    status: { type: "text", notNull: true, default: "pending" },
    attempts: { type: "integer", notNull: true, default: 0 },
    next_run_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    last_error: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createIndex("search_queue", ["status", "next_run_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("search_queue");
  pgm.dropTable("import_errors");
  pgm.dropTable("import_runs");
  pgm.dropTable("atlas_links");
  pgm.dropTable("episode_locations");
  pgm.dropTable("episode_characters");
  pgm.dropTable("character_rumors");
  pgm.dropTable("character_traits");
  pgm.dropTable("characters");
  pgm.dropTable("atlas_entries");
  pgm.dropTable("episodes");
  pgm.dropTable("locations");
  pgm.dropTable("countries");
  pgm.dropTable("episode_series");
  pgm.dropType("entity_type");
  pgm.dropType("atlas_kind");
};
