import { styleOptions, devices, renderBuilder } from "../shared/builder.js";
import { validateLayout } from "./builder.js";
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
  let count = 0;
  function walk(list, depth = 0) {
    if (!Array.isArray(list) || depth > 5)
      fail(400, "Sections support up to five nesting levels.");
    return list.map((b) => {
      if (++count > 200)
        fail(400, "Up to 200 blocks are allowed, including nested blocks.");
      if (
        !b ||
        ![
          "section",
          "spacer",
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
        level: [1, 2, 3, 4, 5, 6].includes(b.level) ? b.level : 2,
      };
      if (v.type === "html") v.content = cleanHTML(v.content);
      if (b.type === "section") v.children = walk(b.children || [], depth + 1);
      if (b.styles !== undefined) {
        if (
          !b.styles ||
          typeof b.styles !== "object" ||
          Array.isArray(b.styles)
        )
          fail(400, "Invalid block styles.");
        v.styles = {};
        for (const [device, styles] of Object.entries(b.styles)) {
          if (
            !devices.includes(device) ||
            !styles ||
            typeof styles !== "object" ||
            Array.isArray(styles)
          )
            fail(400, "Invalid responsive styles.");
          v.styles[device] = {};
          for (const [key, value] of Object.entries(styles)) {
            if (
              !Object.hasOwn(styleOptions, key) ||
              !styleOptions[key].includes(value)
            )
              fail(400, "Unsupported style value.");
            v.styles[device][key] = value;
          }
        }
      }
      return v;
    });
  }
  const validated = walk(blocks);
  if (JSON.stringify(validated).length > 300000)
    fail(400, "Content is too large.");
  return validated;
}
export function validatePostSEO(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(400, "Invalid SEO settings.");
  const canonical = text(value.canonical || "", 2000);
  if (canonical) {
    let url;
    try {
      url = new URL(canonical);
    } catch {
      fail(400, "Enter a valid canonical URL.");
    }
    if (url.protocol !== "https:" || url.username || url.password || url.hash)
      fail(
        400,
        "Canonical URLs must use HTTPS without credentials or fragments.",
      );
  }
  if (value.noindex !== undefined && typeof value.noindex !== "boolean")
    fail(400, "Invalid indexing setting.");
  return {
    title: text(value.title || "", 120),
    description: text(value.description || "", 320),
    canonical,
    noindex: value.noindex === true,
  };
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
    layout: validateLayout(b.layout ?? old?.layout ?? "theme"),
    seo: validatePostSEO(b.seo ?? old?.seo ?? {}),
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
    db.prepare("UPDATE posts SET seo=?,layout=? WHERE id=?").run(
      JSON.stringify(p.seo),
      p.layout,
      id,
    );
  };
  if (inTransaction) persist();
  else db.transaction(persist);
  return publicPost(db.prepare("SELECT * FROM posts WHERE id=?").get(id));
}
export function renderBlocks(blocks, plugins = []) {
  const toc = [];
  let html = renderBuilder(blocks, { cleanHTML, toc });
  if (plugins.includes("table-of-contents") && toc.length)
    html =
      `<aside class="toc"><strong>In this article</strong><ol>${toc.join("")}</ol></aside>` +
      html;
  return `<div class="pb-root"><div class="pb-content">${html}</div></div>`;
}
