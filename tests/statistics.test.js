import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldCountView } from "../src/server/statistics.js";
test("page view eligibility filters non-reader requests and query strings", () => {
  const eligible = (path = "/story", headers = {}, method = "GET") =>
    shouldCountView(
      new Request("https://example.com" + path, { headers, method }),
    );
  assert.equal(eligible(), true);
  assert.equal(
    eligible("/blog?page=2", { "sec-fetch-dest": "document" }),
    true,
  );
  for (const path of [
    "/?preview=1",
    "/?theme=teraform",
    "/?q=secret",
    "/?email=private",
    "/?page=0",
    "/?page=abc",
  ])
    assert.equal(eligible(path), false);
  for (const headers of [
    { "user-agent": "Googlebot" },
    { "user-agent": "curl/8" },
    { purpose: "prefetch" },
    { "sec-purpose": "prefetch;prerender" },
    { "sec-fetch-dest": "empty" },
  ])
    assert.equal(eligible("/story", headers), false);
  assert.equal(eligible("/story", {}, "HEAD"), false);
  assert.equal(eligible("/story", {}, "POST"), false);
});
