import { services, settings, publishDue } from "./database.js";
import { siteOrigin } from "./seo.js";
export function llmsGET() {
  publishDue();
  const site = settings(),
    origin = siteOrigin();
  const rows = services()
    .db.prepare(
      "SELECT title,slug,excerpt FROM posts WHERE status='published' AND visibility='public' AND COALESCE(json_extract(seo,'$.noindex'),0)=0 ORDER BY COALESCE(publish_at,created_at) DESC LIMIT 100",
    )
    .all();
  const plain = (s) =>
    String(s || "")
      .replace(/[\r\n\[\]<>]/g, " ")
      .trim();
  return new Response(
    `# ${plain(site.title)}\n\n> ${plain(site.tagline)}\n\n## Navigation\n- [Home](${origin}/)\n- [Blog](${origin}/blog)\n- [RSS feed](${origin}/feed)\n- [Sitemap](${origin}/sitemap.xml)\n\n## Recent public content\n${rows.map((p) => `- [${plain(p.title)}](${origin}/${p.slug}): ${plain(p.excerpt)}`).join("\n")}\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
