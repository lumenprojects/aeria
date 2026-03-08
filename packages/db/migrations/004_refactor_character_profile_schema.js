/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.renameColumn("characters", "birth_country_id", "country_id");
  pgm.renameColumn("characters", "description", "tagline");

  pgm.addColumns("characters", {
    mbti: { type: "text" }
  });

  pgm.dropColumns("characters", ["quote", "stats"], {
    ifExists: true
  });

  pgm.renameTable("character_traits", "character_quirks");

  pgm.addColumns("character_rumors", {
    author_name: { type: "text" },
    author_meta: { type: "text" },
    source_type: { type: "entity_type" },
    source_id: { type: "uuid" }
  });

  pgm.sql("UPDATE character_rumors SET author_name = 'Неизвестный источник' WHERE author_name IS NULL");
  pgm.alterColumn("character_rumors", "author_name", {
    notNull: true
  });
};

exports.down = (pgm) => {
  pgm.alterColumn("character_rumors", "author_name", {
    notNull: false
  });
  pgm.dropColumns("character_rumors", ["author_name", "author_meta", "source_type", "source_id"]);

  pgm.renameTable("character_quirks", "character_traits");

  pgm.addColumns("characters", {
    quote: { type: "text" },
    stats: { type: "jsonb" }
  });

  pgm.dropColumns("characters", ["mbti"], {
    ifExists: true
  });

  pgm.renameColumn("characters", "tagline", "description");
  pgm.renameColumn("characters", "country_id", "birth_country_id");
};
