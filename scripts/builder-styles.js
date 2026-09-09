import { readFileSync, writeFileSync } from "node:fs";
import { devices, styleOptions } from "../src/shared/builder.js";
export function buildBuilderStyles() {
  let css = readFileSync(
    new URL("../src/styles/builder-base.css", import.meta.url),
    "utf8",
  );
  const colors = {
    none: "transparent",
    inherit: "inherit",
    white: "#fff",
    muted: "#f1f1ee",
    dark: "#191b1a",
    accent: "var(--accent,#191b1a)",
  };
  // Shorthand values precede edge overrides inside each breakpoint.
  const keys = Object.keys(styleOptions).sort(
    (a, b) =>
      Number(/^(padding|margin)[A-Z]/.test(a)) -
      Number(/^(padding|margin)[A-Z]/.test(b)),
  );
  for (const device of devices) {
    if (device !== "desktop")
      css += `\n@container builder (max-width:${device === "tablet" ? 1024 : 640}px){\n`;
    for (const key of keys)
      for (const value of styleOptions[key]) {
        let selector = `.pb-content .pb-${device}-${key}-${value}`,
          rule = "";
        const side = /^(padding|margin)(Top|Right|Bottom|Left)$/.exec(key);
        if (side) rule = `${side[1]}-${side[2].toLowerCase()}:${value}px`;
        else
          switch (key) {
            case "layout":
              rule = `--pb-display:${value}`;
              break;
            case "direction":
              rule = `flex-direction:${value}`;
              break;
            case "justify":
              rule = `justify-content:${value === "between" ? "space-between" : value}`;
              break;
            case "minHeight":
              rule = `min-height:${value}px`;
              break;
            case "font":
              rule =
                "font-family:" +
                {
                  inherit: "inherit",
                  sans: "Geist,Arial,sans-serif",
                  serif: "Georgia,serif",
                  mono: '"Geist Mono",monospace',
                }[value];
              break;
            case "columns":
              rule = `grid-template-columns:repeat(${value},minmax(0,1fr))`;
              break;
            case "gap":
            case "padding":
              rule = `${key}:${value}px`;
              break;
            case "margin":
              rule = `margin-block:${value}px`;
              break;
            case "radius":
              rule = `border-radius:${value}px`;
              break;
            case "align":
              rule = `text-align:${value}`;
              break;
            case "vertical":
              rule = `align-items:${value}`;
              break;
            case "width":
              rule =
                "width:100%;margin-inline:auto;max-width:" +
                { full: "none", wide: "1200px", reading: "740px" }[value];
              break;
            case "background":
              rule = `background:${colors[value]};--pb-button-bg:${value === "dark" ? "white" : "var(--accent,#191b1a)"};--pb-button-color:${value === "dark" ? "#191b1a" : "white"}`;
              break;
            case "color":
              rule = "color:" + (value === "muted" ? "#686b68" : colors[value]);
              break;
            case "border":
              rule = "border:" + (value === "line" ? "1px solid #d8d8d4" : "0");
              break;
            case "weight":
              rule =
                "font-weight:" + { normal: 400, medium: 500, bold: 700 }[value];
              break;
            case "size":
              rule =
                "font-size:" +
                {
                  inherit: "inherit",
                  small: "14px",
                  body: "16px",
                  lead: "24px",
                  title: "40px",
                  display: "clamp(40px,7cqi,80px)",
                }[value];
              break;
            case "hidden":
              rule = `--pb-hidden:${value === "yes" ? "none" : "initial"}`;
              break;
          }
        if (["size", "weight", "font"].includes(key))
          selector = [
            selector,
            ...[1, 2, 3, 4, 5, 6].map((level) => `${selector}>h${level}`),
          ].join(",");
        css += `${selector}{${rule}}\n`;
      }
    if (device === "mobile")
      css +=
        '.pb-content .pb-section:not([class*="pb-mobile-columns-"]){grid-template-columns:minmax(0,1fr)}\n';
    if (device !== "desktop") css += "}\n";
  }
  writeFileSync(new URL("../src/styles/builder.css", import.meta.url), css);
  writeFileSync(new URL("../public/builder.css", import.meta.url), css);
}
