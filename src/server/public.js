import { llmsGET } from "./discovery.js";
import { seoHead, fallbackDescription } from "./seo.js";
import { homepageSlots } from "./homepage-render.js";
import { getHomepage } from "./homepage-store.js";
import { icon } from "../shared/icons.js";
import { randomUUID } from "node:crypto";
import { services, settings, publicPost, publishDue } from "./database.js";
import {
  currentUser,
  canEdit,
  endpoint,
  sameOrigin,
  text,
  fail,
  rateLimit,
} from "./security.js";
import { renderBlocks, escape } from "./content.js";
import { renderTheme } from "./themes.js";

const htmlResponse = (body, status = 200) => {
  const nonce = randomUUID();
  const motion = body.includes('data-homepage-motion="true"');
  const enhanced =
    motion || body.includes('<script type="application/ld+json">');
  body = body.replaceAll(
    '<script type="application/ld+json">',
    `<script type="application/ld+json" nonce="${nonce}">`,
  );
  return new Response(
    enhanced
      ? body
          .replace(
            "<head>",
            `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'self'; font-src 'self'; img-src 'self' https:; form-action 'self'; base-uri 'none'">`,
          )
          .replace(
            "</body>",
            `${motion ? `<script nonce="${nonce}" src="/homepage-motion.js?v=2" defer></script>` : ""}</body>`,
          )
      : body,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": `default-src 'none'; ${enhanced ? `script-src 'nonce-${nonce}'; ` : ""}style-src 'self'; font-src 'self'; img-src 'self' https:; form-action 'self'; base-uri 'none'; frame-ancestors 'self'`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  );
};
function viewPost(p, terms) {
  const { db } = services(),
    media = p.featured_id
      ? db.prepare("SELECT id,alt FROM media WHERE id=?").get(p.featured_id)
      : null;
  return {
    ...p,
    category:
      terms.find((t) => p.categories.includes(t.id))?.name ||
      (p.type === "page" ? "Page" : "Journal"),
    date: new Date(p.publish_at || p.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    image: media ? `/media/${media.id}` : "",
    imageAlt: media?.alt || "",
    author:
      db.prepare("SELECT name FROM profiles WHERE id=?").get(p.author_id)
        ?.name || "",
    readingTime: settings().plugins.includes("reading-time")
      ? Math.max(
          1,
          Math.ceil(
            p.blocks
              .map((b) => b.content)
              .join(" ")
              .split(/\s+/).length / 200,
          ),
        )
      : null,
  };
}
function document(
  title,
  description,
  body,
  path,
  preview = false,
  site = settings(),
  seo = {},
) {
  const origin = process.env.CMS_ORIGIN || "http://127.0.0.1:3118";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${seoHead({ title, description, path, site, preview, ...seo })}<link rel="stylesheet" href="/theme-style${preview ? "?preview=" + encodeURIComponent(site.activeTheme) : ""}"><link rel="stylesheet" href="/components.css?v=seo-comments-3"><link rel="alternate" type="application/rss+xml" title="RSS" href="/feed"></head><body${site.homepageMotion ? ` data-homepage-motion="true" data-animation="${escape(site.homepageMotion.animation)}" data-parallax="${escape(site.homepageMotion.parallax)}"` : ""}>${preview ? '<div class="preview-banner">Preview · Your public site is unchanged. <a href="/admin#themes">Back to themes</a></div>' : ""}${body}</body></html>`;
}
export function loadPublic(request, { params, archive = false }) {
  if (params?.slug === "llms.txt") return llmsGET();
  return endpoint(() => {
    const { db } = services();
    publishDue();
    const url = new URL(request.url),
      site = settings(),
      user = currentUser(request),
      preview = url.searchParams.has("preview");
    if (preview && !user) fail(401, "Sign in to view previews.");
    if (url.searchParams.get("theme")) {
      if (user?.role !== "administrator") fail(403, "Access denied.");
      site.activeTheme = url.searchParams.get("theme");
    }
    const themeRow = db
      .prepare("SELECT manifest FROM themes WHERE id=?")
      .get(site.activeTheme);
    if (!themeRow) fail(404, "Theme not found.");
    const theme = JSON.parse(themeRow.manifest);
    if (theme.homepage) site.homepageMotion = getHomepage(theme).data.design;
    const slots = homepageSlots(theme, site, preview, url);
    if (
      theme.homepage &&
      !archive &&
      !params?.slug &&
      (preview || !site.homepage)
    ) {
      const { data } = getHomepage(theme),
        hero = data.sections.hero?.values || {},
        brand = data.sections.header?.values.brand || site.title;
      return htmlResponse(
        document(
          [hero.title, hero.highlight].filter(Boolean).join(" ") || brand,
          hero.description || site.tagline,
          renderTheme(theme.home, { site, ...slots }),
          url.pathname,
          preview,
          { ...site, title: brand },
        ),
      );
    }
    const terms = db.prepare("SELECT * FROM terms").all();
    let row = params?.slug
      ? db.prepare("SELECT * FROM posts WHERE slug=?").get(params.slug)
      : site.homepage && !archive
        ? db.prepare("SELECT * FROM posts WHERE id=?").get(site.homepage)
        : null;
    if (params?.slug && !row)
      return htmlResponse(
        document(
          "Not found",
          "Page not found.",
          '<main class="single"><h1>Page not found.</h1><a href="/">Back to home</a></main>',
          url.pathname,
          true,
        ),
        404,
      );
    if (row) {
      const post = publicPost(row);
      const isPublic =
        post.status === "published" && post.visibility === "public";
      if (!isPublic && (!preview || !user || !canEdit(user, post)))
        return htmlResponse(
          document(
            "Not found",
            "",
            '<main class="single"><h1>Page not found.</h1><a href="/">Back to home</a></main>',
            url.pathname,
            true,
          ),
          404,
        );
      const comments = db
        .prepare(
          "SELECT name,body,created_at FROM comments WHERE post_id=? AND status='approved' ORDER BY created_at LIMIT 200",
        )
        .all(post.id);
      const commentsHTML =
        post.comments_open && !site.hideComments
          ? `<section class="comments"><h2>Conversation (${comments.length})</h2>${comments.map((c) => `<article class="comment"><header class="comment-person"><span class="comment-avatar" aria-hidden="true">${escape(c.name.trim().slice(0, 1).toUpperCase())}</span><div><strong>${escape(c.name)}</strong><time datetime="${escape(c.created_at)}">${escape(new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }))}</time></div></header><p class="comment-text">${escape(c.body)}</p></article>`).join("")}${url.searchParams.has("comment") ? '<p class="notice">Thank you. Your comment is awaiting moderation.</p>' : ""}${site.allowComments && isPublic && !preview ? `<section class="comment-form"><h3 class="comment-heading">${icon("comments")} Leave a comment</h3><p>Join the conversation. Your email stays private, and comments are reviewed before publication.</p><form method="post" action="/api/comments"><input type="hidden" name="postId" value="${post.id}"><div class="comment-fields"><label><span class="comment-label">${icon("person")} Name</span><input autocomplete="name" name="name" required maxlength="100"></label><label><span class="comment-label">${icon("email")} Email (not published)</span><input autocomplete="email" name="email" type="email" required maxlength="254"></label></div><label><span class="comment-label">${icon("edit")} Comment</span><textarea name="body" required maxlength="4000"></textarea></label><button type="submit">${icon("arrow")} Submit comment</button></form></section>` : ""}</section>`
          : "";
      return htmlResponse(
        document(
          post.title,
          fallbackDescription(post),
          renderTheme(theme.single, {
            ...slots,
            site,
            menu: site.menu,
            post: viewPost(post, terms),
            content:
              (theme.single.includes("{{post.author}}")
                ? ""
                : `<p class="article-byline">By ${escape(viewPost(post, terms).author)} · <time datetime="${escape(post.publish_at || post.created_at)}">${escape(viewPost(post, terms).date)}</time></p>`) +
              renderBlocks(post.blocks, site.plugins),
            comments: commentsHTML,
          }),
          url.pathname,
          preview || !isPublic,
          site,
          {
            post,
            image: viewPost(post, terms).image,
            imageAlt: viewPost(post, terms).imageAlt,
            author: viewPost(post, terms).author,
            path: site.homepage === post.id ? "/" : url.pathname,
          },
        ),
      );
    }
    const query = (url.searchParams.get("q") || "").slice(0, 200),
      term = url.searchParams.get("term"),
      page = Math.max(
        1,
        Math.min(100000, Number.parseInt(url.searchParams.get("page")) || 1),
      ),
      size = site.postsPerPage;
    const q = query.replace(/[\\%_]/g, "\\$&");
    let posts = db
      .prepare(
        "SELECT * FROM posts WHERE status='published' AND visibility='public' AND type='post' AND (title LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\') ORDER BY COALESCE(publish_at,created_at) DESC LIMIT 10000",
      )
      .all(`%${q}%`, `%${q}%`)
      .map(publicPost);
    if (term)
      posts = posts.filter(
        (p) => p.categories.includes(term) || p.tags.includes(term),
      );
    const total = posts.length;
    posts = posts.slice((page - 1) * size, page * size).map((p) => ({
      ...viewPost(p, terms),
      href:
        "/" +
        p.slug +
        (preview ? "?preview=1&theme=" + encodeURIComponent(theme.id) : ""),
    }));
    const link = (n) => {
      const s = new URLSearchParams({ page: String(n) });
      if (query) s.set("q", query);
      if (term) s.set("term", term);
      if (preview) {
        s.set("preview", "1");
        s.set("theme", site.activeTheme);
      }
      return (archive ? "/blog?" : "/?") + s;
    };
    return htmlResponse(
      document(
        query
          ? `Search: ${query}`
          : archive
            ? slots.blogTitle || "Blog"
            : site.title,
        archive ? slots.blogDescription || site.tagline : site.tagline,
        renderTheme(archive && theme.archive ? theme.archive : theme.home, {
          ...slots,
          site,
          menu: site.menu,
          posts,
          query,
          preview,
          previous: page > 1 ? link(page - 1) : "",
          next: page * size < total ? link(page + 1) : "",
        }),
        url.pathname,
        preview || !!query || !!term,
        site,
        { page },
      ),
    );
  });
}
export function loadBlog(request) {
  return loadPublic(request, { params: {}, archive: true });
}
export function themeCSS(request) {
  return endpoint(() => {
    const { db } = services(),
      s = settings(),
      id = new URL(request.url).searchParams.get("preview");
    if (
      id &&
      (!currentUser(request) ||
        (id !== s.activeTheme &&
          currentUser(request)?.role !== "administrator"))
    )
      fail(403, "Access denied.");
    const row = db
      .prepare("SELECT manifest FROM themes WHERE id=?")
      .get(id || s.activeTheme);
    if (!row) fail(404, "Theme not found.");
    const t = JSON.parse(row.manifest);
    const design = t.homepage ? getHomepage(t).data.design : null;
    return new Response(
      `@font-face{font-family:Geist;src:url(/fonts/geist-latin.woff2) format("woff2");font-weight:100 900;font-display:swap}:root{--accent:${design?.accent || (id ? t.accent : s.accent)};--theme-bg:${design?.background || t.background};--theme-fg:${design?.foreground || t.foreground};--home-font:${design?.font === "serif" ? "Georgia,serif" : "Geist,Arial,sans-serif"}}${t.css}`,
      {
        headers: {
          "Content-Type": "text/css; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  });
}
export function mediaGET(request, { params }) {
  return endpoint(() => {
    const m = services()
      .db.prepare("SELECT bytes,mime FROM media WHERE id=?")
      .get(params.id);
    if (!m) fail(404, "Media not found.");
    return new Response(m.bytes, {
      headers: {
        "Content-Type": m.mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  });
}
export function commentPOST(request) {
  return endpoint(async () => {
    sameOrigin(request);
    const { db } = services(),
      f = await request.formData(),
      p = db
        .prepare(
          "SELECT id,slug,comments_open FROM posts WHERE id=? AND status='published' AND visibility='public'",
        )
        .get(String(f.get("postId")));
    const site = settings();
    if (!p || !p.comments_open || !site.allowComments || site.hideComments)
      fail(403, "Comments are closed.");
    const email = text(String(f.get("email") || ""), 254, true).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Invalid email.");
    rateLimit("comment:global", 100);
    rateLimit("comment:" + email, 3);
    db.prepare("INSERT INTO comments VALUES (?,?,?,?,?,?,?)").run(
      randomUUID(),
      p.id,
      text(String(f.get("name") || ""), 100, true),
      email,
      text(String(f.get("body") || ""), 4000, true),
      "pending",
      new Date().toISOString(),
    );
    return new Response(null, {
      status: 303,
      headers: { Location: `/${p.slug}?comment=pending` },
    });
  });
}
export function sitemap() {
  publishDue();
  return services()
    .db.prepare(
      "SELECT slug,updated_at FROM posts WHERE status='published' AND visibility='public' AND COALESCE(json_extract(seo,'$.noindex'),0)=0",
    )
    .all()
    .map((p) => ({ params: { slug: p.slug }, lastModified: p.updated_at }));
}
export function feedGET() {
  const s = settings(),
    origin = process.env.CMS_ORIGIN || "http://127.0.0.1:3118";
  publishDue();
  const posts = services()
    .db.prepare(
      "SELECT * FROM posts WHERE status='published' AND visibility='public' AND type='post' AND COALESCE(json_extract(seo,'$.noindex'),0)=0 ORDER BY COALESCE(publish_at,created_at) DESC LIMIT 30",
    )
    .all();
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(s.title)}</title><link>${escape(origin)}</link><description>${escape(s.tagline)}</description>${posts.map((p) => `<item><title>${escape(p.title)}</title><link>${escape(origin + "/" + p.slug)}</link><guid>${escape(origin + "/" + p.slug)}</guid><description>${escape(p.excerpt)}</description><pubDate>${new Date(p.publish_at || p.created_at).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
