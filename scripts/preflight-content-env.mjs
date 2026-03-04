import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildContentEnv, loadDotEnvFile, validateContentEnv } from "./content-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dotEnvPath = path.join(projectRoot, ".env");
const dotEnvExamplePath = path.join(projectRoot, ".env.example");
const dotEnvValues = loadDotEnvFile(dotEnvPath);
const dotEnvExampleValues = loadDotEnvFile(dotEnvExamplePath);

function resolveDbSource(env) {
  if (env.DATABASE_URL && env.DATABASE_URL === dotEnvValues.DATABASE_URL) return ".env";
  if (env.DATABASE_URL && env.DATABASE_URL === process.env.DATABASE_URL) return "process.env";
  if (env.DATABASE_URL && env.DATABASE_URL === dotEnvExampleValues.DATABASE_URL) return ".env.example";

  return "unknown";
}

function hasLocalDotEnvDatabaseUrl() {
  if (!fs.existsSync(dotEnvPath)) return false;
  return Boolean(dotEnvValues.DATABASE_URL);
}

function maskDatabaseUrl(input) {
  try {
    const parsed = new URL(input);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "<invalid>";
  }
}

const env = buildContentEnv(projectRoot);
const validation = validateContentEnv(env);
const dbSource = resolveDbSource(env);
const localDotEnvDefined = hasLocalDotEnvDatabaseUrl();
const isCi = process.env.CI === "true";
const allowProcessEnv = process.env.ALLOW_PROCESS_ENV_DATABASE_URL === "1";
const matchesEnvExample =
  Boolean(dotEnvExampleValues.DATABASE_URL) && env.DATABASE_URL === dotEnvExampleValues.DATABASE_URL;

if (!validation.ok) {
  console.error("Content preflight failed:");
  for (const error of validation.errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  console.error("Fix:");
  console.error("1) Copy .env.example to .env");
  console.error("2) Ensure DATABASE_URL contains user, password, host and db name");
  process.exit(1);
}

if (!isCi && !localDotEnvDefined && dbSource === "process.env" && !allowProcessEnv && !matchesEnvExample) {
  console.error("Content preflight failed:");
  console.error("- Local run uses DATABASE_URL from process.env without .env");
  console.error("");
  console.error("Why this is blocked:");
  console.error("- Prevents hidden conflicts from global shell variables.");
  console.error("");
  console.error("Fix:");
  console.error("1) Copy .env.example to .env and set DATABASE_URL explicitly");
  console.error("2) Or run once with ALLOW_PROCESS_ENV_DATABASE_URL=1");
  process.exit(1);
}

console.log(`Content preflight passed. DATABASE_URL source: ${dbSource}`);
console.log(`DATABASE_URL: ${maskDatabaseUrl(env.DATABASE_URL)}`);
