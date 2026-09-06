import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { services } from "../src/server/database.js";
const dir = resolve(process.env.CMS_BACKUP_DIR || "/data/backups");
mkdirSync(dir, { recursive: true, mode: 0o700 });
const { db } = services();
const filename = resolve(
  dir,
  `cms-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
);
try {
  const receipt = await db.backup(filename);
  writeFileSync(filename + ".receipt.json", JSON.stringify(receipt, null, 2), {
    mode: 0o600,
    flag: "wx",
  });
  console.log(
    JSON.stringify({
      filename: receipt.filename,
      sha256: receipt.sha256,
      bytes: receipt.bytes,
    }),
  );
} finally {
  db.close();
}
