/* eslint-disable */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropColumns("countries", ["flag_emoji", "flag_asset_path"], {
    ifExists: true
  });
};

exports.down = (pgm) => {
  pgm.addColumns("countries", {
    flag_emoji: { type: "text" },
    flag_asset_path: { type: "text" }
  });
};
