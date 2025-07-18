#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from package directory
const envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

const command = process.argv[2];
const args = process.argv.slice(3);

const commands = {
  setup: "src/scripts/memories/setup.js",
  add: "src/scripts/memories/add.js",
  search: "src/scripts/memories/search.js",
};

if (!command || !commands[command]) {
  console.log("Available commands:");
  console.log("  memories setup   - Setup environment variables");
  console.log("  memories add     - Add a new memory");
  console.log("  memories search  - Search memories");
  process.exit(1);
}

const scriptPath = path.join(__dirname, commands[command]);
const child = spawn("node", [scriptPath, ...args], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env }, // Pass environment variables to child process
});

child.on("close", (code) => {
  process.exit(code);
});
