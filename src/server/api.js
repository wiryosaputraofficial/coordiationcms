import { randomUUID } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import {
  services,
  settings,
  setSetting,
  log,
  publicPost,
  publishDue,
} from "./database.js";
import {
  endpoint,
  requireUser,
  editors,
  writers,
  sameOrigin,
  body,
  text,
  slug,
  fail,
  safeUrl,
  canEdit,
} from "./security.js";
import { savePost, validateBlocks } from "./content.js";
import { packTheme, unpackTheme, cleanHTML, validTheme } from "./themes.js";

import { passwordHash } from "./password.js";
const json = Response.json;
const admin = ["administrator"];
const mediaList = () =>
  services()
    .db.prepare(
      "SELECT id,name,mime,length(bytes) AS size,alt,caption,author_id,created_at FROM media ORDER BY created_at DESC",
    )
    .all();
function getPost(id, user) {
  const p = publicPost(
    services().db.prepare("SELECT * FROM posts WHERE id=?").get(id),
  );
  if (!p) fail(404, "Content not found.");
  if (!canEdit(user, p)) fail(403, "Content access denied.");
  return p;
}
export function GET(request, { params }) {
  return endpoint(() => {
    const u = requireUser(request),
      { db } = services(),
      url = new URL(request.url),
      resource = params.resource;
    publishDue();
    if (resource === "dashboard") {
      const own = !editors.includes(u.role),
        args = own ? [u.id] : [],
        where = own ? " WHERE author_id=?" : "";
      return json({
        user: u,
        settings: settings(),
        stats: db
          .prepare(
            `SELECT type,status,count(*) AS count FROM posts${where} GROUP BY type,status`,
          )
          .all(...args),
        recent: db
          .prepare(
            `SELECT id,title,type,status,updated_at FROM posts${where} ORDER BY updated_at DESC LIMIT 6`,
          )
          .all(...args),
        activity: editors.includes(u.role)
          ? db.prepare("SELECT * FROM activity ORDER BY id DESC LIMIT 8").all()
          : [],
        mediaCount: db.prepare("SELECT count(*) AS n FROM media").get().n,
        commentCount: editors.includes(u.role)
          ? db
              .prepare(
                "SELECT count(*) AS n FROM comments WHERE status='pending'",
              )
              .get().n
          : 0,
        themes: db
          .prepare("SELECT id,manifest FROM themes")
          .all()
          .map((r) => {
            const t = JSON.parse(r.manifest);
            return { id: t.id, name: t.name, version: t.version };
          }),
      });
    }
    if (resource === "posts") {
      requireUser(request, writers);
      if (url.searchParams.get("id")) {
        const p = getPost(url.searchParams.get("id"), u);
        return json({
          post: p,
          revisions: db
            .prepare(
              "SELECT id,created_at,author_id FROM revisions WHERE post_id=? ORDER BY created_at DESC LIMIT 50",
            )
            .all(p.id),
          autosave:
            db
              .prepare(
                "SELECT snapshot,updated_at FROM autosaves WHERE post_id=? AND author_id=?",
              )
              .get(p.id, u.id) || null,
        });
      }
      const where = editors.includes(u.role) ? "" : " WHERE author_id=?";
      return json(
        db
          .prepare(`SELECT * FROM posts${where} ORDER BY updated_at DESC`)
          .all(...(where ? [u.id] : []))
          .map(publicPost),
      );
    }
    if (resource === "terms") {
      requireUser(request, writers);
      return json(db.prepare("SELECT * FROM terms ORDER BY name").all());
    }
    if (resource === "media") {
      requireUser(request, [...editors, "author"]);
      return json(mediaList());
    }
    if (resource === "comments") {
      requireUser(request, editors);
      return json(
        db
          .prepare(
            "SELECT c.*,p.title AS post_title FROM comments c JOIN posts p ON p.id=c.post_id ORDER BY c.created_at DESC",
          )
          .all(),
      );
    }
    if (resource === "users") {
      requireUser(request, admin);
      return json(
        db
          .prepare(
            "SELECT p.*,u.email FROM profiles p JOIN co_users u ON u.id=p.id ORDER BY p.name",
          )
          .all(),
      );
    }
    if (resource === "settings") {
      requireUser(request, admin);
      return json(settings());
    }
    if (resource === "theme-source") {
      requireUser(request, admin);
      const row = db
        .prepare("SELECT manifest FROM themes WHERE id=?")
        .get(url.searchParams.get("id"));
      if (!row) fail(404, "Theme not found.");
      return json(JSON.parse(row.manifest));
    }
    if (resource === "themes") {
      requireUser(request, admin);
      if (url.searchParams.get("export")) {
        const t = db
          .prepare("SELECT manifest FROM themes WHERE id=?")
          .get(url.searchParams.get("export"));
        if (!t) fail(404, "Theme not found.");
        return new Response(packTheme(JSON.parse(t.manifest)), {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${url.searchParams.get("export")}.zip"`,
          },
        });
      }
      return json({
        active: settings().activeTheme,
        items: db
          .prepare("SELECT manifest FROM themes")
          .all()
          .map((r) => {
            const { home, single, css, ...t } = JSON.parse(r.manifest);
            return t;
          }),
      });
    }
    if (resource === "export") {
      requireUser(request, admin);
      const posts = db.prepare("SELECT * FROM posts").all().map(publicPost);
      const terms = db.prepare("SELECT * FROM terms").all();
      return new Response(
        JSON.stringify(
          {
            format: "coordiation-content",
            version: 1,
            exportedAt: new Date().toISOString(),
            posts,
            terms,
          },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition":
              'attachment; filename="coordiation-content.json"',
          },
        },
      );
    }
    fail(404, "Endpoint not found.");
  });
}
export function POST(request, { params }) {
  return endpoint(async () => {
    sameOrigin(request);
    const u = requireUser(request),
      { db, auth } = services(),
      resource = params.resource;
    if (resource === "media") {
      requireUser(request, [...editors, "author"]);
      const form = await request.formData(),
        file = form.get("file");
      if (
        !file ||
        typeof file.arrayBuffer !== "function" ||
        file.size > 800000 ||
        file.size === 0
      )
        fail(400, "Choose an image up to 800 KB.");
      const bytes = Buffer.from(await file.arrayBuffer());
      let mime;
      if (
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        mime = "image/png";
      else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        mime = "image/jpeg";
      else if (["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString()))
        mime = "image/gif";
      else if (
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP"
      )
        mime = "image/webp";
      else fail(400, "Supported formats: PNG, JPEG, GIF, WebP.");
      const id = randomUUID();
      db.prepare("INSERT INTO media VALUES (?,?,?,?,?,?,?,?)").run(
        id,
        text(file.name, 200, true),
        mime,
        bytes,
        text(String(form.get("alt") || ""), 500),
        "",
        u.id,
        new Date().toISOString(),
      );
      log(u, "Uploaded media");
      return json({ id, url: `/media/${id}` });
    }
    if (resource === "install-theme") {
      requireUser(request, admin);
      const form = await request.formData(),
        file = form.get("file");
      if (!file || typeof file.arrayBuffer !== "function" || file.size > 800000)
        fail(400, "Theme packages must be no larger than 800 KB.");
      let t;
      try {
        t = unpackTheme(new Uint8Array(await file.arrayBuffer()));
      } catch (e) {
        fail(400, e.message);
      }
      db.prepare("INSERT INTO themes VALUES (?,?,?)").run(
        t.id,
        JSON.stringify(t),
        new Date().toISOString(),
      );
      log(u, `Installed theme ${t.name}`);
      return json({ ok: true, id: t.id });
    }
    const b = await body(request);
    if (resource === "posts") {
      requireUser(request, writers);
      const post = savePost(b, u);
      log(
        u,
        `${b.id ? "Updated" : "Created"} ${post.type === "page" ? "page" : "post"} “${post.title}”`,
      );
      return json(post);
    }
    if (resource === "autosave") {
      requireUser(request, writers);
      getPost(b.id, u);
      validateBlocks(b.blocks || []);
      if (JSON.stringify(b).length > 300000) fail(400, "Content is too large.");
      db.prepare(
        "INSERT INTO autosaves VALUES (?,?,?,?) ON CONFLICT(post_id,author_id) DO UPDATE SET snapshot=excluded.snapshot,updated_at=excluded.updated_at",
      ).run(b.id, u.id, JSON.stringify(b), new Date().toISOString());
      return json({ ok: true });
    }
    if (resource === "restore") {
      requireUser(request, writers);
      const p = getPost(b.id, u),
        r = db
          .prepare("SELECT snapshot FROM revisions WHERE id=? AND post_id=?")
          .get(b.revision, p.id);
      if (!r) fail(404, "Revision not found.");
      return json(
        savePost(
          { ...JSON.parse(r.snapshot), id: p.id, version: b.version },
          u,
        ),
      );
    }
    if (resource === "terms") {
      requireUser(request, editors);
      if (!["category", "tag"].includes(b.kind)) fail(400, "Invalid taxonomy.");
      const id = b.id || randomUUID();
      if (b.id)
        db.prepare("UPDATE terms SET name=?,slug=? WHERE id=?").run(
          text(b.name, 100, true),
          slug(b.slug || b.name),
          id,
        );
      else
        db.prepare("INSERT INTO terms VALUES (?,?,?,?)").run(
          id,
          b.kind,
          text(b.name, 100, true),
          slug(b.slug || b.name),
        );
      return json({ id });
    }
    if (resource === "comments") {
      requireUser(request, editors);
      if (!["approved", "pending", "spam", "trash"].includes(b.status))
        fail(400, "Invalid comment status.");
      db.prepare("UPDATE comments SET status=? WHERE id=?").run(b.status, b.id);
      return json({ ok: true });
    }
    if (resource === "media-meta") {
      requireUser(request, [...editors, "author"]);
      const m = db.prepare("SELECT author_id FROM media WHERE id=?").get(b.id);
      if (!m) fail(404, "Media not found.");
      if (!editors.includes(u.role) && m.author_id !== u.id)
        fail(403, "Access denied.");
      db.prepare("UPDATE media SET alt=?,caption=? WHERE id=?").run(
        text(b.alt || "", 500),
        text(b.caption || "", 1000),
        b.id,
      );
      return json({ ok: true });
    }
    if (resource === "themes") {
      requireUser(request, admin);
      const t = db.prepare("SELECT manifest FROM themes WHERE id=?").get(b.id);
      if (!t) fail(404, "Theme not found.");
      setSetting("activeTheme", b.id);
      setSetting("accent", JSON.parse(t.manifest).accent);
      log(u, `Activated theme ${b.id}`);
      return json({ ok: true });
    }
    if (resource === "settings") {
      requireUser(request, admin);
      const allowed = [
        "title",
        "tagline",
        "footer",
        "accent",
        "postsPerPage",
        "allowComments",
        "menu",
        "plugins",
        "homepage",
      ];
      const validated = {};
      for (const k of Object.keys(b)) {
        if (!allowed.includes(k)) fail(400, "Unknown setting.");
        let v = b[k];
        if (["title", "tagline", "footer"].includes(k))
          v = text(v, 300, k === "title");
        if (k === "accent" && !/^#[0-9a-f]{6}$/i.test(v))
          fail(400, "Invalid color.");
        if (k === "postsPerPage" && (!Number.isInteger(v) || v < 1 || v > 50))
          fail(400, "Posts per page must be between 1 and 50.");
        if (k === "allowComments" && typeof v !== "boolean")
          fail(400, "Invalid setting.");
        if (
          k === "homepage" &&
          v &&
          !db
            .prepare(
              "SELECT id FROM posts WHERE id=? AND type='page' AND status='published' AND visibility='public'",
            )
            .get(v)
        )
          fail(400, "Choose a published public page.");
        if (k === "menu") {
          if (!Array.isArray(v) || v.length > 20)
            fail(400, "Up to 20 menu links are allowed.");
          v = v.map((x) => ({
            label: text(x.label, 80, true),
            href: safeUrl(x.href),
          }));
        }
        if (
          k === "plugins" &&
          (!Array.isArray(v) ||
            v.some((x) => !["reading-time", "table-of-contents"].includes(x)))
        )
          fail(400, "Unknown plugin.");
        validated[k] = v;
      }
      db.transaction(() => {
        for (const [k, v] of Object.entries(validated)) setSetting(k, v);
      });
      log(u, "Updated site settings");
      return json({ ok: true });
    }
    if (resource === "users") {
      requireUser(request, admin);
      const name = text(b.name, 100, true);
      if (
        ![
          "administrator",
          "editor",
          "author",
          "contributor",
          "subscriber",
        ].includes(b.role)
      )
        fail(400, "Invalid role.");
      if (b.id) {
        const target = db
          .prepare("SELECT * FROM profiles WHERE id=?")
          .get(b.id);
        if (!target) fail(404, "User not found.");
        if (
          target.role === "administrator" &&
          b.role !== "administrator" &&
          db
            .prepare(
              "SELECT count(*) AS n FROM profiles WHERE role='administrator'",
            )
            .get().n <= 1
        )
          fail(400, "The last administrator cannot be demoted.");
        db.prepare("UPDATE profiles SET name=?,role=? WHERE id=?").run(
          name,
          b.role,
          b.id,
        );
        auth.revokeAll(b.id);
      } else {
        const { user } = await auth.signUp({
          email: b.email,
          password: b.password,
        });
        auth.revokeAll(user.id);
        db.prepare("INSERT INTO profiles VALUES (?,?,?)").run(
          user.id,
          name,
          b.role,
        );
      }
      log(u, "Updated users");
      return json({ ok: true });
    }
    if (resource === "theme-source") {
      requireUser(request, admin);
      let t;
      try {
        t = validTheme(b.theme);
      } catch (e) {
        fail(400, e.message);
      }
      if (b.update === true) {
        if (!db.prepare("SELECT id FROM themes WHERE id=?").get(t.id))
          fail(404, "Theme not found.");
        db.prepare("UPDATE themes SET manifest=? WHERE id=?").run(
          JSON.stringify(t),
          t.id,
        );
      } else
        db.prepare("INSERT INTO themes VALUES (?,?,?)").run(
          t.id,
          JSON.stringify(t),
          new Date().toISOString(),
        );
      log(u, `Saved theme ${t.name}`);
      return json({ ok: true, id: t.id });
    }
    if (resource === "password") {
      await auth.signIn({ email: u.email, password: b.current });
      const hash = await passwordHash(b.password);
      db.transaction(() => {
        db.prepare("UPDATE co_users SET password_hash=? WHERE id=?").run(
          hash,
          u.id,
        );
        auth.revokeAll(u.id);
      });
      log(u, "Changed password");
      return json({ ok: true });
    }
    if (resource === "profile") {
      db.prepare("UPDATE profiles SET name=? WHERE id=?").run(
        text(b.name, 100, true),
        u.id,
      );
      return json({ ok: true });
    }
    if (resource === "import") {
      requireUser(request, admin);
      let items,
        terms = [];
      if (b.format === "wordpress") {
        const xml = text(b.content, 700000, true);
        if (/<!DOCTYPE|<!ENTITY/i.test(xml))
          fail(400, "External XML declarations are not allowed.");
        const doc = new XMLParser({
          ignoreAttributes: false,
          processEntities: false,
          parseTagValue: false,
        }).parse(xml);
        const raw = doc?.rss?.channel?.item;
        if (!raw) fail(400, "No posts were found in the WordPress WXR file.");
        items = (Array.isArray(raw) ? raw : [raw])
          .filter((x) => ["post", "page"].includes(x["wp:post_type"]))
          .map((x) => ({
            type: x["wp:post_type"],
            title: x.title,
            slug: x["wp:post_name"] || x.title,
            excerpt: cleanHTML(String(x["excerpt:encoded"] || "")).replace(
              /<[^>]*>/g,
              "",
            ),
            status: x["wp:status"] === "publish" ? "published" : "draft",
            blocks: [
              {
                type: "html",
                content: cleanHTML(String(x["content:encoded"] || "")),
              },
            ],
          }));
      } else {
        let parsed;
        try {
          parsed = JSON.parse(b.content);
        } catch {
          fail(400, "Invalid JSON.");
        }
        if (
          parsed.format !== "coordiation-content" ||
          parsed.version !== 1 ||
          !Array.isArray(parsed.posts)
        )
          fail(400, "Unsupported export format.");
        items = parsed.posts;
        terms = parsed.terms || [];
      }
      if (items.length > 200 || terms.length > 500)
        fail(
          400,
          "Each import supports up to 200 posts and 500 taxonomy terms.",
        );
      let count = 0;
      db.transaction(() => {
        const ids = new Map();
        for (const t of terms) {
          const name = text(t.name, 100, true),
            s = slug(t.slug || t.name);
          if (!["category", "tag"].includes(t.kind))
            fail(400, "Invalid taxonomy.");
          let existing = db
            .prepare("SELECT id FROM terms WHERE kind=? AND slug=?")
            .get(t.kind, s);
          const id = existing?.id || randomUUID();
          if (!existing)
            db.prepare("INSERT INTO terms VALUES (?,?,?,?)").run(
              id,
              t.kind,
              name,
              s,
            );
          ids.set(t.id, id);
        }
        for (const item of items) {
          let s = slug(item.slug || item.title);
          while (db.prepare("SELECT id FROM posts WHERE slug=?").get(s))
            s = slug(s.slice(0, 140) + "-" + randomUUID().slice(0, 6));
          savePost(
            {
              ...item,
              id: undefined,
              slug: s,
              featured_id: null,
              categories: (item.categories || [])
                .map((x) => ids.get(x))
                .filter(Boolean),
              tags: (item.tags || []).map((x) => ids.get(x)).filter(Boolean),
              status: ["published", "draft", "pending"].includes(item.status)
                ? item.status
                : "draft",
            },
            u,
            true,
          );
          count++;
        }
      });
      log(u, `Imported ${count} items`);
      return json({ count });
    }
    fail(404, "Endpoint not found.");
  });
}
export function DELETE(request, { params }) {
  return endpoint(async () => {
    sameOrigin(request);
    const u = requireUser(request),
      { db } = services(),
      b = await body(request),
      r = params.resource;
    if (r === "posts") {
      requireUser(request, writers);
      const p = getPost(b.id, u);
      if (p.version !== b.version) fail(409, "Content has changed.");
      if (p.status !== "trash") fail(400, "Move to trash terlebih dahulu.");
      if (settings().homepage === p.id)
        fail(400, "Change the homepage before deleting this page.");
      db.prepare("DELETE FROM posts WHERE id=?").run(b.id);
    } else if (r === "media") {
      requireUser(request, [...editors, "author"]);
      const m = db.prepare("SELECT author_id FROM media WHERE id=?").get(b.id);
      if (!m) fail(404, "Media not found.");
      if (!editors.includes(u.role) && m.author_id !== u.id)
        fail(403, "Access denied.");
      const needle = `%/media/${b.id}%`;
      if (
        db
          .prepare(
            "SELECT id FROM posts WHERE featured_id=? OR blocks LIKE ? LIMIT 1",
          )
          .get(b.id, needle)
      )
        fail(
          409,
          "This media is still used in content. Remove its references before deleting.",
        );
      db.prepare("DELETE FROM media WHERE id=?").run(b.id);
    } else if (r === "terms") {
      requireUser(request, editors);
      db.transaction(() => {
        for (const p of db.prepare("SELECT * FROM posts").all()) {
          const categories = JSON.parse(p.categories).filter((x) => x !== b.id),
            tags = JSON.parse(p.tags).filter((x) => x !== b.id);
          db.prepare(
            "UPDATE posts SET categories=?,tags=?,version=version+1 WHERE id=?",
          ).run(JSON.stringify(categories), JSON.stringify(tags), p.id);
        }
        db.prepare("DELETE FROM terms WHERE id=?").run(b.id);
      });
    } else if (r === "themes") {
      requireUser(request, admin);
      if (settings().activeTheme === b.id)
        fail(400, "The active theme cannot be deleted.");
      db.prepare("DELETE FROM themes WHERE id=?").run(b.id);
    } else if (r === "comments") {
      requireUser(request, editors);
      db.prepare("DELETE FROM comments WHERE id=? AND status='trash'").run(
        b.id,
      );
    } else fail(404, "Endpoint not found.");
    return json({ ok: true });
  });
}
