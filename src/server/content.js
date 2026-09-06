import { randomUUID } from "node:crypto";
import { services, publicPost } from "./database.js";
import { text, slug, safeUrl, fail, canEdit, editors } from "./security.js";
import { cleanHTML } from "./themes.js";

export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function validateBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length > 200)
    fail(400, "Up to 200 blocks are allowed.");
  return blocks.map((b) => {
    if (
      !b ||
      ![
        "paragraph",
        "heading",
        "image",
        "quote",
        "list",
        "code",
        "divider",
        "button",
        "html",
      ].includes(b.type)
    )
      fail(400, "Unsupported block type.");
    const v = {
      type: b.type,
      content: text(b.content || "", 20000),
      url: safeUrl(b.url || ""),
      alt: text(b.alt || "", 500),
      caption: text(b.caption || "", 1000),
      level: b.level === 3 ? 3 : 2,
    };
    if (v.type === "html") v.content = cleanHTML(v.content);
    return v;
  });
}
export function validatePost(b, user, old) {
  const type = b.type || old?.type || "post";
  if (!["post", "page"].includes(type)) fail(400, "Invalid content type.");
  if (type === "page" && !editors.includes(user.role))
    fail(403, "Only editors can manage pages.");
  const status = b.status || "draft";
  if (!["draft", "pending", "published", "scheduled", "trash"].includes(status))
    fail(400, "Invalid status.");
  if (
    user.role === "contributor" &&
    !["draft", "pending", "trash"].includes(status)
  )
    fail(403, "Contributors can only submit content for review.");
  const visibility = b.visibility || "public";
  if (!["public", "private"].includes(visibility))
    fail(400, "Invalid visibility.");
  const publish_at = b.publish_at ? new Date(b.publish_at).toISOString() : null;
  if (
    status === "scheduled" &&
    (!publish_at || Date.parse(publish_at) <= Date.now())
  )
    fail(400, "Choose a future publication time.");
  const termList = (value, kind) => {
    if (!Array.isArray(value) || value.length > 30)
      fail(400, "Invalid taxonomy.");
    return value.map((id) => {
      if (
        !services()
          .db.prepare("SELECT id FROM terms WHERE id=? AND kind=?")
          .get(id, kind)
      )
        fail(400, "Category or tag not found.");
      return id;
    });
  };
  const featured_id = b.featured_id || null;
  if (
    featured_id &&
    !services().db.prepare("SELECT id FROM media WHERE id=?").get(featured_id)
  )
    fail(400, "Media not found.");
  return {
    type,
    title: text(b.title, 250, true),
    slug: slug(b.slug || b.title),
    excerpt: text(b.excerpt || "", 1000),
    blocks: validateBlocks(b.blocks || []),
    status,
    visibility,
    featured_id,
    categories: termList(b.categories || [], "category"),
    tags: termList(b.tags || [], "tag"),
    comments_open: b.comments_open === false ? 0 : 1,
    publish_at,
  };
}
export function savePost(b, user, inTransaction = false) {
  const { db } = services();
  const old = b.id
    ? publicPost(db.prepare("SELECT * FROM posts WHERE id=?").get(b.id))
    : null;
  if (b.id && !old) fail(404, "Content not found.");
  if (old && !canEdit(user, old)) fail(403, "You cannot edit this content.");
  if (old && old.version !== b.version)
    fail(409, "Content has been updated. Reload to avoid overwriting changes.");
  const p = validatePost(b, user, old);
  const id = old?.id || randomUUID();
  const now = new Date().toISOString();
  const persist = () => {
    if (old) {
      db.prepare("INSERT INTO revisions VALUES (?,?,?,?,?)").run(
        randomUUID(),
        id,
        JSON.stringify(old),
        now,
        user.id,
      );
      db.prepare(
        "DELETE FROM revisions WHERE post_id=? AND id NOT IN (SELECT id FROM revisions WHERE post_id=? ORDER BY created_at DESC LIMIT 50)",
      ).run(id, id);
      const r = db
        .prepare(
          "UPDATE posts SET type=?,title=?,slug=?,excerpt=?,blocks=?,status=?,visibility=?,featured_id=?,categories=?,tags=?,comments_open=?,publish_at=?,updated_at=?,version=version+1 WHERE id=? AND version=?",
        )
        .run(
          p.type,
          p.title,
          p.slug,
          p.excerpt,
          JSON.stringify(p.blocks),
          p.status,
          p.visibility,
          p.featured_id,
          JSON.stringify(p.categories),
          JSON.stringify(p.tags),
          p.comments_open,
          p.publish_at,
          now,
          id,
          b.version,
        );
      if (!r.changes) fail(409, "Content has already changed.");
      db.prepare("DELETE FROM autosaves WHERE post_id=? AND author_id=?").run(
        id,
        user.id,
      );
    } else
      db.prepare(
        "INSERT INTO posts(id,type,title,slug,excerpt,blocks,status,visibility,author_id,featured_id,categories,tags,comments_open,publish_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        p.type,
        p.title,
        p.slug,
        p.excerpt,
        JSON.stringify(p.blocks),
        p.status,
        p.visibility,
        user.id,
        p.featured_id,
        JSON.stringify(p.categories),
        JSON.stringify(p.tags),
        p.comments_open,
        p.publish_at,
        now,
        now,
      );
  };
  if (inTransaction) persist();
  else db.transaction(persist);
  return publicPost(db.prepare("SELECT * FROM posts WHERE id=?").get(id));
}
export function renderBlocks(blocks, plugins = []) {
  let heading = 0;
  const toc = [];
  let html = blocks
    .map((b) => {
      const value = escape(b.content).replace(/\n/g, "<br>");
      switch (b.type) {
        case "heading": {
          const id = `section-${++heading}`;
          toc.push(`<li><a href="#${id}">${value}</a></li>`);
          return `<h${b.level || 2} id="${id}">${value}</h${b.level || 2}>`;
        }
        case "paragraph":
          return `<p>${value}</p>`;
        case "quote":
          return `<blockquote>${value}</blockquote>`;
        case "list":
          return `<ul>${b.content
            .split("\n")
            .filter(Boolean)
            .map((x) => `<li>${escape(x)}</li>`)
            .join("")}</ul>`;
        case "code":
          return `<pre><code>${escape(b.content)}</code></pre>`;
        case "image":
          return `<figure><img src="${escape(b.url)}" alt="${escape(b.alt)}" loading="lazy"><figcaption>${escape(b.caption)}</figcaption></figure>`;
        case "button":
          return `<p><a class="button" href="${escape(b.url)}">${value}</a></p>`;
        case "divider":
          return "<hr>";
        case "html":
          return cleanHTML(b.content);
        default:
          return "";
      }
    })
    .join("");
  if (plugins.includes("table-of-contents") && toc.length)
    html =
      `<aside class="toc"><strong>In this article</strong><ol>${toc.join("")}</ol></aside>` +
      html;
  return html;
}
