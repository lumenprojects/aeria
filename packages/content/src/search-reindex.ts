import "../../../scripts/load-root-env.cjs";
import { pool } from "./db.js";
import { rebuildSearchIndex } from "./search-index.js";

rebuildSearchIndex()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
