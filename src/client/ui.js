import { icon } from "./icons.js";
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
  return `<div class="ui-field"><label for="${escape(id)}" data-component="Label" class="co-text-sm co-font-medium co-leading-none">${escape(label)}</label>${control}${hint ? `<p class="field-hint" id="${escape(id)}-hint">${escape(hint)}</p>` : ""}</div>`;
}
export function switchField(name, label, description, checked) {
  return `<div class="ui-switch-row"><div><label for="setting-${name}">${escape(label)}</label><p class="field-hint" id="setting-${name}-hint">${escape(description)}</p></div><input id="setting-${name}" type="checkbox" role="switch" name="${name}" aria-describedby="setting-${name}-hint" class="ui-switch co-relative co-inline-flex co-h-6 co-w-11 co-shrink-0 co-cursor-pointer co-appearance-none co-rounded-full co-border-2 co-border-transparent co-outline-none co-transition focus-visible:co-ring-2 disabled:co-opacity-50" ${checked ? "checked" : ""}></div>`;
}

/** Coordiation NativeSelect recipe with a shared Solar chevron. */
export function nativeSelect(id, options, selected) {
  return `<div class="ui-native-select"><select id="${escape(id)}" data-component="NativeSelect" class="co-h-10 co-w-full co-rounded-md co-border co-border-black/20 co-bg-white co-px-3 co-text-sm co-outline-none focus-visible:co-ring-2 disabled:co-opacity-50">${options.map((option) => `<option value="${escape(option.value)}" ${String(option.value) === String(selected) ? "selected" : ""}>${escape(option.label)}</option>`).join("")}</select>${icon("down")}</div>`;
}
/** Coordiation Button outline / medium recipe. */
export function outlineButton(id, label, iconName) {
  return `<button type="button" id="${escape(id)}" data-component="Button" class="button co-inline-flex co-items-center co-justify-center co-gap-2 co-rounded-md co-font-medium co-transition co-outline-none focus-visible:co-ring-2 focus-visible:co-ring-black disabled:co-pointer-events-none disabled:co-opacity-50 co-border co-border-black/20 co-bg-white co-text-black hover:co-bg-black/5 co-h-10 co-px-4 co-text-sm">${iconName ? icon(iconName) : ""}<span>${escape(label)}</span></button>`;
}
