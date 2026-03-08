/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("world_quotes", {
    id: { type: "bigserial", primaryKey: true },
    quote: { type: "text", notNull: true },
    source: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    archived_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createIndex("world_quotes", ["archived_at", "sort_order", "id"], { name: "world_quotes_visible_order_idx" });

  pgm.sql(`
    INSERT INTO world_quotes (quote, source, sort_order)
    VALUES
      ('У нас не было героев. Только сосед, который умел дышать через уши.', 'Услышано у костра', 1),
      ('В этом городе даже тишина сначала спрашивает имя.', 'Услышано в подворотне', 2),
      ('Карта всегда врет о расстояниях, но редко врет о страхе.', 'Услышано на переправе', 3),
      ('Если чай остыл дважды, значит разговор был важнее времени.', 'Услышано в чайной', 4),
      ('Старая лестница знает больше новостей, чем городская площадь.', 'Услышано на лестничной клетке', 5),
      ('Сначала смеются над суевериями, потом шепчут их перед дорогой.', 'Услышано в караване', 6)
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("world_quotes");
};
