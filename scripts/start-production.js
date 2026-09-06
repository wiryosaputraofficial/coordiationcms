import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
const receipt = JSON.parse(readFileSync(".coordiation/app-build.json", "utf8"));
const entry = resolve(
  ".coordiation/app-builds",
  basename(receipt.directory),
  "start.js",
);
await import(pathToFileURL(entry).href);
