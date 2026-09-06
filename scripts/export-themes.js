import { mkdirSync, writeFileSync } from "node:fs";
import { builtInThemes, packTheme } from "../src/server/themes.js";
mkdirSync("theme-packages", { recursive: true });
for (const theme of builtInThemes) {
  writeFileSync(`theme-packages/${theme.id}.zip`, packTheme(theme));
  console.log(`Exported ${theme.id}`);
}
