import { readFileSync, writeFileSync } from "node:fs";
import { compile, extractCandidates } from "@coordiation/css";
import { publicRecipes } from "../src/server/public-components.js";
const source = readFileSync(
  new URL("../src/styles/public.css", import.meta.url),
  "utf8",
);
const icons = readFileSync(
  new URL("../src/styles/icons.css", import.meta.url),
  "utf8",
);
const candidates = extractCandidates(Object.values(publicRecipes).join(" "));
const { css } = compile("@coordiation;\n" + icons + "\n" + source, candidates, {
  preflight: false,
});
writeFileSync(new URL("../public/components.css", import.meta.url), css);
