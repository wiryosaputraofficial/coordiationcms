import { card, field, nativeSelect, outlineButton } from "./ui.js";
import { icon } from "./icons.js";
import { mountCoordiationChart } from "./coordiation-chart.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = (n) => Number(n).toLocaleString("en-US");
let cleanup = [];
export function disposeStatistics() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}
const table = (headers, rows) =>
  `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const chart = (id, title, headers, rows) =>
  `<figure class="statistics-chart co-grid co-gap-3"><div id="${id}" class="statistics-chart-host" role="img" aria-label="${esc(title)}. Exact values are available in the data table."></div><p class="field-hint" role="status">Chart loads when visible.</p><details><summary>View accessible data</summary>${table(headers, rows)}</details></figure>`;
export async function renderStatistics({ api, isCurrent }, days = 30) {
  const data = await api("statistics?days=" + days);
  if (!isCurrent()) return;
  disposeStatistics();
  document.querySelector("#workspace").innerHTML =
    `<div class="page-heading"><div><h1>Statistics</h1><p>Understand your traffic and publishing activity.</p></div><div class="statistics-controls">${field(
      "statistics-period",
      "Period",
      nativeSelect(
        "statistics-period",
        [7, 30, 90].map((value) => ({ value, label: `Last ${value} days` })),
        days,
      ),
    )}${outlineButton("statistics-refresh", "Refresh", "refresh")}</div></div><p class="field-hint">${esc(data.start)} – ${esc(data.end)} · UTC · Traffic recording started ${esc(data.startedAt.slice(0, 10))}</p><p id="statistics-status" class="field-hint" role="status"></p><div class="statistics-metrics">${[
      ["Page views", data.totals.views, "Within the selected period"],
      ["Published posts", data.totals.posts, "Current public posts"],
      ["Published pages", data.totals.pages, "Current public pages"],
      [
        "Published in period",
        data.totals.publishedInPeriod,
        "Currently public content by publish date",
      ],
      ["Comments received", data.totals.comments, "Excludes spam and trash"],
      [
        "Form submissions",
        data.totals.inquiries,
        "Contact and newsletter submissions",
      ],
    ]
      .map(
        ([label, value, hint]) =>
          `<section class="panel statistics-metric"><p>${label}</p><strong>${number(value)}</strong><small>${hint}</small></section>`,
      )
      .join(
        "",
      )}</div>${!data.totals.views ? '<div class="inline-alert">No page views recorded for this period yet. Traffic will appear as readers visit your public site.</div>' : ""}<div class="statistics-grid"><div class="statistics-wide">${card(
      "Page views over time",
      "Successful public page requests, grouped by day.",
      chart(
        "traffic-chart",
        "Page views over time",
        ["Date (UTC)", "Page views"],
        data.daily.map((d) => [d.day, d.views]),
      ),
      icon("statistics"),
    )}</div>${card(
      "Publishing activity",
      "Currently published public posts and pages, by publish date.",
      chart(
        "publishing-chart",
        "Publishing activity",
        ["Date (UTC)", "Posts", "Pages"],
        data.daily.map((d) => [d.day, d.posts, d.pages]),
      ),
      icon("posts"),
    )}${card(
      "Content status",
      "Current status of all posts and pages, including private content.",
      chart(
        "content-chart",
        "Content status",
        ["Status", "Items"],
        data.content.map((d) => [d.status, d.count]),
      ),
      icon("pages"),
    )}<div class="statistics-wide">${card(
      "Top pages",
      "Most requested public paths in the selected period. Query strings are not stored.",
      data.topPages.length
        ? table(
            ["Page path", "Page views"],
            data.topPages.map((d) => [d.path, number(d.views)]),
          )
        : '<p class="muted">Your most visited pages will appear here.</p>',
    )}</div></div><p class="field-hint statistics-note">Views count page requests, not unique people. Signed-in visits, previews, searches, common bots, and prefetch requests are excluded. Repeated visits count again; bot detection is approximate. Only daily path totals are stored—no cookies, visitor IDs, IP addresses, or referrers. Totals older than 90 days are removed when a new view is recorded or statistics are opened.</p>`;
  let sequence = 0;
  const reload = async () => {
    const current = ++sequence;
    const select = document.querySelector("#statistics-period"),
      button = document.querySelector("#statistics-refresh");
    select.disabled = true;
    button.disabled = true;
    try {
      await renderStatistics(
        { api, isCurrent: () => isCurrent() && sequence === current },
        Number(select.value),
      );
    } catch {
      if (isCurrent()) {
        select.value = String(days);
        document.querySelector("#statistics-status").textContent =
          "Unable to refresh statistics. Please try again.";
        select.disabled = false;
        button.disabled = false;
        button.querySelector("span:last-child").textContent = "Retry refresh";
      }
    }
  };
  document.querySelector("#statistics-period").onchange = reload;
  document.querySelector("#statistics-refresh").onclick = reload;
  const base = {
    color: ["#171d1a", "#e76b3b", "#8a9991", "#9f8bb9", "#cda35f", "#bc6666"],
    tooltip: { trigger: "axis", renderMode: "richText", confine: true },
    legend: { bottom: 0, type: "scroll" },
    grid: { top: 25, left: 16, right: 20, bottom: 55, containLabel: true },
    xAxis: {
      type: "category",
      data: data.daily.map((d) => d.day.slice(5)),
      axisLabel: { hideOverlap: true },
    },
    yAxis: { type: "value", minInterval: 1 },
    textStyle: { fontFamily: "Geist, sans-serif" },
  };
  cleanup.push(
    mountCoordiationChart(document.querySelector("#traffic-chart"), {
      ...base,
      series: [
        {
          name: "Page views",
          type: "line",
          data: data.daily.map((d) => d.views),
          areaStyle: { opacity: 0.1 },
          symbolSize: 6,
        },
      ],
    }),
  );
  cleanup.push(
    mountCoordiationChart(document.querySelector("#publishing-chart"), {
      ...base,
      series: [
        {
          name: "Posts",
          type: "bar",
          data: data.daily.map((d) => d.posts),
          barMaxWidth: 24,
        },
        {
          name: "Pages",
          type: "bar",
          data: data.daily.map((d) => d.pages),
          barMaxWidth: 24,
        },
      ],
    }),
  );
  cleanup.push(
    mountCoordiationChart(document.querySelector("#content-chart"), {
      ...base,
      xAxis: undefined,
      yAxis: undefined,
      tooltip: { trigger: "item", renderMode: "richText", confine: true },
      series: [
        {
          name: "Items",
          type: "pie",
          radius: ["40%", "68%"],
          center: ["50%", "43%"],
          label: { show: false },
          stillShowZeroSum: false,
          data: data.content.map((d) => ({
            name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
            value: d.count,
          })),
        },
      ],
    }),
  );
}
