import { services } from "./database.js";
import { mergeHomepageData, validateHomepageData } from "../shared/homepage.js";
export function getHomepage(theme) {
  const row = services()
    .db.prepare("SELECT data,version FROM theme_homepages WHERE theme_id=?")
    .get(theme.id);
  return {
    version: row?.version || 0,
    data: mergeHomepageData(theme.homepage, row ? JSON.parse(row.data) : null),
  };
}
export function saveHomepage(theme, data, version) {
  const clean = validateHomepageData(theme.homepage, data),
    { db } = services();
  return db.transaction(() => {
    const old = db
      .prepare("SELECT version FROM theme_homepages WHERE theme_id=?")
      .get(theme.id);
    if (!Number.isInteger(version) || version !== (old?.version || 0)) {
      const e = new Error(
        "The homepage changed in another session. Reload before saving.",
      );
      e.status = 409;
      throw e;
    }
    db.prepare(
      "INSERT INTO theme_homepages(theme_id,data,version) VALUES (?,?,1) ON CONFLICT(theme_id) DO UPDATE SET data=excluded.data,version=theme_homepages.version+1",
    ).run(theme.id, JSON.stringify(clean));
    return { version: version + 1, data: clean };
  });
}
export function portableTheme(theme) {
  if (!theme.homepage) return theme;
  const { data } = getHomepage(theme);
  return {
    ...theme,
    homepage: {
      ...theme.homepage,
      design: data.design,
      sections: data.order.map((id) => {
        const s = theme.homepage.sections.find((s) => s.id === id),
          state = data.sections[id];
        return {
          ...s,
          visible: state.enabled,
          fields: s.fields.map((f) => ({ ...f, default: state.values[f.key] })),
          items: state.items,
        };
      }),
    },
  };
}
