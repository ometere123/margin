import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const expected = "0.39.1";
const root = process.cwd();
const markerPath = path.join(root, ".genlayer-cli-version");
const rootPackagePath = path.join(root, "package.json");
const installedPackagePath = path.join(root, "node_modules", "genlayer", "package.json");

function fail(message) {
  console.error(`GenLayer CLI guard failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(markerPath)) fail("missing .genlayer-cli-version");
const marker = fs.readFileSync(markerPath, "utf8").trim();
if (marker !== expected) fail(`version marker is ${marker || "empty"}, expected ${expected}`);

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
const pinned = rootPackage.devDependencies?.genlayer;
if (pinned !== expected) fail(`package.json pins genlayer=${pinned ?? "missing"}, expected exact ${expected}`);

if (!fs.existsSync(installedPackagePath)) {
  fail("local genlayer package is not installed. Run npm install in the repository root first");
}

const installed = JSON.parse(fs.readFileSync(installedPackagePath, "utf8")).version;
if (installed !== expected) fail(`local node_modules/genlayer is ${installed}, expected ${expected}`);

console.log(`Local GenLayer CLI ${installed} is pinned correctly.`);
console.log("Use `npm exec -- genlayer ...` (or `npm run genlayer -- ...`) so any global CLI is ignored.");
