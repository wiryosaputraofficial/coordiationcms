/** Native adapter of Coordiation InteractiveChart (MIT), retrieved 2026-09-07.
 * Keeps the official SVG renderer, lazy loading, reduced motion, resize,
 * accessible data fallback and lifecycle cleanup without adding React.
 * Source: https://coordiation.com/r/interactive-chart.json
 */
export function mountCoordiationChart(host, option) {
  let chart,
    resize,
    disposed = false,
    loading = false;
  const status = host.nextElementSibling;
  const description = host.getAttribute("aria-label");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const apply = () =>
    chart?.setOption(
      {
        ...option,
        aria: { enabled: true, label: { description } },
        animation: !motion.matches,
        animationDuration: motion.matches ? 0 : 750,
        animationDurationUpdate: motion.matches ? 0 : 400,
      },
      { notMerge: true },
    );
  async function start() {
    if (disposed || loading || chart) return;
    loading = true;
    status.textContent = "Loading chart…";
    try {
      const engine = await import("./generated/statistics-engine.js");
      if (disposed) return;
      chart = engine.createChart(host);
      apply();
      resize = new ResizeObserver(() => chart?.resize());
      resize.observe(host);
      status.textContent = "";
    } catch {
      chart?.dispose();
      chart = null;
      if (!disposed) {
        status.textContent =
          "The chart could not load. The data table is available below. ";
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "button small";
        retry.textContent = "Retry chart";
        retry.onclick = start;
        status.append(retry);
      }
    } finally {
      loading = false;
    }
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void start();
      }
    },
    { threshold: 0.05 },
  );
  observer.observe(host);
  motion.addEventListener("change", apply);
  return () => {
    disposed = true;
    observer.disconnect();
    resize?.disconnect();
    motion.removeEventListener("change", apply);
    chart?.dispose();
    chart = null;
  };
}
