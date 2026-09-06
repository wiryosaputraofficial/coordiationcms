import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { fail } from "./security.js";
const derive = promisify(scrypt);
export async function passwordHash(password) {
  if (
    typeof password !== "string" ||
    [...password].length < 15 ||
    password.length > 256
  )
    fail(400, "Passwords must contain 15–256 characters.");
  const salt = randomBytes(16).toString("hex"),
    hash = await derive(password, salt, 32, {
      N: 32768,
      r: 8,
      p: 3,
      maxmem: 64 * 1024 * 1024,
    });
  return `scrypt-v1$${salt}$${hash.toString("hex")}`;
}
