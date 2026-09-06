import { getHomepage } from "./homepage-store.js";
import { renderTheme } from "./themes.js";
export function homepageSlots(theme, site, preview, url) {
  if (!theme.homepage) return {};
  const { data } = getHomepage(theme);
  const rendered = {};
  for (const id of data.order) {
    const config = data.sections[id],
      section = theme.homepage.sections.find((s) => s.id === id);
    if (!config.enabled) {
      rendered[id] = "";
      continue;
    }
    const options = (value) =>
      (value || "")
        .split("\n")
        .map((value) => ({ value: value.trim() }))
        .filter((v) => v.value)
        .slice(0, 16);
    rendered[id] = renderTheme(section.template, {
      ...config.values,
      items: config.items,
      site,
      preview,
      submitted: url?.searchParams.get("inquiry") === "received",
      subscribed: url?.searchParams.get("inquiry") === "subscribed",
      serviceOptions: options(config.values.services),
      budgetOptions: options(config.values.budgets),
    });
  }
  return {
    homepageHeader: rendered.header || "",
    homepageFooter: rendered.footer || "",
    homepageContent:
      (rendered.header || "") +
      '<main class="fx-main">' +
      data.order
        .filter((id) => !["header", "footer"].includes(id))
        .map((id) => rendered[id])
        .join("") +
      "</main>" +
      (rendered.footer || ""),
  };
}
