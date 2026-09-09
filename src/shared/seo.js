import { flattenBlocks } from "./builder.js";
/** Editorial checks, not a prediction of search-engine rankings. */
export function analyzeSEO(post, siteTitle = "") {
  const title = (post.seo?.title || post.title || "").trim();
  const description = (post.seo?.description || post.excerpt || "").trim();
  const slug = (post.slug || post.title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const blocks = flattenBlocks(post.blocks || []);
  const text = blocks
    .filter((b) => !["code", "image", "divider"].includes(b.type))
    .map((b) =>
      b.type === "html"
        ? (b.content || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, " ")
        : b.content || "",
    )
    .join(" ")
    .trim();
  const words = text ? text.split(/\s+/u).filter(Boolean).length : 0;
  const images = blocks.filter((b) => b.type === "image" && b.url);
  const fullTitle = title
    ? `${title}${siteTitle ? " — " + siteTitle : ""}`
    : "";
  const minimumWords = post.type === "page" ? 150 : 300;
  const checks = [
    {
      id: "title",
      label: "Page title",
      pass: fullTitle.length >= 30 && fullTitle.length <= 60,
      detail: `${fullTitle.length} characters including the site name. Aim for a clear title around 30–60 characters.`,
      weight: 20,
    },
    {
      id: "description",
      label: "Meta description",
      pass: description.length >= 120 && description.length <= 160,
      detail: `${description.length} characters. A custom description or the excerpt becomes the meta description; aim for roughly 120–160 characters.`,
      weight: 20,
    },
    {
      id: "slug",
      label: "Readable URL",
      pass: slug.length > 0 && slug.length <= 75,
      detail: slug
        ? `/${slug} · Keep the URL short and descriptive.`
        : "Add a title or a descriptive slug.",
      weight: 10,
    },
    {
      id: "content",
      label: "Useful content",
      pass: words >= minimumWords,
      detail: `${words} words. ${minimumWords}+ is an editorial starting point for this ${post.type === "page" ? "page" : "post"}; usefulness matters more than length.`,
      weight: 25,
    },
    {
      id: "headings",
      label: "Content structure",
      pass:
        blocks.some((b) => b.type === "heading" && b.content?.trim()) ||
        blocks.some((b) => b.type === "html" && /<h[23]\b/i.test(b.content)),
      detail:
        "Use descriptive section headings to make longer content easier to scan.",
      weight: 15,
    },
    {
      id: "alt",
      label: "Image descriptions",
      pass: images.every((b) => b.alt?.trim()),
      applicable: images.length > 0,
      detail: images.length
        ? `${images.filter((b) => b.alt?.trim()).length} of ${images.length} block images have alt text. Review featured images in Media separately.`
        : "No block images to check. Review featured images in Media separately.",
      weight: 10,
    },
  ];
  const applicable = checks.filter((c) => c.applicable !== false);
  const score = Math.round(
    (applicable.filter((c) => c.pass).reduce((n, c) => n + c.weight, 0) /
      applicable.reduce((n, c) => n + c.weight, 0)) *
      100,
  );
  return {
    score,
    label:
      score >= 80
        ? "Good foundation"
        : score >= 50
          ? "Room to improve"
          : "Needs attention",
    checks,
    title: fullTitle,
    description,
    slug,
    words,
    indexable:
      post.status === "published" &&
      post.visibility === "public" &&
      !post.seo?.noindex,
  };
}
