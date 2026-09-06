/** Native HTML recipes adapted from Coordiation's official component registry. */
export const publicRecipes = {
  button:
    "co-inline-flex co-items-center co-justify-center co-gap-2 co-h-10 co-px-4 co-rounded-md co-font-medium co-text-sm co-transition focus-visible:co-ring-2 disabled:co-opacity-50",
  input:
    "co-h-10 co-w-full co-rounded-md co-border co-px-3 co-text-sm co-outline-none focus-visible:co-ring-2",
  textarea:
    "co-w-full co-rounded-md co-border co-px-3 co-py-2 co-text-sm co-outline-none focus-visible:co-ring-2",
  card: "co-rounded-xl co-border co-shadow-sm",
  label: "co-grid co-gap-2 co-text-sm co-font-medium",
  form: "co-grid co-gap-4",
  navigation: "co-flex co-items-center co-gap-4",
  badge:
    "co-inline-flex co-items-center co-rounded-full co-px-2.5 co-py-1 co-text-xs co-font-medium",
  table: "co-w-full co-caption-bottom co-text-sm",
};
export function componentAttributes(tagName, attributes) {
  const classes = (attributes.class || "").split(/\s+/);
  const kind =
    tagName === "input" &&
    !["hidden", "checkbox", "radio"].includes(attributes.type)
      ? "input"
      : ["button", "textarea", "label", "form", "table"].includes(tagName)
        ? tagName
        : tagName === "nav"
          ? "navigation"
          : classes.some((c) =>
                ["post-card", "comment", "comment-form", "fx-card"].includes(c),
              )
            ? "card"
            : tagName === "a" && classes.includes("button")
              ? "button"
              : null;
  if (kind)
    attributes = {
      ...attributes,
      class: [
        ...new Set([
          ...classes.filter(Boolean),
          `pc-${kind}`,
          ...publicRecipes[kind].split(" "),
        ]),
      ].join(" "),
    };
  return { tagName, attribs: attributes };
}
