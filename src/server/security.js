import { HttpError } from "@coordiation/fullstack";
import { services } from "./database.js";

export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export function currentUser(request) {
  const { auth, db } = services();
  const identity = auth.session(request);
  return identity
    ? {
        ...identity,
        ...db
          .prepare("SELECT name,role FROM profiles WHERE id=?")
          .get(identity.id),
      }
    : null;
}
export function requireUser(request, roles) {
  const u = currentUser(request);
  if (!u?.role) fail(401, "Please sign in first.");
  if (roles && !roles.includes(u.role))
    fail(403, "You do not have permission for this action.");
  return u;
}
export const editors = ["administrator", "editor"];
export const writers = [...editors, "author", "contributor"];
export function canEdit(user, post) {
  return (
    editors.includes(user.role) ||
    (writers.includes(user.role) &&
      post.author_id === user.id &&
      post.type === "post" &&
      (user.role !== "contributor" ||
        ["draft", "pending", "trash"].includes(post.status)))
  );
}
export function sameOrigin(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin)
    fail(403, "The request must come from the same site.");
  if (
    url.protocol !== "https:" &&
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  )
    fail(403, "HTTPS is required to access the CMS.");
}
export async function body(request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    fail(415, "Use application/json.");
  try {
    const b = await request.json();
    if (!b || typeof b !== "object" || Array.isArray(b))
      fail(400, "Invalid data.");
    return b;
  } catch {
    fail(400, "Invalid JSON.");
  }
}
export function text(value, max = 200, required = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    fail(400, "Text is invalid or too long.");
  return value.trim();
}
export function slug(value) {
  const s = text(value, 160, true)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (
    !s ||
    [
      "admin",
      "login",
      "setup",
      "api",
      "media",
      "feed",
      "theme.css",
      "search",
      "category",
      "tag",
    ].includes(s)
  )
    fail(400, "The slug is invalid or reserved by the system.");
  return s;
}
export function safeUrl(value) {
  const v = text(value, 2000);
  if (!v) return "";
  if (/^\/(?!\/)/.test(v) && !/[\\\r\n]/.test(v)) return v;
  try {
    if (new URL(v).protocol === "https:") return v;
  } catch {}
  fail(400, "URLs must be local paths or use HTTPS.");
}
export function rateLimit(key, max = 10, window = 900000) {
  const { db } = services();
  const now = Date.now();
  db.prepare("DELETE FROM rate_limits WHERE until_at < ?").run(now);
  const row = db.prepare("SELECT * FROM rate_limits WHERE key=?").get(key);
  if (row?.count >= max)
    fail(429, "Too many attempts. Please try again later.");
  db.prepare(
    "INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(key, now + window);
}
export async function endpoint(fn) {
  try {
    return await fn();
  } catch (e) {
    const status =
      e.status || (String(e.message).includes("UNIQUE constraint") ? 409 : 500);
    if (status === 500) console.error(e);
    return Response.json(
      {
        error:
          status === 500
            ? "A server error occurred."
            : status === 409
              ? "This slug or record is already in use. Reload before saving."
              : e.message,
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
