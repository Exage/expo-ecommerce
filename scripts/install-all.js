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
  },
  {
    name: "admin",
    cwd: path.join(root, "admin"),
  },
  {
    name: "mobile",
    cwd: path.join(root, "mobile"),
  },
];

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

async function installDependencies(app) {
  if (!fs.existsSync(app.cwd)) {
    throw new Error(`Missing directory: ${app.cwd}`);
  }

  const hasLockfile = fs.existsSync(path.join(app.cwd, "package-lock.json"));
  const installArgs = hasLockfile ? ["ci"] : ["install"];

  log(`[${app.name}] installing dependencies with npm ${installArgs.join(" ")}`);
  await runCommand(npmCommand, installArgs, app.cwd, `${app.name}:install`);
}

(async () => {
  try {
    for (const app of apps) {
      await installDependencies(app);
    }

    log("All dependencies installed.");
  } catch (error) {
    log(error.message);
    process.exitCode = 1;
  }
})();
