const keyPattern = /^[a-z][a-zA-Z0-9]{0,39}$/;
const types = new Set(["text", "textarea", "url", "image", "color"]);
export function homepageURL(value, image = false) {
  if (!value) return "";
  if (
    typeof value !== "string" ||
    value.length > 2000 ||
    /[\\\s<>]/.test(value)
  )
    throw new Error("Enter a valid URL.");
  if (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)) return value;
  if (
    !image &&
    (/^#[a-z][\w-]*$/i.test(value) ||
      /^mailto:[^@]+@[^@]+$/i.test(value) ||
      /^tel:\+?[\d()-]+$/.test(value))
  )
    return value;
  throw new Error(
    image
      ? "Images must use a local path or HTTPS URL."
      : "Use a local path, section anchor, HTTPS, email or telephone link.",
  );
}
function valueFor(field, value) {
  if (
    typeof value !== "string" ||
    value.length > (field.type === "textarea" ? 4000 : 2000)
  )
    throw new Error(`${field.label}: invalid or overly long value.`);
  if (field.type === "url" || field.type === "image")
    return homepageURL(value, field.type === "image");
  if (field.type === "color" && !/^#[0-9a-f]{6}$/i.test(value))
    throw new Error("Use a six-digit HEX color.");
  return value;
}
export function validateHomepageSchema(schema) {
  if (
    !schema ||
    schema.version !== 1 ||
    !Array.isArray(schema.sections) ||
    schema.sections.length < 1 ||
    schema.sections.length > 20
  )
    throw new Error("Invalid homepage schema.");
  const ids = new Set();
  for (const section of schema.sections) {
    if (
      !keyPattern.test(section.id) ||
      ["constructor", "prototype", "design"].includes(section.id) ||
      ids.has(section.id) ||
      !section.label ||
      section.label.length > 80 ||
      typeof section.template !== "string" ||
      section.template.length > 25000
    )
      throw new Error("Invalid homepage section.");
    ids.add(section.id);
    for (const fields of [section.fields, section.itemFields || []]) {
      if (!Array.isArray(fields) || fields.length > 30)
        throw new Error("Too many homepage fields.");
      const keys = new Set();
      for (const f of fields) {
        if (
          !keyPattern.test(f.key) ||
          ["constructor", "prototype", "items", "site", "preview"].includes(
            f.key,
          ) ||
          keys.has(f.key) ||
          !types.has(f.type) ||
          typeof f.label !== "string" ||
          f.label.length > 100
        )
          throw new Error("Invalid homepage field.");
        keys.add(f.key);
        valueFor(f, f.default ?? "");
      }
    }
    if (
      !Array.isArray(section.items || []) ||
      (section.items || []).length > 16
    )
      throw new Error("Up to 16 items per section.");
    for (const item of section.items || [])
      for (const f of section.itemFields || [])
        valueFor(f, item[f.key] ?? f.default ?? "");
  }
  if (JSON.stringify(schema).length > 180000)
    throw new Error("Homepage schema is too large.");
  if (schema.design) validateHomepageData(schema, homepageDefaults(schema));
  return schema;
}
const values = (fields) =>
  Object.fromEntries(fields.map((f) => [f.key, f.default || ""]));
export function homepageDefaults(schema) {
  return {
    design: {
      accent: "#f45d32",
      background: "#f1f1ef",
      foreground: "#151515",
      font: "sans",
      animation: "on",
      parallax: "gentle",
      ...schema.design,
    },
    order: schema.sections.map((s) => s.id),
    sections: Object.fromEntries(
      schema.sections.map((s) => [
        s.id,
        {
          enabled: s.visible !== false,
          values: values(s.fields),
          items: (s.items || []).map((i) => ({
            ...values(s.itemFields || []),
            ...i,
          })),
        },
      ]),
    ),
  };
}
export function validateHomepageData(schema, data) {
  if (!data || !data.design || !Array.isArray(data.order) || !data.sections)
    throw new Error("Invalid homepage settings.");
  const ids = schema.sections.map((s) => s.id);
  if (
    data.order.length !== ids.length ||
    new Set(data.order).size !== ids.length ||
    data.order.some((id) => !ids.includes(id))
  )
    throw new Error("Every homepage section must appear once.");
  if (
    (ids.includes("header") && data.order[0] !== "header") ||
    (ids.includes("footer") && data.order.at(-1) !== "footer")
  )
    throw new Error("Keep the header first and footer last.");
  if (Object.keys(data.sections).some((id) => !ids.includes(id)))
    throw new Error("Unknown homepage section.");
  const design = {};
  for (const k of ["accent", "background", "foreground"]) {
    if (!/^#[0-9a-f]{6}$/i.test(data.design[k]))
      throw new Error("Invalid homepage color.");
    design[k] = data.design[k];
  }
  if (!["sans", "serif"].includes(data.design.font))
    throw new Error("Invalid font.");
  design.font = data.design.font;
  for (const [key, options, fallback] of [
    ["animation", ["on", "off"], "on"],
    ["parallax", ["off", "gentle", "standard"], "gentle"],
  ]) {
    const value = data.design[key] ?? fallback;
    if (!options.includes(value)) throw new Error("Invalid motion setting.");
    design[key] = value;
  }
  const sections = {};
  for (const s of schema.sections) {
    const d = data.sections[s.id];
    if (
      !d ||
      typeof d.enabled !== "boolean" ||
      !d.values ||
      !Array.isArray(d.items) ||
      d.items.length > 16 ||
      (!s.itemFields?.length && d.items.length)
    )
      throw new Error(`Invalid ${s.label} settings.`);
    const parse = (fields, v) => {
      if (
        !v ||
        typeof v !== "object" ||
        Object.keys(v).some((k) => !fields.some((f) => f.key === k))
      )
        throw new Error("Unknown homepage field.");
      return Object.fromEntries(
        fields.map((f) => [f.key, valueFor(f, v[f.key] ?? f.default ?? "")]),
      );
    };
    sections[s.id] = {
      enabled: d.enabled,
      values: parse(s.fields, d.values),
      items: d.items.map((i) => parse(s.itemFields || [], i)),
    };
  }
  return { design, order: [...data.order], sections };
}
export function mergeHomepageData(schema, saved) {
  const result = homepageDefaults(schema);
  if (!saved) return result;
  for (const k of Object.keys(result.design))
    if (saved.design?.[k]) result.design[k] = saved.design[k];
  result.order = [
    ...(saved.order || []).filter((id) => result.sections[id]),
    ...result.order.filter((id) => !saved.order?.includes(id)),
  ];
  for (const section of schema.sections) {
    const old = saved.sections?.[section.id];
    if (!old) continue;
    const target = result.sections[section.id];
    target.enabled = old.enabled !== false;
    for (const f of section.fields)
      if (typeof old.values?.[f.key] === "string") {
        try {
          target.values[f.key] = valueFor(f, old.values[f.key]);
        } catch {}
      }
    if (Array.isArray(old.items))
      target.items = old.items.slice(0, 16).map((i) =>
        Object.fromEntries(
          (section.itemFields || []).map((f) => {
            let v = f.default || "";
            try {
              v = valueFor(f, i[f.key] ?? v);
            } catch {}
            return [f.key, v];
          }),
        ),
      );
  }
  return validateHomepageData(schema, result);
}
