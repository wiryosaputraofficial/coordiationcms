import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeSEO } from "../src/shared/seo.js";

test("SEO overrides do not change the generated content URL", () => {
  const result = analyzeSEO({
    title: "Original article title",
    seo: {
      title: "Search result title",
      description: "Custom description",
      noindex: true,
    },
    status: "published",
    visibility: "public",
  });
  assert.equal(result.slug, "original-article-title");
  assert.equal(result.title, "Search result title");
  assert.equal(result.description, "Custom description");
  assert.equal(result.indexable, false);
});

test("SEO analysis responds to meaningful title, description, content and structure changes", () => {
  const empty = analyzeSEO({ type: "post", blocks: [] }, "Studio");
  assert.equal(empty.score, 0);
  const complete = analyzeSEO(
    {
      type: "post",
      title: "A practical guide to thoughtful publishing",
      excerpt:
        "A clear introduction to planning, writing, and publishing useful stories for readers, with practical examples to help you get started.",
      status: "published",
      visibility: "public",
      blocks: [
        { type: "heading", content: "Plan your story" },
        { type: "paragraph", content: "useful ".repeat(300) },
      ],
    },
    "Studio",
  );
  assert.equal(complete.score, 100);
  assert.equal(complete.indexable, true);
  assert.equal(complete.slug, "a-practical-guide-to-thoughtful-publishing");
});
test("SEO analysis flags missing alt text, omits absent images and does not count code as prose", () => {
  const post = {
    type: "page",
    title: "Page",
    blocks: [
      { type: "code", content: "code ".repeat(1000) },
      { type: "image", url: "/media/example", alt: "" },
    ],
  };
  let result = analyzeSEO(post);
  assert.equal(result.words, 0);
  assert.equal(result.checks.find((c) => c.id === "alt").pass, false);
  post.blocks[1].alt = "A diagram showing the publishing process";
  assert.equal(analyzeSEO(post).checks.find((c) => c.id === "alt").pass, true);
  assert.equal(
    analyzeSEO({ blocks: [] }).checks.find((c) => c.id === "alt").applicable,
    false,
  );
});
test("SEO meter uses rendered title length and distinguishes private content", () => {
  const result = analyzeSEO(
    {
      title: "A useful page title with a clear subject",
      status: "published",
      visibility: "private",
      blocks: [
        { type: "html", content: "<h2>Overview</h2><p>Useful &amp; clear</p>" },
      ],
    },
    "A very long site name that pushes the title beyond the suggested length",
  );
  assert.equal(result.indexable, false);
  assert.equal(result.checks.find((c) => c.id === "title").pass, false);
  assert.equal(result.checks.find((c) => c.id === "headings").pass, true);
  assert.equal(result.words, 3);
});
