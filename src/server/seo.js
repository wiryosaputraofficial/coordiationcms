import { flattenBlocks } from "../shared/builder.js";
import { escape } from "./content.js";

export const siteOrigin = () =>
  (process.env.CMS_ORIGIN || "http://127.0.0.1:3118").replace(/\/$/, "");
export function fallbackDescription(post) {
  return (
    post.excerpt ||
    flattenBlocks(post.blocks || [])
      .filter((b) => ["paragraph", "heading", "html"].includes(b.type))
      .map((b) => b.content || "")
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ).slice(0, 160);
}
export function seoHead({
  title,
  description,
  path,
  site,
  preview,
  post,
  image,
  imageAlt,
  author,
  page = 1,
}) {
  const origin = siteOrigin();
  const canonical =
    post?.seo?.canonical || origin + path + (page > 1 ? "?page=" + page : "");
  const headline = post?.seo?.title || title;
  const fullTitle = `${headline}${page > 1 ? " · Page " + page : ""} — ${site.title}`;
  const summary = post?.seo?.description || description || site.tagline;
  const noindex = preview || post?.seo?.noindex;
  const absoluteImage = image ? new URL(image, origin).href : "";
  const website = {
    "@type": "WebSite",
    "@id": origin + "/#website",
    url: origin + "/",
    name: site.title,
    inLanguage: "en",
  };
  const webpage = {
    "@type": post?.type === "post" ? "BlogPosting" : "WebPage",
    "@id": canonical + "#content",
    url: canonical,
    name: title,
    headline: title,
    description: summary,
    isPartOf: { "@id": website["@id"] },
    inLanguage: "en",
  };
  if (post) {
    webpage.datePublished = post.publish_at || post.created_at;
    webpage.dateModified = post.updated_at;
    webpage.mainEntityOfPage = canonical;
    if (author) webpage.author = { "@type": "Person", name: author };
  }
  if (absoluteImage) webpage.image = [absoluteImage];
  const graph = [website, webpage];
  if (path !== "/")
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin + "/" },
        ...(post?.type === "post"
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: origin + "/blog",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: canonical,
              },
            ]
          : [
              {
                "@type": "ListItem",
                position: 2,
                name: title,
                item: canonical,
              },
            ]),
      ],
    });
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  const meta = (key, value, property = false) =>
    `<meta ${property ? "property" : "name"}="${key}" content="${escape(value)}">`;
  return `<title>${escape(fullTitle)}</title>${meta("description", summary)}<link rel="canonical" href="${escape(canonical)}">${meta("robots", noindex ? "noindex,follow" : "index,follow,max-image-preview:large")}${meta("og:title", fullTitle, true)}${meta("og:description", summary, true)}${meta("og:url", canonical, true)}${meta("og:site_name", site.title, true)}${meta("og:type", post?.type === "post" ? "article" : "website", true)}${meta("twitter:card", absoluteImage ? "summary_large_image" : "summary")}${meta("twitter:title", fullTitle)}${meta("twitter:description", summary)}${absoluteImage ? meta("og:image", absoluteImage, true) + meta("og:image:alt", imageAlt || title, true) + meta("twitter:image", absoluteImage) : ""}${post ? meta("article:published_time", post.publish_at || post.created_at, true) + meta("article:modified_time", post.updated_at, true) + meta("author", author || site.title) : ""}${!noindex ? `<script type="application/ld+json">${json}</script>` : ""}`;
}
