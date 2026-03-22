import "../../../scripts/load-root-env.cjs";
import { pool } from "./db.js";
import { runQueueWorker } from "./search-index.js";

const watch = process.argv.includes("--watch");
const pollMs = Number(process.env.SEARCH_WORKER_POLL_MS || 5000);
const batchSize = Number(process.env.SEARCH_WORKER_BATCH_SIZE || 20);

runQueueWorker({
  watch,
  pollMs: Number.isFinite(pollMs) ? pollMs : 5000,
  batchSize: Number.isFinite(batchSize) ? batchSize : 20
})
  .then((summary) => {
    if (!watch) {
      console.log(JSON.stringify(summary, null, 2));
    }
  })
  .then(async () => {
    if (!watch) {
      await pool.end();
      process.exit(0);
    }
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
