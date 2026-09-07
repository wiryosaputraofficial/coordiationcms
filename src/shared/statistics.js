/** Rotate UTC hour totals into UTC or Jakarta's fixed UTC+7, preserving counts. */
export function hourlyBuckets(hourly, offset = 7) {
  if (![0, 7].includes(offset)) throw new Error("Unsupported hour timezone.");
  const bins = Array.from({ length: 24 }, (_, hour) => ({ hour, views: 0 }));
  for (const row of hourly) bins[(row.hour + offset) % 24].views += row.views;
  const max = Math.max(...bins.map((row) => row.views));
  return {
    bins,
    max,
    peakHours: max
      ? bins.filter((row) => row.views === max).map((row) => row.hour)
      : [],
  };
}
/** Fill missing cells explicitly with zero; only ranked paths enter the heatmap. */
export function heatmapCells(pages, days, daily) {
  const counts = new Map(
    daily.map((row) => [JSON.stringify([row.path, row.day]), row.views]),
  );
  return pages.flatMap((path, y) =>
    days.map((day, x) => [x, y, counts.get(JSON.stringify([path, day])) || 0]),
  );
}
