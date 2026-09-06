import { timingSafeEqual } from "node:crypto";
import { services, setSetting, log } from "./database.js";
import {
  endpoint,
  sameOrigin,
  body,
  fail,
  text,
  currentUser,
} from "./security.js";
import { savePost } from "./content.js";

export function getAuth(request) {
  return endpoint(() =>
    Response.json({
      user: currentUser(request),
      needsSetup: !services()
        .db.prepare("SELECT id FROM profiles LIMIT 1")
        .get(),
      setupProtected: !!process.env.CMS_SETUP_TOKEN,
    }),
  );
}
export function mutateAuth(request, { params }) {
  return endpoint(async () => {
    sameOrigin(request);
    const { auth, db } = services();
    const action = params.action;
    if (action === "logout")
      return Response.json(
        { ok: true },
        { headers: { "Set-Cookie": auth.signOut(request) } },
      );
    const b = await body(request);
    if (action === "login") {
      const result = await auth.signIn({
        email: b.email,
        password: b.password,
      });
      if (
        !db.prepare("SELECT id FROM profiles WHERE id=?").get(result.user.id)
      ) {
        auth.revokeAll(result.user.id);
        fail(403, "This account is inactive.");
      }
      return Response.json(
        { ok: true },
        { headers: { "Set-Cookie": result.cookie } },
      );
    }
    if (action !== "setup") fail(404, "Not found.");
    if (db.prepare("SELECT id FROM profiles LIMIT 1").get())
      fail(403, "Setup is already complete.");
    const expected = process.env.CMS_SETUP_TOKEN;
    if (process.env.CMS_SECURE_COOKIES === "true" && !expected)
      fail(503, "The setup token is not configured.");
    if (expected) {
      const a = Buffer.from(String(b.token || "")),
        e = Buffer.from(expected);
      if (a.length !== e.length || !timingSafeEqual(a, e))
        fail(403, "Invalid setup token.");
    }
    const name = text(b.name, 100, true),
      title = text(b.title, 150, true);
    if (
      process.env.CMS_ADMIN_EMAIL &&
      String(b.email).toLowerCase() !==
        process.env.CMS_ADMIN_EMAIL.toLowerCase()
    )
      fail(403, "Use the configured administrator email.");
    const lock = db
      .prepare("INSERT OR IGNORE INTO settings VALUES (?,?)")
      .run("_setup_lock", JSON.stringify(Date.now()));
    if (!lock.changes) fail(409, "Setup is already in progress.");
    try {
      const result = await auth.signUp({
        email: b.email,
        password: b.password,
      });
      const user = { ...result.user, name, role: "administrator" };
      db.transaction(() => {
        db.prepare("INSERT INTO profiles VALUES (?,?,?)").run(
          user.id,
          name,
          "administrator",
        );
        setSetting("title", title);
      });
      if (b.demo === true) {
        savePost(
          {
            title: "Welcome to your new space",
            slug: "welcome",
            excerpt:
              "Every great story begins with a blank page. This is your first.",
            status: "published",
            blocks: [
              {
                type: "paragraph",
                content:
                  "Welcome to Coordiation CMS. A place to write, publish, and shape your own digital experience.",
              },
              { type: "heading", content: "Start with an idea" },
              {
                type: "paragraph",
                content:
                  "Open the editor to make this story yours. Add an image, arrange your blocks, and publish your first story.",
              },
              {
                type: "quote",
                content: "Meaningful things begin with the courage to create.",
              },
            ],
          },
          user,
        );
        savePost(
          {
            type: "page",
            title: "About",
            slug: "about",
            excerpt: "A little about us.",
            status: "published",
            blocks: [
              {
                type: "paragraph",
                content:
                  "We believe every idea deserves a space. This is ours: a place to share stories, process, and creative work.",
              },
            ],
          },
          user,
        );
        setSetting("menu", [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
        ]);
      }
      log(user, "Set up the site");
      return Response.json(
        { ok: true },
        { headers: { "Set-Cookie": result.cookie } },
      );
    } finally {
      db.prepare("DELETE FROM settings WHERE key=?").run("_setup_lock");
    }
  });
}
