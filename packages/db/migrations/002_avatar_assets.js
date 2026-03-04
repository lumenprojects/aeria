/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("characters", {
    avatar_asset_path: { type: "text", notNull: true, default: "/assets/images/placeholders/character-default.png" }
  });

  pgm.addColumns("locations", {
    avatar_asset_path: { type: "text" }
  });

  pgm.addColumns("atlas_entries", {
    avatar_asset_path: { type: "text" }
  });

  pgm.alterColumn("characters", "avatar_asset_path", {
    default: null
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("atlas_entries", ["avatar_asset_path"]);
  pgm.dropColumns("locations", ["avatar_asset_path"]);
  pgm.dropColumns("characters", ["avatar_asset_path"]);
};
