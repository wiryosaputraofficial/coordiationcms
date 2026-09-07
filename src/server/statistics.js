import { services } from "./database.js";
import { fail } from "./security.js";

const DAY = 86400000;
export function shouldCountView(request) {
  const url = new URL(request.url);
  const agent = request.headers.get("user-agent") || "";
  const purpose =
    request.headers.get("purpose") || request.headers.get("sec-purpose") || "";
  const destination = request.headers.get("sec-fetch-dest");
  return (
    request.method === "GET" &&
    ![...url.searchParams.keys()].some((key) => key !== "page") &&
    (!url.searchParams.has("page") ||
      /^[1-9]\d{0,3}$/.test(url.searchParams.get("page"))) &&
    (!destination || destination === "document") &&
    !/bot|crawler|spider|slurp|headless|preview|facebookexternalhit|curl|wget/i.test(
      agent,
    ) &&
    !/prefetch|prerender/i.test(purpose)
  );
}
export function recordPublicView(request, now = new Date()) {
  if (!shouldCountView(request)) return;
  const db = services().db,
    day = now.toISOString().slice(0, 10);
  // Store aggregate daily paths and site-wide hourly totals only: no IPs, cookies, visitor IDs, queries or referrers.
  db.transaction(() => {
    db.prepare("DELETE FROM page_views WHERE day < ?").run(
      new Date(now.getTime() - 89 * DAY).toISOString().slice(0, 10),
    );
    db.prepare("DELETE FROM page_view_hours WHERE day < ?").run(
      new Date(now.getTime() - 89 * DAY).toISOString().slice(0, 10),
    );
    db.prepare(
      "INSERT INTO page_view_hours(day,hour,views) VALUES(?,?,1) ON CONFLICT(day,hour) DO UPDATE SET views=views+1",
    ).run(day, now.getUTCHours());
    db.prepare(
      "INSERT INTO page_views(day,path,views) VALUES(?,?,1) ON CONFLICT(day,path) DO UPDATE SET views=views+1",
    ).run(day, new URL(request.url).pathname);
  });
}
export function getStatistics(days = 30, now = new Date()) {
  if (![7, 30, 90].includes(days)) fail(400, "Choose 7, 30, or 90 days.");
  const db = services().db;
  db.prepare("DELETE FROM page_views WHERE day < ?").run(
    new Date(now.getTime() - 89 * DAY).toISOString().slice(0, 10),
  );
  db.prepare("DELETE FROM page_view_hours WHERE day < ?").run(
    new Date(now.getTime() - 89 * DAY).toISOString().slice(0, 10),
  );
  const end = now.toISOString().slice(0, 10),
    start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        (days - 1) * DAY,
    )
      .toISOString()
      .slice(0, 10);
  const daily = Array.from({ length: days }, (_, i) => ({
    day: new Date(Date.parse(start) + i * DAY).toISOString().slice(0, 10),
    views: 0,
    posts: 0,
    pages: 0,
  }));
  const index = new Map(daily.map((row) => [row.day, row]));
  for (const row of db
    .prepare(
      "SELECT day,sum(views) AS views FROM page_views WHERE day BETWEEN ? AND ? GROUP BY day",
    )
    .all(start, end))
    Object.assign(index.get(row.day), { views: row.views });
  for (const row of db
    .prepare(
      "SELECT substr(COALESCE(publish_at,created_at),1,10) AS day,type,count(*) AS count FROM posts WHERE status='published' AND visibility='public' AND substr(COALESCE(publish_at,created_at),1,10) BETWEEN ? AND ? GROUP BY day,type",
    )
    .all(start, end))
    index.get(row.day)[row.type === "post" ? "posts" : "pages"] = row.count;
  const content = db
    .prepare(
      "SELECT status,count(*) AS count FROM posts GROUP BY status ORDER BY status",
    )
    .all();
  const totals = db
    .prepare(
      "SELECT sum(CASE WHEN type='post' THEN 1 ELSE 0 END) AS posts,sum(CASE WHEN type='page' THEN 1 ELSE 0 END) AS pages FROM posts WHERE status='published' AND visibility='public'",
    )
    .get();
  const count = (table, extra = "") =>
    db
      .prepare(
        `SELECT count(*) AS n FROM ${table} WHERE substr(created_at,1,10) BETWEEN ? AND ? ${extra}`,
      )
      .get(start, end).n;
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, views: 0 }));
  for (const row of db
    .prepare(
      "SELECT hour,sum(views) AS views FROM page_view_hours WHERE day BETWEEN ? AND ? GROUP BY hour",
    )
    .all(start, end))
    hourly[row.hour].views = row.views;
  const topPages = db
    .prepare(
      "SELECT path,sum(views) AS views FROM page_views WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY views DESC,path LIMIT 10",
    )
    .all(start, end);
  const heatmapDaily = db
    .prepare(
      `SELECT v.day,v.path,v.views FROM page_views v JOIN (
    SELECT path FROM page_views WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY sum(views) DESC,path LIMIT 10
  ) top ON top.path=v.path WHERE v.day BETWEEN ? AND ? ORDER BY v.day,v.path`,
    )
    .all(start, end, start, end);
  return {
    hourly,
    hourlyStartedAt: JSON.parse(
      db
        .prepare(
          "SELECT value FROM settings WHERE key='hourlyStatisticsStartedAt'",
        )
        .get().value,
    ),
    pageHeatmap: {
      pages: topPages.map((row) => row.path),
      daily: heatmapDaily,
    },
    days,
    start,
    end,
    timezone: "UTC",
    startedAt: JSON.parse(
      db
        .prepare("SELECT value FROM settings WHERE key='statisticsStartedAt'")
        .get().value,
    ),
    daily,
    content,
    totals: {
      views: daily.reduce((n, row) => n + row.views, 0),
      posts: totals.posts || 0,
      pages: totals.pages || 0,
      comments: count("comments", "AND status NOT IN ('spam','trash')"),
      inquiries: count("inquiries"),
      publishedInPeriod: daily.reduce((n, row) => n + row.posts + row.pages, 0),
    },
    topPages,
  };
}
