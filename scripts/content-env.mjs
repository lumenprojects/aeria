import fs from "fs";
import path from "path";
import { URL } from "url";

export function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIdx = trimmed.indexOf("=");
    if (equalIdx <= 0) continue;
    const key = trimmed.slice(0, equalIdx).trim();
    let value = trimmed.slice(equalIdx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

export function buildContentEnv(projectRoot, options = {}) {
  const { preferDotEnvDatabaseUrl = true } = options;
  const examplePath = path.join(projectRoot, ".env.example");
  const dotenvPath = path.join(projectRoot, ".env");
  const exampleEnv = loadDotEnvFile(examplePath);
  const fileEnv = loadDotEnvFile(dotenvPath);
  const env = {
    ...exampleEnv,
    ...fileEnv,
    ...process.env
  };

  const canForceDotEnv =
    preferDotEnvDatabaseUrl &&
    process.env.CI !== "true" &&
    process.env.ALLOW_PROCESS_ENV_DATABASE_URL !== "1" &&
    Boolean(fileEnv.DATABASE_URL);

  if (canForceDotEnv) {
    env.DATABASE_URL = fileEnv.DATABASE_URL;
  }

  return env;
}

export function validateContentEnv(env) {
  const errors = [];
  const dbUrl = env.DATABASE_URL;

  if (!dbUrl) {
    errors.push("DATABASE_URL is missing");
  } else {
    try {
      const parsed = new URL(dbUrl);
      if (!parsed.protocol.startsWith("postgres")) {
        errors.push("DATABASE_URL must use postgres protocol");
      }
      if (!parsed.username) {
        errors.push("DATABASE_URL must include username");
      }
      if (!parsed.password) {
        errors.push("DATABASE_URL must include password");
      }
      if (!parsed.hostname) {
        errors.push("DATABASE_URL must include host");
      }
      if (!parsed.pathname || parsed.pathname === "/") {
        errors.push("DATABASE_URL must include database name");
      }
    } catch {
      errors.push("DATABASE_URL is not a valid URL");
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
