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

import { hourlyBuckets, heatmapCells } from "../src/shared/statistics.js";
test("peak hours rotate UTC into WIB across midnight and preserve ties and empty data", () => {
  const source = [
    { hour: 17, views: 8 },
    { hour: 23, views: 8 },
    { hour: 0, views: 2 },
  ];
  const local = hourlyBuckets(source, 7);
  assert.deepEqual(local.peakHours, [0, 6]);
  assert.equal(local.bins[7].views, 2);
  assert.equal(
    local.bins.reduce((n, row) => n + row.views, 0),
    18,
  );
  assert.deepEqual(hourlyBuckets(source, 0).peakHours, [17, 23]);
  assert.deepEqual(hourlyBuckets([], 7).peakHours, []);
  assert.throws(() => hourlyBuckets(source, 9));
});
test("heatmap zero-fills missing dates without mixing up page and date axes", () => {
  assert.deepEqual(
    heatmapCells(
      ["/a", "/b"],
      ["2026-09-01", "2026-09-02"],
      [
        { path: "/b", day: "2026-09-01", views: 5 },
        { path: "/a", day: "2026-09-02", views: 9 },
        { path: "/unranked", day: "2026-09-01", views: 50 },
      ],
    ),
    [
      [0, 0, 0],
      [1, 0, 9],
      [0, 1, 5],
      [1, 1, 0],
    ],
  );
  assert.deepEqual(heatmapCells([], [], []), []);
});
