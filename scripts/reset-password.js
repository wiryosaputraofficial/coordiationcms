import { services } from "../src/server/database.js";
import { passwordHash } from "../src/server/password.js";
const email = process.argv[2];
if (!email || process.stdin.isTTY)
  throw new Error(
    "Supply email as argument and the new password on stdin. Never put passwords in command arguments.",
  );
let value = "";
for await (const chunk of process.stdin) value += chunk;
const { db, auth } = services(),
  u = db
    .prepare("SELECT id FROM co_users WHERE email=?")
    .get(email.toLowerCase());
if (!u) throw new Error("User not found");
const hash = await passwordHash(value.replace(/\r?\n$/, ""));
db.transaction(() => {
  db.prepare("UPDATE co_users SET password_hash=? WHERE id=?").run(hash, u.id);
  auth.revokeAll(u.id);
});
db.close();
console.log("Password updated; existing sessions revoked.");
