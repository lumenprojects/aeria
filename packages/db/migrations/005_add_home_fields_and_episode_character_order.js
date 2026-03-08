/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("characters", {
    listed: { type: "boolean", notNull: true, default: true },
    home_featured: { type: "boolean", notNull: true, default: false },
    home_intro_title: { type: "text" },
    home_intro_markdown: { type: "text" }
  });

  pgm.addColumns("episode_characters", {
    sort_order: { type: "integer", notNull: true, default: 0 }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("episode_characters", ["sort_order"], { ifExists: true });
  pgm.dropColumns("characters", ["listed", "home_featured", "home_intro_title", "home_intro_markdown"], {
    ifExists: true
  });
};
