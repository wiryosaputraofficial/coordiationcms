import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  builtInThemes,
  validTheme,
  packTheme,
  unpackTheme,
} from "../src/server/themes.js";

const directory = mkdtempSync(join(tmpdir(), "coordiation-cms-test-"));
const origin = "http://127.0.0.1:3118",
  base = "http://127.0.0.1:3319";
let server,
  cookie = "",
  authorCookie = "",
  contributorCookie = "",
  subscriberCookie = "",
  post,
  term,
  media,
  authorId;
const password = "Test only password 2026!";
async function req(
  path,
  method = "GET",
  body,
  session = cookie,
  requestOrigin = origin,
) {
  const headers = {};
  if (session) headers.cookie = session;
  if (!["GET", "HEAD"].includes(method)) headers.Origin = requestOrigin;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  return fetch(base + path, {
    method,
    headers,
    body: payload,
    redirect: "manual",
  });
}
async function api(path, method = "GET", body, session = cookie) {
  const r = await req("/api/cms/" + path, method, body, session);
  const data = await r.json();
  assert.ok(r.ok, JSON.stringify(data));
  return data;
}
before(async () => {
  const build = JSON.parse(readFileSync(".coordiation/app-build.json", "utf8"));
  server = spawn(process.execPath, [join(build.directory, "start.js")], {
    env: {
      ...process.env,
      PORT: "3319",
      HOST: "127.0.0.1",
      CMS_DATABASE: join(directory, "test.sqlite"),
      CMS_SETUP_TOKEN: "test-setup-token",
      CMS_ADMIN_EMAIL: "admin@example.com",
      CMS_SECURE_COOKIES: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let error = "";
  server.stderr.on("data", (c) => (error += c));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/api/health")).ok) return;
    } catch {}
    if (server.exitCode !== null) throw new Error(error);
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Server startup failed: " + error);
});
after(async () => {
  server.kill("SIGTERM");
  await once(server, "exit");
  rmSync(directory, { recursive: true, force: true });
});
test("unauthenticated admin redirects and API denies access", async () => {
  assert.equal((await req("/admin")).status, 302);
  assert.equal((await req("/api/cms/posts")).status, 401);
});
test("installer requires valid token", async () => {
  assert.equal(
    (
      await req("/api/auth/setup", "POST", {
        email: "admin@example.com",
        password,
        name: "Admin",
        title: "Test",
        token: "wrong",
      })
    ).status,
    403,
  );
});
test("setup creates one administrator and persists session", async () => {
  const r = await req("/api/auth/setup", "POST", {
    email: "admin@example.com",
    password,
    name: "Test Admin",
    title: "Test Journal",
    token: "test-setup-token",
    demo: true,
  });
  assert.equal(r.status, 200, await r.clone().text());
  cookie = r.headers.get("set-cookie").split(";")[0];
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  assert.equal((await req("/api/auth/setup", "POST", {})).status, 403);
  assert.equal((await req("/admin")).status, 200);
});
test("admin assets and dashboard render through compiled Coordiation runtime", async () => {
  const h = await (await req("/admin")).text();
  assert.match(h, /cms-shell/);
  assert.match(h, /_co\/r/);
  const d = await api("dashboard");
  assert.equal(d.user.role, "administrator");
  assert.equal(d.recent.length, 2);
});
test("same-origin CSRF is enforced", async () => {
  const r = await req(
    "/api/cms/settings",
    "POST",
    { title: "Attacker" },
    cookie,
    "https://evil.example",
  );
  assert.equal(r.status, 403);
  assert.equal((await api("settings")).title, "Test Journal");
});
test("taxonomy and post creation with safe structured blocks", async () => {
  term = await api("terms", "POST", { kind: "category", name: "Design" });
  post = await api("posts", "POST", {
    title: "A new article",
    slug: "new-article",
    categories: [term.id],
    status: "draft",
    blocks: [
      { type: "heading", content: "Introduction" },
      { type: "paragraph", content: "<script>alert(1)</script> Hello readers" },
    ],
  });
  assert.equal(post.version, 1);
  assert.equal(post.status, "draft");
});
test("drafts are private in public route, RSS and sitemap", async () => {
  assert.equal((await req("/new-article", "GET", undefined, "")).status, 404);
  assert.doesNotMatch(await (await req("/feed")).text(), /new-article/);
  assert.doesNotMatch(await (await req("/sitemap.xml")).text(), /new-article/);
  assert.equal((await req("/new-article?preview=1")).status, 200);
  assert.equal(
    (await req("/new-article?preview=1", "GET", undefined, "")).status,
    401,
  );
});
test("optimistic version checks reject stale updates and store revisions", async () => {
  post = await api("posts", "POST", {
    ...post,
    title: "Updated article",
    status: "published",
  });
  assert.equal(post.version, 2);
  const r = await req("/api/cms/posts", "POST", {
    ...post,
    version: 1,
    title: "Stale",
  });
  assert.equal(r.status, 409);
  const detail = await api("posts?id=" + post.id);
  assert.equal(detail.revisions.length, 1);
  assert.equal(detail.post.title, "Updated article");
});
test("published content is SSR, escaped, included in RSS and sitemap", async () => {
  const r = await req("/new-article", "GET", undefined, "");
  assert.equal(r.status, 200);
  const h = await r.text();
  assert.match(h, /Updated article/);
  assert.doesNotMatch(h, /<script>alert/);
  assert.match(h, /&lt;script&gt;/);
  assert.match(h, /Content|article-body/);
  assert.match(await (await req("/sitemap.xml")).text(), /new-article/);
  assert.match(await (await req("/feed")).text(), /new-article/);
});
test("autosave remains separate from publication and can be retrieved", async () => {
  await api("autosave", "POST", { ...post, title: "Autosaved title" });
  const data = await api("posts?id=" + post.id);
  assert.equal(JSON.parse(data.autosave.snapshot).title, "Autosaved title");
  assert.equal(data.post.title, "Updated article");
});
test("revision restore preserves history", async () => {
  const detail = await api("posts?id=" + post.id);
  post = await api("restore", "POST", {
    id: post.id,
    revision: detail.revisions[0].id,
    version: post.version,
  });
  assert.equal(post.title, "A new article");
  assert.equal(post.version, 3);
  post = await api("posts", "POST", { ...post, status: "published" });
});
test("media upload rejects active content and stores valid image bytes", async () => {
  const invalid = new FormData();
  invalid.append(
    "file",
    new Blob(['<svg onload="alert(1)"></svg>'], { type: "image/svg+xml" }),
    "bad.svg",
  );
  assert.equal((await req("/api/cms/media", "POST", invalid)).status, 400);
  const valid = new FormData();
  valid.append(
    "file",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "pixel.png",
  );
  media = await api("media", "POST", valid);
  const r = await req(media.url);
  assert.equal(r.headers.get("content-type"), "image/png");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
});
test("media metadata and in-use deletion protection", async () => {
  await api("media-meta", "POST", {
    id: media.id,
    alt: "Pixel",
    caption: "A tiny image",
  });
  post = await api("posts", "POST", { ...post, featured_id: media.id });
  assert.equal(
    (await req("/api/cms/media", "DELETE", { id: media.id })).status,
    409,
  );
  assert.match(await (await req("/new-article")).text(), /alt="Pixel"/);
});
test("three theme packages validate and round trip", () => {
  for (const theme of builtInThemes) {
    assert.equal(theme.cmsVersion, "1");
    assert.ok(!("cmsVersionon" in theme));
    validTheme(theme);
    assert.deepEqual(unpackTheme(packTheme(theme)), validTheme(theme));
  }
});
test("theme packages reject scripts in CSS and unsupported helpers", () => {
  assert.throws(() =>
    validTheme({ ...builtInThemes[0], css: '@import "https://evil.example";' }),
  );
  assert.throws(() => validTheme({ ...builtInThemes[0], home: "{{> evil}}" }));
  assert.throws(() =>
    validTheme({ ...builtInThemes[0], home: '{{lookup this "constructor"}}' }),
  );
});
test("theme installation, activation, CSS, preview and ZIP export work", async () => {
  const t = {
    ...builtInThemes[0],
    id: "test-theme",
    name: "Test theme",
    accent: "#112233",
    home: "<main><h1>Custom theme {{site.title}}</h1><script>alert(1)</script></main>",
  };
  const f = new FormData();
  f.append("file", new Blob([packTheme(t)]), "test.zip");
  await api("install-theme", "POST", f);
  const preview = await (await req("/?preview=1&theme=test-theme")).text();
  assert.match(preview, /Custom theme/);
  assert.doesNotMatch(preview, /<script/);
  await api("themes", "POST", { id: t.id });
  assert.match(await (await req("/")).text(), /Custom theme/);
  assert.match(await (await req("/theme-style")).text(), /#112233/);
  assert.equal(
    (await req("/api/cms/themes?export=test-theme")).headers.get(
      "content-type",
    ),
    "application/zip",
  );
  await api("themes", "POST", { id: "folio" });
});
test("settings and menus reject unsafe values atomically", async () => {
  assert.equal(
    (
      await req("/api/cms/settings", "POST", {
        title: "Must not persist",
        menu: [{ label: "Bad", href: "javascript:alert(1)" }],
      })
    ).status,
    400,
  );
  assert.equal((await api("settings")).title, "Test Journal");
  await api("settings", "POST", {
    menu: [
      { label: "Home", href: "/" },
      { label: "Read", href: "/new-article" },
    ],
  });
  assert.match(await (await req("/")).text(), /href="\/new-article"/);
});
test("built-in plugins change article output", async () => {
  await api("settings", "POST", {
    plugins: ["reading-time", "table-of-contents"],
  });
  const h = await (await req("/new-article")).text();
  assert.match(h, /min read/);
  assert.match(h, /In this article/);
});
test("public comments remain moderated, then appear when approved", async () => {
  const f = new URLSearchParams({
    postId: post.id,
    name: "Reader",
    email: "reader@example.com",
    body: "A useful article.",
  });
  const r = await fetch(base + "/api/comments", {
    method: "POST",
    headers: { Origin: origin },
    body: f,
    redirect: "manual",
  });
  assert.equal(r.status, 303);
  assert.doesNotMatch(
    await (await req("/new-article")).text(),
    /A useful article/,
  );
  const comments = await api("comments");
  assert.equal(comments[0].status, "pending");
  await api("comments", "POST", { id: comments[0].id, status: "approved" });
  assert.match(await (await req("/new-article")).text(), /A useful article/);
});
test("hide comments preserves moderation records and blocks submissions across posts and pages", async () => {
  const page = await api("posts", "POST", {
    type: "page",
    title: "Discussion page",
    slug: "discussion-page",
    status: "published",
    visibility: "public",
    blocks: [],
    categories: [],
    tags: [],
    comments_open: true,
  });
  const before = await api("comments");
  await api("settings", "POST", { hideComments: true });
  assert.equal((await api("settings")).hideComments, true);
  for (const item of [post, page]) {
    const html = await (await req("/" + item.slug)).text();
    assert.doesNotMatch(
      html,
      /Conversation \(|Leave a comment|A useful article/,
    );
    const response = await fetch(base + "/api/comments", {
      method: "POST",
      headers: { Origin: origin },
      body: new URLSearchParams({
        postId: item.id,
        name: "Reader",
        email: "hidden@example.com",
        body: "Blocked",
      }),
      redirect: "manual",
    });
    assert.equal(response.status, 403);
  }
  assert.deepEqual(await api("comments"), before);
  assert.equal(
    (await req("/api/cms/settings", "POST", { hideComments: "false" })).status,
    400,
  );
  await api("settings", "POST", { hideComments: false, allowComments: false });
  let html = await (await req("/new-article")).text();
  assert.match(html, /A useful article/);
  assert.doesNotMatch(html, /Leave a comment/);
  await api("settings", "POST", { allowComments: true });
  html = await (await req("/new-article")).text();
  assert.match(html, /Leave a comment/);
});
test("public themes render reusable Coordiation form and card components", async () => {
  for (const theme of builtInThemes) {
    await api("themes", "POST", { id: theme.id });
    const home = await (await req("/")).text();
    assert.match(home, /pc-input/);
    assert.match(home, /pc-button/);
    assert.match(home, /pc-card/);
    assert.match(home, /co-rounded-md/);
    assert.match(home, /href="\/components.css"/);
    const article = await (await req("/new-article")).text();
    assert.match(article, /pc-textarea/);
    assert.match(article, /comment-fields/);
    assert.match(article, /name="postId"/);
  }
  await api("themes", "POST", { id: "folio" });
  const css = await req("/components.css");
  assert.equal(css.status, 200);
  assert.match(await css.text(), /\.pc-input/);
});
test("administrator creates authors, contributors and subscribers", async () => {
  for (const role of ["author", "contributor", "subscriber"])
    await api("users", "POST", {
      name: role,
      email: role + "@example.com",
      password,
      role,
    });
  const users = await api("users");
  authorId = users.find((u) => u.role === "author").id;
  assert.equal(users.length, 4);
  for (const role of ["author", "contributor", "subscriber"]) {
    const r = await req(
      "/api/auth/login",
      "POST",
      { email: role + "@example.com", password },
      "",
    );
    assert.equal(r.status, 200);
    const c = r.headers.get("set-cookie").split(";")[0];
    if (role === "author") authorCookie = c;
    else if (role === "contributor") contributorCookie = c;
    else subscriberCookie = c;
  }
});
test("roles block settings, other authors content, pages and publishing", async () => {
  assert.equal(
    (await req("/api/cms/settings", "GET", undefined, authorCookie)).status,
    403,
  );
  assert.equal(
    (await req("/api/cms/posts?id=" + post.id, "GET", undefined, authorCookie))
      .status,
    403,
  );
  assert.equal(
    (
      await req(
        "/api/cms/posts",
        "POST",
        { title: "Forbidden page", type: "page" },
        authorCookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await req(
        "/api/cms/posts",
        "POST",
        { title: "Forbidden publish", status: "published" },
        contributorCookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (await req("/api/cms/posts", "GET", undefined, subscriberCookie)).status,
    403,
  );
  assert.equal(
    (await req("/api/cms/users", "GET", undefined, authorCookie)).status,
    403,
  );
});
test("author can publish own post; contributor can submit for review", async () => {
  const a = await api(
    "posts",
    "POST",
    { title: "Author post", status: "published" },
    authorCookie,
  );
  assert.equal(a.author_id, authorId);
  const c = await api(
    "posts",
    "POST",
    { title: "Contributor post", status: "pending" },
    contributorCookie,
  );
  assert.equal(c.status, "pending");
});
test("scheduled posts publish on next request after due time", async () => {
  const scheduled = await api("posts", "POST", {
    title: "Scheduled article",
    status: "scheduled",
    publish_at: new Date(Date.now() + 400).toISOString(),
  });
  assert.equal(
    (await req("/" + scheduled.slug, "GET", undefined, "")).status,
    404,
  );
  await new Promise((r) => setTimeout(r, 450));
  assert.equal(
    (await req("/" + scheduled.slug, "GET", undefined, "")).status,
    200,
  );
});
test("native JSON export and atomic import preserve taxonomy", async () => {
  const exported = await api("export");
  assert.equal(exported.format, "coordiation-content");
  const copy = {
    ...exported,
    posts: [{ ...post, title: "Imported content", slug: "imported-content" }],
  };
  const result = await api("import", "POST", {
    format: "coordiation",
    content: JSON.stringify(copy),
  });
  assert.equal(result.count, 1);
  const imported = (await api("posts")).find(
    (p) => p.slug === "imported-content",
  );
  assert.deepEqual(imported.categories, [term.id]);
});
test("WordPress WXR imports content without executing HTML", async () => {
  const xml =
    '<rss xmlns:wp="https://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>From WordPress</title><wp:post_type>post</wp:post_type><wp:status>publish</wp:status><wp:post_name>from-wordpress</wp:post_name><content:encoded><![CDATA[<p>Imported body</p><script>alert(1)</script>]]></content:encoded></item></channel></rss>';
  assert.equal(
    (await api("import", "POST", { format: "wordpress", content: xml })).count,
    1,
  );
  const h = await (await req("/from-wordpress")).text();
  assert.match(h, /Imported body/);
  assert.doesNotMatch(h, /alert\(1\)/);
});
test("invalid import rolls back all records", async () => {
  const before = (await api("posts")).length;
  const result = await req("/api/cms/import", "POST", {
    format: "coordiation",
    content: JSON.stringify({
      format: "coordiation-content",
      version: 1,
      posts: [
        { title: "Roll back", slug: "rollback" },
        { title: "", slug: "invalid" },
      ],
    }),
  });
  assert.equal(result.status, 400);
  assert.equal((await api("posts")).length, before);
});
test("trash, restore, and permanent delete are separate operations", async () => {
  let p = await api("posts", "POST", { title: "Trash lifecycle" });
  assert.equal(
    (await req("/api/cms/posts", "DELETE", { id: p.id, version: p.version }))
      .status,
    400,
  );
  p = await api("posts", "POST", { ...p, status: "trash" });
  p = await api("posts", "POST", { ...p, status: "draft" });
  p = await api("posts", "POST", { ...p, status: "trash" });
  await api("posts", "DELETE", { id: p.id, version: p.version });
  assert.equal((await req("/api/cms/posts?id=" + p.id)).status, 404);
});
test("theme authoring creates a sellable variant and enforces admin access", async () => {
  const source = await api("theme-source?id=folio");
  assert.equal(source.id, "folio");
  const theme = { ...source, id: "authored-theme", name: "Authored theme" };
  await api("theme-source", "POST", { theme, update: false });
  theme.css += "h1{letter-spacing:0}";
  await api("theme-source", "POST", { theme, update: true });
  assert.match(
    (await api("theme-source?id=authored-theme")).css,
    /letter-spacing:0/,
  );
  assert.equal(
    (
      await req(
        "/api/cms/theme-source",
        "POST",
        { theme, update: true },
        authorCookie,
      )
    ).status,
    403,
  );
});
test("password change verifies current password and revokes sessions", async () => {
  const r = await req(
    "/api/cms/password",
    "POST",
    { current: password, password: "Changed test password 2026!" },
    authorCookie,
  );
  assert.equal(r.status, 200);
  assert.equal(
    (await req("/api/cms/dashboard", "GET", undefined, authorCookie)).status,
    401,
  );
  const login = await req(
    "/api/auth/login",
    "POST",
    { email: "author@example.com", password: "Changed test password 2026!" },
    "",
  );
  assert.equal(login.status, 200);
});
test("theme parser rejects nested loops that could amplify rendering", () => {
  assert.throws(() =>
    validTheme({
      ...builtInThemes[0],
      home: "{{#each posts}}{{#each posts}}x{{/each}}{{/each}}",
    }),
  );
});
test("logout revokes cookie and last administrator cannot be demoted", async () => {
  const admin = (await api("users")).find((u) => u.role === "administrator");
  assert.equal(
    (
      await req("/api/cms/users", "POST", {
        id: admin.id,
        name: admin.name,
        role: "author",
      })
    ).status,
    400,
  );
  assert.equal((await req("/api/auth/logout", "POST")).status, 200);
  assert.equal((await req("/api/cms/dashboard")).status, 401);
});
