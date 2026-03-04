import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const pgPort = Number(process.env.AERIA_PG_PORT ?? 55432);
const pgUser = process.env.AERIA_PG_USER ?? "aeria";
const pgPassword = process.env.AERIA_PG_PASSWORD ?? "aeria";
const pgDatabase = process.env.AERIA_PG_DB ?? "aeria";
const pgHost = process.env.AERIA_PG_HOST ?? "127.0.0.1";

const localDir = path.join(projectRoot, ".local");
const dataDir = path.join(localDir, "postgres");
const logDir = path.join(localDir, "logs");
const logFile = path.join(logDir, "postgres.log");

function runBinary(name, args, options = {}) {
  const result = spawnSync(name, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    env: {
      ...process.env,
      ...(options.env ?? {})
    }
  });

  return result;
}

function assertCommandExists(command) {
  const result = runBinary(command, ["--version"]);
  if (result.error) {
    throw new Error(
      `${command} is not available in PATH. Install PostgreSQL binaries or use Docker flow.`
    );
  }
}

function serverRunning() {
  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) return false;
  const result = runBinary("pg_ctl", ["-D", dataDir, "status"]);
  return result.status === 0;
}

function ensureDirectories() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });
}

function ensureInitialized() {
  if (fs.existsSync(path.join(dataDir, "PG_VERSION"))) return;

  ensureDirectories();
  const pwFile = path.join(localDir, "pg.pass");
  fs.writeFileSync(pwFile, pgPassword, "utf8");

  const init = runBinary("initdb", [
    "-D",
    dataDir,
    "-U",
    pgUser,
    "--pwfile",
    pwFile,
    "-A",
    "scram-sha-256",
    "-E",
    "UTF8"
  ]);

  fs.rmSync(pwFile, { force: true });

  if (init.status !== 0) {
    throw new Error(`initdb failed:\n${init.stdout ?? ""}\n${init.stderr ?? ""}`);
  }
}

function startServer() {
  if (serverRunning()) return;
  ensureDirectories();

  const start = runBinary("pg_ctl", [
    "-D",
    dataDir,
    "-l",
    logFile,
    "-o",
    `-p ${pgPort}`,
    "-w",
    "start"
  ]);

  if (start.status !== 0) {
    throw new Error(`pg_ctl start failed:\n${start.stdout ?? ""}\n${start.stderr ?? ""}`);
  }
}

function ensureDatabase() {
  const createdb = runBinary(
    "createdb",
    ["-h", pgHost, "-p", String(pgPort), "-U", pgUser, pgDatabase],
    {
      env: { PGPASSWORD: pgPassword }
    }
  );

  if (createdb.status === 0) return;

  const stderr = createdb.stderr ?? "";
  const stdout = createdb.stdout ?? "";
  const out = `${stdout}\n${stderr}`.toLowerCase();
  const alreadyExists =
    out.includes("already exists") ||
    out.includes("уже существует") ||
    out.includes("database exists");

  if (!alreadyExists) {
    throw new Error(`createdb failed:\n${stdout}\n${stderr}`);
  }
}

function stopServer() {
  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) return;
  if (!serverRunning()) return;

  const stop = runBinary("pg_ctl", ["-D", dataDir, "-m", "fast", "stop"]);
  if (stop.status !== 0) {
    throw new Error(`pg_ctl stop failed:\n${stop.stdout ?? ""}\n${stop.stderr ?? ""}`);
  }
}

function printConnectionInfo() {
  const databaseUrl = `postgres://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
  console.log("Local PostgreSQL is ready.");
  console.log(`DATABASE_URL=${databaseUrl}`);
  console.log("Suggested .env content:");
  console.log(`DATABASE_URL=${databaseUrl}`);
}

function usage() {
  console.log("Usage: node scripts/dev-postgres.mjs <up|down|status|reset>");
}

async function main() {
  assertCommandExists("initdb");
  assertCommandExists("pg_ctl");
  assertCommandExists("createdb");

  const command = process.argv[2];
  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === "up") {
    ensureInitialized();
    startServer();
    ensureDatabase();
    printConnectionInfo();
    return;
  }

  if (command === "down") {
    stopServer();
    console.log("Local PostgreSQL stopped.");
    return;
  }

  if (command === "status") {
    const running = serverRunning();
    console.log(running ? "Local PostgreSQL is running." : "Local PostgreSQL is not running.");
    process.exit(running ? 0 : 1);
  }

  if (command === "reset") {
    stopServer();
    fs.rmSync(dataDir, { recursive: true, force: true });
    console.log("Local PostgreSQL data reset.");
    return;
  }

  usage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
