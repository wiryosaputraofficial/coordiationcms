import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBlocks, renderBlocks } from "../src/server/content.js";
import {
  moveBlock,
  clone,
  flattenBlocks,
  starterTemplates,
} from "../src/shared/builder.js";
import { analyzeSEO } from "../src/shared/seo.js";
import { fallbackDescription } from "../src/server/seo.js";

test("nested templates round trip through validation and semantic rendering", () => {
  for (const t of starterTemplates) {
    const blocks = validateBlocks(t.blocks);
    assert.deepEqual(validateBlocks(blocks), blocks);
    const html = renderBlocks(blocks, ["table-of-contents"]);
    assert.match(html, /pb-root/);
    assert.match(html, /class="toc"/);
    assert.match(html, /<h2/);
    assert.doesNotMatch(html, /style=/);
  }
});
test("builder rejects unsafe style values and bounds total complexity", () => {
  for (const styles of [
    { desktop: { background: "url(javascript:alert(1))" } },
    { desktop: { position: "fixed" } },
    { tablet: { padding: 99999 } },
    { desktop: { __proto__: null, constructor: 2 } },
    { phone: {} },
  ]) {
    assert.throws(() =>
      validateBlocks([{ type: "section", children: [], styles }]),
    );
  }
  assert.throws(() =>
    validateBlocks([
      {
        type: "section",
        children: Array.from({ length: 200 }, () => ({
          type: "paragraph",
          content: "x",
        })),
      },
    ]),
  );
  let b = { type: "paragraph", content: "deep" };
  for (let i = 0; i < 7; i++) b = { type: "section", children: [b] };
  assert.throws(() => validateBlocks([b]));
});
test("safe rendering escapes text and sanitizes HTML in nested content", () => {
  const blocks = validateBlocks([
    {
      type: "section",
      children: [
        { type: "heading", content: "<img src=x onerror=alert(1)>" },
        {
          type: "html",
          content: '<script>alert(1)</script><p onclick="alert(1)">Safe</p>',
        },
      ],
    },
  ]);
  const html = renderBlocks(blocks);
  assert.doesNotMatch(html, /<script|onclick=/);
  assert.match(html, /&lt;img/);
  assert.match(html, /<p>Safe<\/p>/);
  assert.throws(() =>
    validateBlocks([{ type: "button", url: "javascript:alert(1)" }]),
  );
});
test("moving nested blocks preserves nodes and rejects cycles", () => {
  const blocks = [
    { type: "paragraph", content: "a" },
    {
      type: "section",
      children: [
        { type: "paragraph", content: "b" },
        { type: "paragraph", content: "c" },
      ],
    },
  ];
  assert.equal(moveBlock(blocks, "0", "1", 2), true);
  assert.deepEqual(
    blocks[0].children.map((b) => b.content),
    ["b", "c", "a"],
  );
  assert.equal(moveBlock(blocks, "0", "0", 0), false);
  assert.equal(moveBlock(blocks, "0", "0.0", 0), false);
  assert.equal(moveBlock(blocks, "0.2", "0", 0), true);
  assert.deepEqual(
    blocks[0].children.map((b) => b.content),
    ["a", "b", "c"],
  );
  assert.equal(flattenBlocks(blocks).length, 4);
});
test("SEO and descriptions include nested headings text and images", () => {
  const blocks = [
    {
      type: "section",
      children: [
        { type: "heading", content: "Nested story" },
        { type: "paragraph", content: "useful ".repeat(300) },
        { type: "image", url: "/media/x", alt: "Useful example" },
      ],
    },
  ];
  const result = analyzeSEO({ blocks });
  assert.ok(result.words >= 300);
  assert.ok(result.checks.find((c) => c.id === "headings").pass);
  assert.ok(result.checks.find((c) => c.id === "alt").pass);
  assert.match(fallbackDescription({ blocks }), /^Nested story useful/);
});
