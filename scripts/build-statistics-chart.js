// Build the browser-only ECharts engine before Fullstack's strict client scan.
// Compile-time development flags are replaced; the server boundary stays enabled.
import { rolldown } from "rolldown";
import { fileURLToPath } from "node:url";
const build = await rolldown({
  input: fileURLToPath(new URL("./statistics-chart-entry.js", import.meta.url)),
  platform: "browser",
  transform: {
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  },
});
try {
  await build.write({
    file: fileURLToPath(
      new URL("../src/client/generated/statistics-engine.js", import.meta.url),
    ),
    format: "esm",
    minify: true,
  });
} finally {
  await build.close();
}
