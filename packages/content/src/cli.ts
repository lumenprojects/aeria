import "../../../scripts/load-root-env.cjs";
import { Command } from "commander";
import { runImport } from "./importer.js";

const program = new Command();

program
  .name("aeria-import")
  .option("--dry-run", "run without writing to the database", false)
  .option("--batch-size <n>", "batch size for import", "50")
  .option("--reindex", "enqueue full search reindex", false)
  .parse(process.argv);

const options = program.opts();

const rootDir = process.env.INIT_CWD ?? process.cwd();
const batchSize = Number(options.batchSize);

runImport({
  rootDir,
  dryRun: Boolean(options.dryRun),
  batchSize: Number.isFinite(batchSize) ? batchSize : 50,
  reindex: Boolean(options.reindex)
})
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
