const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const root = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const apps = [
  {
    name: "backend",
    cwd: path.join(root, "backend"),
    args: ["run", "dev"],
  },
  {
    name: "admin",
    cwd: path.join(root, "admin"),
    args: ["run", "dev"],
  },
  {
    name: "mobile",
    cwd: path.join(root, "mobile"),
    args: ["run", "start"],
  },
];

const children = [];
let shuttingDown = false;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function runCommand(command, args, cwd, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    prefixStream(child.stdout, label);
    prefixStream(child.stderr, label);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

function prefixStream(stream, label) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    process.stdout.write(`[${label}] ${line}\n`);
  });
}

async function ensureDependencies(app) {
  const nodeModulesPath = path.join(app.cwd, "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    return;
  }

  const hasLockfile = fs.existsSync(path.join(app.cwd, "package-lock.json"));
  const installArgs = hasLockfile ? ["ci"] : ["install"];
  log(`[${app.name}] dependencies not found, running npm ${installArgs.join(" ")}`);
  await runCommand(npmCommand, installArgs, app.cwd, `${app.name}:install`);
}

function startApp(app) {
  if (!fs.existsSync(app.cwd)) {
    throw new Error(`Missing directory: ${app.cwd}`);
  }

  const child = spawn(npmCommand, app.args, {
    cwd: app.cwd,
    env: process.env,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.push({ app, child });
  prefixStream(child.stdout, app.name);
  prefixStream(child.stderr, app.name);

  child.on("error", (error) => {
    log(`[${app.name}] failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    log(`[${app.name}] exited with ${reason}`);
    shutdown(typeof code === "number" ? code : 1);
  });

  log(`[${app.name}] starting...`);
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const { child } of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 500);
}

process.on("SIGINT", () => {
  log("Received SIGINT, stopping all apps...");
  shutdown(0);
});

process.on("SIGTERM", () => {
  log("Received SIGTERM, stopping all apps...");
  shutdown(0);
});

log("Starting backend, admin, and mobile...");

(async () => {
  try {
    for (const app of apps) {
      await ensureDependencies(app);
    }

    for (const app of apps) {
      startApp(app);
    }
  } catch (error) {
    log(error.message);
    shutdown(1);
  }
})();
