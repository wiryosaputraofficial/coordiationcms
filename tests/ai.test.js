import { test } from "node:test";
import assert from "node:assert/strict";
import { requestWriting } from "../src/server/ai.js";
import { writingBlocks } from "../src/client/ai.js";
test("AI sends bounded explicit input and returns reviewable text without publishing", async () => {
  let request;
  const result = await requestWriting(
    {
      task: "draft",
      brief: "An article about accessible design",
      source: "Research notes",
      language: "Indonesian",
    },
    { model: "gpt-5.4-mini" },
    "test-key",
    async (url, options) => {
      request = { url, ...options };
      return new Response(
        JSON.stringify({
          status: "completed",
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "## A useful heading\n\nAn original paragraph.",
                },
              ],
            },
          ],
        }),
      );
    },
  );
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  const body = JSON.parse(request.body);
  assert.equal(body.store, false);
  assert.equal(body.max_output_tokens, 4000);
  assert.match(body.instructions, /Indonesian/);
  assert.ok(!body.tools);
  assert.deepEqual(writingBlocks(result.text), [
    { type: "heading", level: 2, content: "A useful heading" },
    { type: "paragraph", content: "An original paragraph." },
  ]);
});
test("AI handles provider errors and incomplete output without returning raw details", async () => {
  await assert.rejects(
    () =>
      requestWriting(
        { task: "draft", brief: "Test" },
        { model: "test" },
        "key",
        async () => new Response("private provider detail", { status: 401 }),
      ),
    /rejected the API key/,
  );
  await assert.rejects(
    () =>
      requestWriting(
        { task: "draft", brief: "Test" },
        { model: "test" },
        "key",
        async () =>
          new Response(JSON.stringify({ status: "incomplete", output: [] })),
      ),
    /incomplete/,
  );
  await assert.rejects(
    () => requestWriting({ task: "invalid" }, { model: "test" }, "key"),
    /Choose a writing task/,
  );
});
