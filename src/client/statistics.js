import { hourlyBuckets, heatmapCells } from "../shared/statistics.js";
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
const chart = (id, title, headers, rows, className = "") =>
  `<figure class="statistics-chart co-grid co-gap-3"><div id="${id}" class="statistics-chart-host ${className}" role="img" aria-label="${esc(title)}. Exact values are available in the data table."></div><p class="field-hint" role="status">Chart loads when visible.</p><details><summary>View accessible data</summary>${table(headers, rows)}</details></figure>`;
export async function renderStatistics(
  { api, isCurrent },
  days = 30,
  hourOffset = 7,
) {
  const data = await api("statistics?days=" + days);
  if (!isCurrent()) return;
  disposeStatistics();
  const hours = hourlyBuckets(data.hourly, hourOffset);
  const hourLabel = (hour) => `${String(hour).padStart(2, "0")}:00`;
  const zone = hourOffset === 7 ? "WIB (UTC+7)" : "UTC";
  const cells = heatmapCells(
    data.pageHeatmap.pages,
    data.daily.map((row) => row.day),
    data.pageHeatmap.daily,
  );
  const peakText = !hours.max
    ? "No hourly views recorded for this period yet."
    : hours.peakHours.length === 24
      ? `All hours are equally busy: ${number(hours.max)} views each.`
      : `Busiest ${hours.peakHours.length === 1 ? "hour" : "hours"}: ${hours.peakHours.map(hourLabel).join(", ")} · ${number(hours.max)} views${hours.peakHours.length > 1 ? " each" : ""}.`;
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
    )}</div><div class="statistics-wide">${card(
      "Peak hours",
      "Page views by hour of day, summed across the selected reporting period.",
      `<div class="statistics-hours-toolbar">${field(
        "statistics-timezone",
        "Hour timezone",
        nativeSelect(
          "statistics-timezone",
          [
            { value: 7, label: "Jakarta · WIB (UTC+7)" },
            { value: 0, label: "UTC" },
          ],
          hourOffset,
        ),
      )}<p class="statistics-peak-summary" role="status">${esc(peakText)}</p></div>${chart(
        "hourly-chart",
        `Peak hours in ${zone}`,
        [`Hour (${zone})`, "Page views"],
        hours.bins.map((row) => [hourLabel(row.hour), row.views]),
      )}<p class="field-hint">Hourly recording started ${esc(data.hourlyStartedAt.slice(0, 10))}. Earlier daily totals cannot be split into hours. The reporting date range remains in UTC; the timezone changes hour labels only. Each bar covers a full hour.</p>`,
      icon("clock"),
    )}</div><div class="statistics-wide">${card(
      "Page heatmap",
      "Daily views for the 10 most visited pages in this period. Darker cells mean more views; pale cells mean zero. Dates use UTC.",
      data.pageHeatmap.pages.length
        ? `<div class="statistics-heatmap-scroll">${chart(
            "page-heatmap",
            "Daily page views heatmap",
            ["Page path", "Date (UTC)", "Page views"],
            cells.map(([x, y, value]) => [
              data.pageHeatmap.pages[y],
              data.daily[x].day,
              value,
            ]),
            `statistics-heatmap days-${data.days} rows-${data.pageHeatmap.pages.length}`,
          )}</div><p class="field-hint">Scroll horizontally to explore all dates. Hover or tap a cell for its full path, date, and count. This is a traffic heatmap, not a click or scroll-position tracker.</p>`
        : '<p class="muted">The heatmap will appear after readers visit your public pages.</p>',
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
    )}</div></div><p class="field-hint statistics-note">Views count page requests, not unique people. Signed-in visits, previews, searches, common bots, and prefetch requests are excluded. Repeated visits count again; bot detection is approximate. Only daily path and site-wide hourly totals are stored—no cookies, visitor IDs, IP addresses, or referrers. Totals older than 90 days are removed when a new view is recorded or statistics are opened.</p>`;
  let sequence = 0;
  const reload = async (event) => {
    const scrollTop = window.scrollY,
      focusedId = event?.currentTarget?.id;
    const current = ++sequence;
    const select = document.querySelector("#statistics-period"),
      button = document.querySelector("#statistics-refresh"),
      timezone = document.querySelector("#statistics-timezone");
    timezone.disabled = true;
    select.disabled = true;
    button.disabled = true;
    try {
      await renderStatistics(
        { api, isCurrent: () => isCurrent() && sequence === current },
        Number(select.value),
        Number(timezone.value),
      );
      if (isCurrent() && sequence === current) {
        document.getElementById(focusedId)?.focus({ preventScroll: true });
        window.scrollTo({ top: scrollTop, behavior: "instant" });
      }
    } catch {
      if (isCurrent()) {
        timezone.value = String(hourOffset);
        timezone.disabled = false;
        select.value = String(days);
        document.querySelector("#statistics-status").textContent =
          "Unable to refresh statistics. Please try again.";
        select.disabled = false;
        button.disabled = false;
        button.querySelector("span:last-child").textContent = "Retry refresh";
      }
    }
  };
  document.querySelector("#statistics-timezone").onchange = reload;
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
    mountCoordiationChart(document.querySelector("#hourly-chart"), {
      ...base,
      xAxis: {
        type: "category",
        data: hours.bins.map((row) => hourLabel(row.hour)),
        axisLabel: { hideOverlap: true },
      },
      series: [
        {
          name: "Page views",
          type: "bar",
          barMaxWidth: 28,
          data: hours.bins.map((row) => ({
            value: row.views,
            itemStyle: {
              color:
                row.views === hours.max && hours.max > 0
                  ? "#e76b3b"
                  : "#171d1a",
            },
          })),
        },
      ],
    }),
  );
  if (data.pageHeatmap.pages.length)
    cleanup.push(
      mountCoordiationChart(document.querySelector("#page-heatmap"), {
        textStyle: base.textStyle,
        grid: { top: 12, left: 140, right: 20, bottom: 90 },
        tooltip: {
          trigger: "item",
          renderMode: "richText",
          confine: true,
          formatter: (params) =>
            `${data.pageHeatmap.pages[params.value[1]]}\n${data.daily[params.value[0]].day} (UTC)\n${number(params.value[2])} page views`,
        },
        xAxis: {
          type: "category",
          data: data.daily.map((row) => row.day.slice(5)),
          splitArea: { show: true },
          axisLabel: { hideOverlap: true },
        },
        yAxis: {
          type: "category",
          data: data.pageHeatmap.pages,
          inverse: true,
          axisLabel: { width: 120, overflow: "truncate" },
          splitArea: { show: true },
        },
        visualMap: {
          min: 0,
          max: Math.max(1, ...cells.map((cell) => cell[2])),
          orient: "horizontal",
          left: "center",
          bottom: 0,
          calculable: false,
          inRange: { color: ["#f3f2ed", "#f8c4aa", "#d63b12"] },
          text: ["More views", "Fewer"],
        },
        series: [
          {
            type: "heatmap",
            data: cells,
            itemStyle: { borderWidth: 2, borderColor: "#fff" },
            emphasis: { itemStyle: { borderColor: "#171d1a", borderWidth: 2 } },
          },
        ],
      }),
    );
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
