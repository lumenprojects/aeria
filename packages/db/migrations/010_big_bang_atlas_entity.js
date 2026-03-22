/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  pgm.createType("atlas_entity_type", [
    "country",
    "location",
    "organization",
    "object",
    "event",
    "belief",
    "concept",
    "other"
  ]);

  pgm.createType("atlas_section", [
    "geography",
    "social",
    "history",
    "belief",
    "object",
    "event",
    "other"
  ]);

  pgm.createType("entity_type_v2", [
    "episode",
    "character",
    "atlas_entity",
    "episode_series"
  ]);

  pgm.createTable("atlas_entities", {
    id: { type: "uuid", primaryKey: true },
    slug: { type: "text", notNull: true, unique: true },
    type: { type: "atlas_entity_type", notNull: true },
    title_ru: { type: "text", notNull: true },
    summary: { type: "text" },
    overview_markdown: { type: "text" },
    avatar_asset_path: { type: "text" },
    flag_colors: { type: "jsonb" },
    country_entity_id: { type: "uuid" },
    location_entity_id: { type: "uuid" },
    published_at: { type: "timestamptz" },
    source_path: { type: "text", notNull: true, unique: true },
    content_hash: { type: "text", notNull: true },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("atlas_entity_sections", {
    id: { type: "bigserial", primaryKey: true },
    atlas_entity_id: { type: "uuid", notNull: true, references: "atlas_entities", onDelete: "cascade" },
    section: { type: "atlas_section", notNull: true },
    title_ru: { type: "text", notNull: true },
    summary: { type: "text" },
    body_markdown: { type: "text" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("atlas_entity_sections", "atlas_entity_sections_unique", {
    unique: ["atlas_entity_id", "section"]
  });

  pgm.createTable("atlas_entity_facts", {
    atlas_entity_id: { type: "uuid", notNull: true, references: "atlas_entities", onDelete: "cascade" },
    section: { type: "atlas_section", notNull: true },
    title: { type: "text", notNull: true },
    text: { type: "text", notNull: true },
    meta: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("atlas_entity_facts", "atlas_entity_facts_unique", {
    unique: ["atlas_entity_id", "section"]
  });

  pgm.createTable("atlas_entity_quotes", {
    id: { type: "bigserial", primaryKey: true },
    atlas_entity_id: { type: "uuid", notNull: true, references: "atlas_entities", onDelete: "cascade" },
    section: { type: "atlas_section", notNull: true },
    speaker_type: { type: "text", notNull: true },
    character_id: { type: "uuid", references: "characters", onDelete: "cascade" },
    speaker_name: { type: "text" },
    speaker_meta: { type: "text" },
    text: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("atlas_entity_quotes", "atlas_entity_quotes_speaker_type_check", {
    check: "speaker_type IN ('character', 'world')"
  });
  pgm.addConstraint("atlas_entity_quotes", "atlas_entity_quotes_source_shape_check", {
    check:
      "(speaker_type = 'character' AND character_id IS NOT NULL AND speaker_name IS NULL) OR (speaker_type = 'world' AND character_id IS NULL AND speaker_name IS NOT NULL)"
  });
  pgm.createIndex("atlas_entity_quotes", ["atlas_entity_id", "section", "sort_order", "id"], {
    name: "atlas_entity_quotes_order_idx"
  });

  pgm.createTable("atlas_entity_links", {
    id: { type: "bigserial", primaryKey: true },
    from_atlas_entity_id: { type: "uuid", notNull: true, references: "atlas_entities", onDelete: "cascade" },
    to_type: { type: "entity_type_v2", notNull: true },
    to_id: { type: "uuid", notNull: true },
    label: { type: "text" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("atlas_entity_links", "atlas_entity_links_unique", {
    unique: ["from_atlas_entity_id", "to_type", "to_id", "label"]
  });

  pgm.createTable("episode_atlas_entities", {
    episode_id: { type: "uuid", notNull: true, references: "episodes", onDelete: "cascade" },
    atlas_entity_id: { type: "uuid", notNull: true, references: "atlas_entities", onDelete: "cascade" },
    sort_order: { type: "integer", notNull: true, default: 0 }
  });
  pgm.addConstraint("episode_atlas_entities", "episode_atlas_entities_unique", {
    unique: ["episode_id", "atlas_entity_id"]
  });

  pgm.addColumns("characters", {
    affiliation_entity_id: { type: "uuid" },
    country_entity_id: { type: "uuid" }
  });

  pgm.addColumns("episodes", {
    country_entity_id: { type: "uuid" }
  });

  pgm.sql(`
    CREATE TEMP TABLE atlas_entity_seed AS
    WITH country_rows AS (
      SELECT
        c.id AS country_id,
        c.slug,
        c.title_ru AS country_title_ru,
        c.flag_colors,
        c.source_path AS country_source_path,
        c.content_hash AS country_content_hash
      FROM countries c
      WHERE c.archived_at IS NULL
    ),
    location_rows AS (
      SELECT
        l.id AS location_id,
        l.slug,
        l.title_ru AS location_title_ru,
        l.summary AS location_summary,
        l.description_markdown,
        l.avatar_asset_path AS location_avatar_asset_path,
        lc.slug AS location_country_slug,
        l.source_path AS location_source_path,
        l.content_hash AS location_content_hash
      FROM locations l
      LEFT JOIN countries lc
        ON lc.id = l.country_id
       AND lc.archived_at IS NULL
      WHERE l.archived_at IS NULL
    ),
    atlas_rows AS (
      SELECT
        a.id AS atlas_id,
        a.slug,
        a.kind AS atlas_kind,
        a.title_ru AS atlas_title_ru,
        a.summary AS atlas_summary,
        a.content_markdown AS atlas_content_markdown,
        a.avatar_asset_path AS atlas_avatar_asset_path,
        ac.slug AS atlas_country_slug,
        al.slug AS atlas_location_slug,
        a.published_at,
        a.source_path AS atlas_source_path,
        a.content_hash AS atlas_content_hash
      FROM atlas_entries a
      LEFT JOIN countries ac
        ON ac.id = a.country_id
       AND ac.archived_at IS NULL
      LEFT JOIN locations al
        ON al.id = a.location_id
       AND al.archived_at IS NULL
      WHERE a.archived_at IS NULL
    ),
    slugs AS (
      SELECT slug FROM country_rows
      UNION
      SELECT slug FROM location_rows
      UNION
      SELECT slug FROM atlas_rows
    )
    SELECT
      s.slug,
      uuid_generate_v5(uuid_generate_v5(uuid_ns_url(), 'aeria'), 'atlas_entity:' || s.slug) AS atlas_entity_id,
      CASE
        WHEN c.country_id IS NOT NULL THEN 'country'::atlas_entity_type
        WHEN l.location_id IS NOT NULL THEN 'location'::atlas_entity_type
        WHEN s.slug IN ('abbaye-des-hautes-roches', 'domaine-des-immortelles') THEN 'location'::atlas_entity_type
        WHEN a.atlas_kind = 'geography' THEN 'location'::atlas_entity_type
        WHEN a.atlas_kind = 'social' THEN 'organization'::atlas_entity_type
        WHEN a.atlas_kind = 'object' THEN 'object'::atlas_entity_type
        WHEN a.atlas_kind = 'event' THEN 'event'::atlas_entity_type
        WHEN a.atlas_kind = 'belief' THEN 'belief'::atlas_entity_type
        WHEN a.atlas_kind = 'history' THEN 'concept'::atlas_entity_type
        ELSE 'other'::atlas_entity_type
      END AS type,
      COALESCE(a.atlas_title_ru, l.location_title_ru, c.country_title_ru) AS title_ru,
      COALESCE(NULLIF(a.atlas_summary, ''), NULLIF(l.location_summary, ''), NULL) AS summary,
      CASE
        WHEN a.atlas_id IS NOT NULL THEN a.atlas_content_markdown
        WHEN l.location_id IS NOT NULL THEN l.description_markdown
        ELSE NULL
      END AS overview_markdown,
      COALESCE(a.atlas_avatar_asset_path, l.location_avatar_asset_path) AS avatar_asset_path,
      CASE
        WHEN c.country_id IS NOT NULL THEN c.flag_colors
        ELSE NULL
      END AS flag_colors,
      COALESCE(a.atlas_country_slug, l.location_country_slug) AS country_slug,
      a.atlas_location_slug AS location_slug,
      a.published_at,
      COALESCE(a.atlas_source_path, l.location_source_path, c.country_source_path) AS source_path,
      COALESCE(a.atlas_content_hash, l.location_content_hash, c.country_content_hash) AS content_hash,
      a.atlas_kind,
      c.country_id,
      l.location_id,
      a.atlas_id
    FROM slugs s
    LEFT JOIN country_rows c ON c.slug = s.slug
    LEFT JOIN location_rows l ON l.slug = s.slug
    LEFT JOIN atlas_rows a ON a.slug = s.slug;

    INSERT INTO atlas_entities (
      id,
      slug,
      type,
      title_ru,
      summary,
      overview_markdown,
      avatar_asset_path,
      flag_colors,
      published_at,
      source_path,
      content_hash,
      archived_at,
      created_at,
      updated_at
    )
    SELECT
      atlas_entity_id,
      slug,
      type,
      title_ru,
      summary,
      overview_markdown,
      avatar_asset_path,
      flag_colors,
      published_at,
      source_path,
      content_hash,
      NULL,
      now(),
      now()
    FROM atlas_entity_seed;

    UPDATE atlas_entities ae
    SET
      country_entity_id = country_seed.atlas_entity_id,
      location_entity_id = location_seed.atlas_entity_id,
      updated_at = now()
    FROM atlas_entity_seed seed
    LEFT JOIN atlas_entity_seed country_seed
      ON country_seed.slug = seed.country_slug
     AND seed.country_slug IS NOT NULL
     AND seed.country_slug <> seed.slug
    LEFT JOIN atlas_entity_seed location_seed
      ON location_seed.slug = seed.location_slug
     AND seed.location_slug IS NOT NULL
     AND seed.location_slug <> seed.slug
    WHERE ae.id = seed.atlas_entity_id;

    INSERT INTO atlas_entity_sections (atlas_entity_id, section, title_ru, summary, body_markdown, sort_order)
    SELECT
      seed.atlas_entity_id,
      'geography'::atlas_section,
      'География',
      CASE
        WHEN seed.atlas_kind = 'geography' THEN seed.summary
        WHEN seed.type IN ('country', 'location') THEN seed.summary
        ELSE NULL
      END,
      NULL,
      0
    FROM atlas_entity_seed seed
    WHERE seed.type IN ('country', 'location') OR seed.atlas_kind = 'geography'
    ON CONFLICT (atlas_entity_id, section) DO NOTHING;

    INSERT INTO atlas_entity_sections (atlas_entity_id, section, title_ru, summary, body_markdown, sort_order)
    SELECT
      seed.atlas_entity_id,
      seed.atlas_kind::text::atlas_section,
      CASE seed.atlas_kind
        WHEN 'social' THEN 'Социальное'
        WHEN 'history' THEN 'История'
        WHEN 'belief' THEN 'Вера'
        WHEN 'object' THEN 'Объект'
        WHEN 'event' THEN 'Событие'
        WHEN 'other' THEN 'Другое'
        ELSE 'География'
      END,
      seed.summary,
      NULL,
      10
    FROM atlas_entity_seed seed
    WHERE seed.atlas_id IS NOT NULL
      AND seed.atlas_kind <> 'geography'
    ON CONFLICT (atlas_entity_id, section) DO NOTHING;

    INSERT INTO atlas_entity_facts (atlas_entity_id, section, title, text, meta, created_at, updated_at)
    SELECT
      seed.atlas_entity_id,
      seed.atlas_kind::text::atlas_section,
      fact.title,
      fact.text,
      fact.meta,
      now(),
      now()
    FROM atlas_facts fact
    JOIN atlas_entity_seed seed
      ON fact.node_type = 'atlas_entry'
     AND fact.node_id = seed.atlas_id
    ON CONFLICT (atlas_entity_id, section) DO NOTHING;

    INSERT INTO atlas_entity_facts (atlas_entity_id, section, title, text, meta, created_at, updated_at)
    SELECT
      seed.atlas_entity_id,
      'geography'::atlas_section,
      fact.title,
      fact.text,
      fact.meta,
      now(),
      now()
    FROM atlas_facts fact
    JOIN atlas_entity_seed seed
      ON fact.node_type = 'location'
     AND fact.node_id = seed.location_id
    ON CONFLICT (atlas_entity_id, section) DO NOTHING;

    INSERT INTO atlas_entity_facts (atlas_entity_id, section, title, text, meta, created_at, updated_at)
    SELECT
      seed.atlas_entity_id,
      'geography'::atlas_section,
      fact.title,
      fact.text,
      fact.meta,
      now(),
      now()
    FROM atlas_facts fact
    JOIN atlas_entity_seed seed
      ON fact.node_type = 'country'
     AND fact.node_id = seed.country_id
    ON CONFLICT (atlas_entity_id, section) DO NOTHING;

    INSERT INTO atlas_entity_quotes (
      atlas_entity_id,
      section,
      speaker_type,
      character_id,
      speaker_name,
      speaker_meta,
      text,
      sort_order,
      created_at,
      updated_at
    )
    SELECT
      seed.atlas_entity_id,
      seed.atlas_kind::text::atlas_section,
      quote.speaker_type,
      quote.character_id,
      quote.speaker_name,
      quote.speaker_meta,
      quote.text,
      quote.sort_order,
      now(),
      now()
    FROM atlas_quotes quote
    JOIN atlas_entity_seed seed
      ON quote.node_type = 'atlas_entry'
     AND quote.node_id = seed.atlas_id;

    INSERT INTO atlas_entity_quotes (
      atlas_entity_id,
      section,
      speaker_type,
      character_id,
      speaker_name,
      speaker_meta,
      text,
      sort_order,
      created_at,
      updated_at
    )
    SELECT
      seed.atlas_entity_id,
      'geography'::atlas_section,
      quote.speaker_type,
      quote.character_id,
      quote.speaker_name,
      quote.speaker_meta,
      quote.text,
      quote.sort_order + 100,
      now(),
      now()
    FROM atlas_quotes quote
    JOIN atlas_entity_seed seed
      ON quote.node_type = 'location'
     AND quote.node_id = seed.location_id;

    INSERT INTO atlas_entity_quotes (
      atlas_entity_id,
      section,
      speaker_type,
      character_id,
      speaker_name,
      speaker_meta,
      text,
      sort_order,
      created_at,
      updated_at
    )
    SELECT
      seed.atlas_entity_id,
      'geography'::atlas_section,
      quote.speaker_type,
      quote.character_id,
      quote.speaker_name,
      quote.speaker_meta,
      quote.text,
      quote.sort_order + 200,
      now(),
      now()
    FROM atlas_quotes quote
    JOIN atlas_entity_seed seed
      ON quote.node_type = 'country'
     AND quote.node_id = seed.country_id;

    CREATE TEMP TABLE atlas_entity_source_map AS
    SELECT 'country'::text AS source_type, country_id AS source_id, atlas_entity_id
    FROM atlas_entity_seed
    WHERE country_id IS NOT NULL
    UNION ALL
    SELECT 'location'::text AS source_type, location_id AS source_id, atlas_entity_id
    FROM atlas_entity_seed
    WHERE location_id IS NOT NULL
    UNION ALL
    SELECT 'atlas_entry'::text AS source_type, atlas_id AS source_id, atlas_entity_id
    FROM atlas_entity_seed
    WHERE atlas_id IS NOT NULL;

    INSERT INTO atlas_entity_links (from_atlas_entity_id, to_type, to_id, label, sort_order)
    SELECT
      from_map.atlas_entity_id,
      CASE
        WHEN link.to_type::text IN ('country', 'location', 'atlas_entry') THEN 'atlas_entity'::entity_type_v2
        ELSE link.to_type::text::entity_type_v2
      END AS to_type,
      CASE
        WHEN link.to_type::text IN ('country', 'location', 'atlas_entry') THEN to_map.atlas_entity_id
        ELSE link.to_id
      END AS to_id,
      link.label,
      ROW_NUMBER() OVER (PARTITION BY from_map.atlas_entity_id ORDER BY link.id ASC) - 1
    FROM atlas_links link
    JOIN atlas_entity_source_map from_map
      ON link.from_type::text = 'atlas_entry'
     AND from_map.source_type = 'atlas_entry'
     AND from_map.source_id = link.from_id
    LEFT JOIN atlas_entity_source_map to_map
      ON to_map.source_type = link.to_type::text
     AND to_map.source_id = link.to_id
    WHERE (
      link.to_type::text NOT IN ('country', 'location', 'atlas_entry')
      OR to_map.atlas_entity_id IS NOT NULL
    )
      AND NOT (
        link.to_type::text IN ('country', 'location', 'atlas_entry')
        AND from_map.atlas_entity_id = to_map.atlas_entity_id
      )
    ON CONFLICT (from_atlas_entity_id, to_type, to_id, label) DO NOTHING;

    UPDATE characters ch
    SET affiliation_entity_id = map.atlas_entity_id
    FROM atlas_entity_source_map map
    WHERE map.source_type = 'atlas_entry'
      AND map.source_id = ch.affiliation_id;

    UPDATE characters ch
    SET country_entity_id = map.atlas_entity_id
    FROM atlas_entity_source_map map
    WHERE map.source_type = 'country'
      AND map.source_id = ch.country_id;

    UPDATE episodes ep
    SET country_entity_id = map.atlas_entity_id
    FROM atlas_entity_source_map map
    WHERE map.source_type = 'country'
      AND map.source_id = ep.country_id;

    INSERT INTO episode_atlas_entities (episode_id, atlas_entity_id, sort_order)
    SELECT
      el.episode_id,
      map.atlas_entity_id,
      ROW_NUMBER() OVER (PARTITION BY el.episode_id ORDER BY l.title_ru ASC, el.location_id ASC) - 1
    FROM episode_locations el
    JOIN locations l
      ON l.id = el.location_id
    JOIN atlas_entity_source_map map
      ON map.source_type = 'location'
     AND map.source_id = el.location_id
    ON CONFLICT (episode_id, atlas_entity_id) DO NOTHING;
  `);

  pgm.addConstraint("atlas_entities", "atlas_entities_country_entity_fk", {
    foreignKeys: {
      columns: "country_entity_id",
      references: "atlas_entities(id)",
      onDelete: "set null"
    }
  });

  pgm.addConstraint("atlas_entities", "atlas_entities_location_entity_fk", {
    foreignKeys: {
      columns: "location_entity_id",
      references: "atlas_entities(id)",
      onDelete: "set null"
    }
  });

  pgm.addConstraint("characters", "characters_affiliation_entity_fk", {
    foreignKeys: {
      columns: "affiliation_entity_id",
      references: "atlas_entities(id)",
      onDelete: "set null"
    }
  });

  pgm.addConstraint("characters", "characters_country_entity_fk", {
    foreignKeys: {
      columns: "country_entity_id",
      references: "atlas_entities(id)",
      onDelete: "set null"
    }
  });

  pgm.addConstraint("episodes", "episodes_country_entity_fk", {
    foreignKeys: {
      columns: "country_entity_id",
      references: "atlas_entities(id)",
      onDelete: "restrict"
    }
  });

  pgm.alterColumn("episodes", "country_entity_id", {
    notNull: true
  });

  pgm.sql(`
    ALTER TABLE character_rumors
    ALTER COLUMN source_type TYPE text
    USING CASE WHEN source_type IS NULL THEN NULL ELSE source_type::text END;

    UPDATE character_rumors rumor
    SET
      source_type = 'atlas_entity',
      source_id = map.atlas_entity_id
    FROM atlas_entity_source_map map
    WHERE rumor.source_type IN ('country', 'location', 'atlas_entry')
      AND map.source_type = rumor.source_type
      AND map.source_id = rumor.source_id;

    TRUNCATE TABLE search_queue;
    ALTER TABLE search_queue
    ALTER COLUMN entity_type TYPE text
    USING entity_type::text;

    ALTER TABLE import_errors
    ALTER COLUMN entity_type TYPE text
    USING CASE WHEN entity_type IS NULL THEN NULL ELSE entity_type::text END;

    UPDATE import_errors
    SET entity_type = 'atlas_entity'
    WHERE entity_type IN ('country', 'location', 'atlas_entry');

    ALTER TABLE character_rumors
    ALTER COLUMN source_type TYPE entity_type_v2
    USING CASE WHEN source_type IS NULL THEN NULL ELSE source_type::entity_type_v2 END;

    ALTER TABLE search_queue
    ALTER COLUMN entity_type TYPE entity_type_v2
    USING entity_type::entity_type_v2;
  `);

  pgm.dropColumn("characters", "affiliation_id");
  pgm.dropColumn("characters", "country_id");
  pgm.dropColumn("episodes", "country_id");

  pgm.dropTable("atlas_entity_links_old", { ifExists: true });
  pgm.dropTable("atlas_links", { ifExists: true });
  pgm.dropTable("atlas_quotes", { ifExists: true });
  pgm.dropTable("atlas_facts", { ifExists: true });
  pgm.dropTable("episode_locations", { ifExists: true });
  pgm.dropTable("atlas_entries", { ifExists: true });
  pgm.dropTable("locations", { ifExists: true });
  pgm.dropTable("countries", { ifExists: true });
  pgm.sql("DROP TABLE IF EXISTS atlas_entity_source_map");
  pgm.sql("DROP TABLE IF EXISTS atlas_entity_seed");

  pgm.dropType("atlas_kind", { ifExists: true });
  pgm.dropType("entity_type", { ifExists: true });
  pgm.renameType("entity_type_v2", "entity_type");
};

exports.down = () => {
  throw new Error("010_big_bang_atlas_entity is irreversible");
};
