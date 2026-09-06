import { openDatabase } from "@coordiation/fullstack/database";
import { createPasswordAuth } from "@coordiation/fullstack/auth";
import { resolve } from "node:path";
import { builtInThemes } from "./themes.js";

const filename = resolve(process.env.CMS_DATABASE || "data/cms.sqlite");
const key = Symbol.for(`coordiation.cms:${filename}`);
function initialize() {
  const db = openDatabase({
    filename,
    migrations: [
      {
        id: "cms-001",
        sql: `
    CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('administrator','editor','author','contributor','subscriber'))) STRICT;
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    CREATE TABLE posts (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, excerpt TEXT NOT NULL DEFAULT '', blocks TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', visibility TEXT NOT NULL DEFAULT 'public', author_id TEXT NOT NULL REFERENCES profiles(id), featured_id TEXT, categories TEXT NOT NULL DEFAULT '[]', tags TEXT NOT NULL DEFAULT '[]', comments_open INTEGER NOT NULL DEFAULT 1, publish_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1) STRICT;
    CREATE INDEX posts_status ON posts(status, publish_at);
    CREATE TABLE revisions (id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, snapshot TEXT NOT NULL, created_at TEXT NOT NULL, author_id TEXT NOT NULL) STRICT;
    CREATE TABLE autosaves (post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, author_id TEXT NOT NULL, snapshot TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(post_id, author_id)) STRICT;
    CREATE TABLE terms (id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL, UNIQUE(kind, slug)) STRICT;
    CREATE TABLE media (id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, bytes BLOB NOT NULL, alt TEXT NOT NULL DEFAULT '', caption TEXT NOT NULL DEFAULT '', author_id TEXT NOT NULL REFERENCES profiles(id), created_at TEXT NOT NULL) STRICT;
    CREATE TABLE comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL) STRICT;
    CREATE TABLE themes (id TEXT PRIMARY KEY, manifest TEXT NOT NULL, installed_at TEXT NOT NULL) STRICT;
    CREATE TABLE activity (id INTEGER PRIMARY KEY, actor TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL) STRICT;
    CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, until_at INTEGER NOT NULL) STRICT;
  `,
      },
      {
        id: "cms-002-theme-api-key",
        sql: `UPDATE themes SET manifest = json_remove(json_set(manifest, '$.cmsVersion', json_extract(manifest, '$.cmsVersionon')), '$.cmsVersionon') WHERE json_type(manifest, '$.cmsVersionon') IS NOT NULL AND json_type(manifest, '$.cmsVersion') IS NULL;`,
      },
    ],
  });
  const auth = createPasswordAuth({
    database: db,
    cookieName: "co_cms_session",
    secure: process.env.CMS_SECURE_COOKIES === "true",
  });
  const defaults = {
    title: "Studio Journal",
    tagline: "Stories, creative work, and things that matter.",
    activeTheme: "folio",
    accent: "#050505",
    menu: [{ label: "Home", href: "/" }],
    plugins: ["reading-time"],
    postsPerPage: 9,
    allowComments: true,
    hideComments: false,
    homepage: "",
    footer: "Made with Coordiation CMS.",
  };
  db.transaction(() => {
    for (const [k, v] of Object.entries(defaults))
      db.prepare("INSERT OR IGNORE INTO settings VALUES (?, ?)").run(
        k,
        JSON.stringify(v),
      );
    for (const t of builtInThemes)
      db.prepare("INSERT OR IGNORE INTO themes VALUES (?, ?, ?)").run(
        t.id,
        JSON.stringify(t),
        new Date().toISOString(),
      );
  });
  return { db, auth };
}
export function services() {
  return (globalThis[key] ||= initialize());
}
export function settings() {
  return Object.fromEntries(
    services()
      .db.prepare("SELECT * FROM settings")
      .all()
      .map((r) => [r.key, JSON.parse(r.value)]),
  );
}
export function setSetting(k, v) {
  services()
    .db.prepare("INSERT OR REPLACE INTO settings VALUES (?, ?)")
    .run(k, JSON.stringify(v));
}
export function log(user, message) {
  services()
    .db.prepare("INSERT INTO activity(actor,message,created_at) VALUES (?,?,?)")
    .run(user.name, message, new Date().toISOString());
}
export function publishDue() {
  services()
    .db.prepare(
      "UPDATE posts SET status='published', version=version+1, updated_at=? WHERE status='scheduled' AND publish_at<=?",
    )
    .run(new Date().toISOString(), new Date().toISOString());
}
export function publicPost(row) {
  if (!row) return null;
  return {
    ...row,
    blocks: JSON.parse(row.blocks),
    categories: JSON.parse(row.categories),
    tags: JSON.parse(row.tags),
  };
}
