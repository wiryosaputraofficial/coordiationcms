import { readFileSync } from "node:fs";
import { restoreDatabase } from "@coordiation/fullstack/database";
const [source, receiptPath, destination] = process.argv.slice(2);
if (!source || !receiptPath || !destination)
  throw new Error(
    "Usage: node scripts/restore.js snapshot.sqlite receipt.json NEW-destination.sqlite",
  );
const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
const result = await restoreDatabase({
  source,
  filename: destination,
  expectedSha256: receipt.sha256,
});
console.log(JSON.stringify(result));
