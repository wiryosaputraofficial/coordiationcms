import { getHomepage } from "./homepage-store.js";
import { renderTheme } from "./themes.js";
export function homepageSlots(theme, site, preview, url) {
  if (!theme.homepage) return {};
  const { data } = getHomepage(theme);
  const localLink = (href) => {
    if (!href || (!href.startsWith("#") && !href.startsWith("/"))) return href;
    if (href.startsWith("#") && (!url || url.pathname === "/")) return href;
    const target = new URL(
      href.startsWith("#") ? "/" + href : href,
      url?.origin || "https://cms.local",
    );
    if (preview && ["/", "/blog"].includes(target.pathname)) {
      target.searchParams.set("preview", "1");
      target.searchParams.set("theme", theme.id);
    }
    return target.pathname + target.search + target.hash;
  };
  const links = (values, fields) =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        fields.some((f) => f.key === key && f.type === "url")
          ? localLink(value)
          : value,
      ]),
    );
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
      ...links(config.values, section.fields),
      items: config.items.map((item) => links(item, section.itemFields || [])),
      site,
      preview,
      submitted: url?.searchParams.get("inquiry") === "received",
      subscribed: url?.searchParams.get("inquiry") === "subscribed",
      serviceOptions: options(config.values.services),
      budgetOptions: options(config.values.budgets),
    });
  }
  return {
    blogTitle:
      data.sections.header?.values.blogTitle ||
      "Ideas, notes, and perspectives.",
    blogDescription:
      data.sections.header?.values.blogDescription ||
      "From the studio journal.",
    blogURL: localLink("/blog"),
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
