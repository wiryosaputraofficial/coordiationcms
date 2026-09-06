/** Reusable native parts from Coordiation's monochrome Card/Input/Switch recipes. */
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function card(title, description, content, icon = "") {
  return `<section class="panel ui-card co-rounded-xl co-border co-border-black/15 co-bg-white co-text-black co-shadow-sm"><header class="ui-card-header co-flex co-flex-col co-gap-1.5 co-p-6"><div class="ui-card-title">${icon}<h2 class="co-text-lg co-font-semibold co-leading-none">${escape(title)}</h2></div>${description ? `<p class="co-text-sm co-text-black/60">${escape(description)}</p>` : ""}</header><div class="ui-card-content co-px-6 co-pb-6">${content}</div></section>`;
}
export function field(id, label, control, hint = "") {
  return `<div class="ui-field"><label for="${escape(id)}">${escape(label)}</label>${control}${hint ? `<p class="field-hint" id="${escape(id)}-hint">${escape(hint)}</p>` : ""}</div>`;
}
export function switchField(name, label, description, checked) {
  return `<div class="ui-switch-row"><div><label for="setting-${name}">${escape(label)}</label><p class="field-hint" id="setting-${name}-hint">${escape(description)}</p></div><input id="setting-${name}" type="checkbox" role="switch" name="${name}" aria-describedby="setting-${name}-hint" class="ui-switch co-relative co-inline-flex co-h-6 co-w-11 co-shrink-0 co-cursor-pointer co-appearance-none co-rounded-full co-border-2 co-border-transparent co-outline-none co-transition focus-visible:co-ring-2 disabled:co-opacity-50" ${checked ? "checked" : ""}></div>`;
}
