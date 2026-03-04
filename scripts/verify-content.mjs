import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { buildContentEnv, validateContentEnv } from "./content-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function runStep(label, command, env) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, {
    cwd: projectRoot,
    stdio: "inherit",
    env,
    shell: true
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
}

const env = {
  ...process.env,
  ...buildContentEnv(projectRoot)
};

const validation = validateContentEnv(env);
if (!validation.ok) {
  console.error("Content verification failed on preflight:");
  for (const error of validation.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

runStep("Preflight content env", "npm run preflight:content", env);
runStep("Content smoke tests", "npm run test -w packages/content", env);
runStep("Database migrations", "npm run migrate", env);
runStep("Content dry-run import", "npm run content:dry-run", env);

console.log("\nContent verification passed.");
