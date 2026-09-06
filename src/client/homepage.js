import { icon } from "../shared/icons.js";
import { card, field } from "./ui.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function renderHomepageEditor(
  id,
  { api, toast, pickMedia, setDirty },
) {
  const response = await api("homepage?id=" + encodeURIComponent(id));
  let { data, version } = response,
    selected = "hero";
  if (!response.schema.sections.some((s) => s.id === selected))
    selected = data.order[0];
  const root = document.querySelector("#workspace");
  root.innerHTML = `<div class="page-heading"><div><h1>${esc(response.name)} homepage</h1><p>Edit your content, images, sections, and visual style.</p></div><div class="heading-actions"><span class="muted" id="homepage-status">Saved settings</span><a class="button" href="/?preview=1&theme=${encodeURIComponent(id)}" target="_blank" rel="noopener">${icon("eye")} Preview</a><button type="button" class="button primary" id="save-homepage">${icon("check")} Save homepage</button></div></div><div class="inline-alert">${response.active ? "This theme is active. Saved changes appear on your public site." : "This theme is available in Themes. Preview it before choosing Activate."} ${response.staticHomepage ? "A static homepage is selected in Settings; choose Theme homepage / latest posts to use this layout." : ""} Preview shows saved settings.</div><div class="homepage-editor"><nav class="homepage-sections" aria-label="Homepage sections"></nav><div id="homepage-fields"></div></div>`;
  const changed = () => {
    setDirty(true);
    root.querySelector("#homepage-status").textContent = "Unsaved changes";
  };
  const input = (f, value, key) => {
    const inputId = "hp-" + key;
    const attrs = `id="${inputId}" data-hp-field="${esc(key)}" maxlength="${f.type === "textarea" ? 4000 : 2000}"`;
    let control =
      f.type === "textarea"
        ? `<textarea ${attrs} rows="4">${esc(value)}</textarea>`
        : `<input ${attrs} type="${f.type === "color" ? "color" : "text"}" value="${esc(value)}">`;
    if (f.type === "image")
      control = `<div class="homepage-image">${value ? `<img src="${esc(value)}" alt="Image preview">` : ""}${control}<button type="button" class="button small" data-hp-media="${esc(key)}">${icon("media")} Choose from Media</button></div>`;
    return field(
      inputId,
      f.label,
      control,
      f.type === "image"
        ? "Upload images in Media, or enter a local path / HTTPS image URL."
        : f.type === "url"
          ? "Use a section anchor, local path, HTTPS, email or telephone link."
          : "",
    );
  };
  const paint = () => {
    root.querySelector(".homepage-sections").innerHTML =
      `<button type="button" class="homepage-section-button ${selected === "design" ? "active" : ""}" data-section="design">${icon("themes")} Design & motion</button>` +
      data.order
        .map((sid, index) => {
          const section = response.schema.sections.find((s) => s.id === sid);
          return `<div class="homepage-section-row"><button type="button" class="homepage-section-button ${selected === sid ? "active" : ""}" data-section="${sid}" aria-current="${selected === sid ? "true" : "false"}"><span>${esc(section.label)}</span>${!data.sections[sid].enabled ? "<small>Hidden</small>" : ""}</button><div><button type="button" class="icon-button" data-section-up="${sid}" aria-label="Move ${esc(section.label)} up" ${["header", "footer"].includes(sid) || index === 0 || data.order[index - 1] === "header" ? "disabled" : ""}>${icon("up")}</button><button type="button" class="icon-button" data-section-down="${sid}" aria-label="Move ${esc(section.label)} down" ${["header", "footer"].includes(sid) || index === data.order.length - 1 || data.order[index + 1] === "footer" ? "disabled" : ""}>${icon("down")}</button></div></div>`;
        })
        .join("");
    const pane = root.querySelector("#homepage-fields");
    if (selected === "design")
      pane.innerHTML =
        card(
          "Design & motion",
          "These settings apply to this theme only.",
          ["accent", "background", "foreground"]
            .map((key) =>
              input(
                {
                  type: "color",
                  label: {
                    accent: "Accent color",
                    background: "Background color",
                    foreground: "Text color",
                  }[key],
                },
                data.design[key],
                key,
              ),
            )
            .join("") +
            field(
              "hp-font",
              "Typography",
              `<select id="hp-font"><option value="sans" ${data.design.font === "sans" ? "selected" : ""}>Geist · Sans serif</option><option value="serif" ${data.design.font === "serif" ? "selected" : ""}>Georgia · Serif</option></select>`,
            ),
          icon("themes"),
        ) +
        card(
          "Animation & parallax",
          "Motion respects the visitor's reduced-motion preference. Save, then open Preview to see the effect.",
          field(
            "hp-animation",
            "Entrance animations",
            `<select id="hp-animation" data-hp-field="animation"><option value="on" ${data.design.animation === "on" ? "selected" : ""}>On · Fade and slide into view</option><option value="off" ${data.design.animation === "off" ? "selected" : ""}>Off</option></select>`,
          ) +
            field(
              "hp-parallax",
              "Image parallax",
              `<select id="hp-parallax" data-hp-field="parallax"><option value="gentle" ${data.design.parallax === "gentle" ? "selected" : ""}>Subtle</option><option value="standard" ${data.design.parallax === "standard" ? "selected" : ""}>Standard</option><option value="off" ${data.design.parallax === "off" ? "selected" : ""}>Off</option></select>`,
              "Adds depth to the hero gallery, studio image, and portfolio. Movement is softened on small screens.",
            ),
          icon("spark"),
        );
    else {
      const section = response.schema.sections.find((s) => s.id === selected),
        state = data.sections[selected];
      pane.innerHTML = card(
        section.label,
        "Update this section, then save your homepage.",
        `<label class="check-label"><input type="checkbox" id="hp-enabled" ${state.enabled ? "checked" : ""}>Show this section</label><div class="homepage-field-grid">${section.fields.map((f) => input(f, state.values[f.key], "value-" + f.key)).join("")}</div>`,
        icon("edit"),
      );
      if (section.itemFields?.length)
        pane.innerHTML += `<section class="panel ui-card homepage-items"><header class="ui-card-header"><div class="ui-card-title"><h2>Items <span class="muted">(${state.items.length}/16)</span></h2><button type="button" class="button small" id="hp-add-item" ${state.items.length >= 16 ? "disabled" : ""}>${icon("plus")} Add item</button></div></header><div class="ui-card-content">${state.items.map((item, index) => `<details class="homepage-item" ${index === 0 ? "open" : ""}><summary>${esc(item.title || item.name || item.question || item.label || "Item " + (index + 1))}</summary><div class="homepage-item-fields"><div class="homepage-item-actions"><button type="button" class="button small" data-item-up="${index}" ${index === 0 ? "disabled" : ""}>${icon("up")} Move up</button><button type="button" class="button small" data-item-down="${index}" ${index === state.items.length - 1 ? "disabled" : ""}>${icon("down")} Move down</button><button type="button" class="button small danger" data-item-remove="${index}">${icon("trash")} Remove</button></div>${section.itemFields.map((f) => input(f, item[f.key], `item-${index}-${f.key}`)).join("")}</div></details>`).join("") || '<p class="field-hint">No items yet. Add one to get started.</p>'}</div></section>`;
    }
    root.querySelectorAll("[data-section]").forEach(
      (button) =>
        (button.onclick = () => {
          selected = button.dataset.section;
          paint();
        }),
    );
    const move = (array, index, offset) => {
      const target = index + offset;
      if (target < 0 || target >= array.length) return;
      [array[index], array[target]] = [array[target], array[index]];
      changed();
      paint();
    };
    for (const [attribute, offset] of [
      ["sectionUp", -1],
      ["sectionDown", 1],
    ])
      root
        .querySelectorAll(
          `[data-${attribute === "sectionUp" ? "section-up" : "section-down"}]`,
        )
        .forEach(
          (button) =>
            (button.onclick = () =>
              move(
                data.order,
                data.order.indexOf(button.dataset[attribute]),
                offset,
              )),
        );
    const setValue = (key, value) => {
      if (selected === "design") data.design[key] = value;
      else if (key.startsWith("value-"))
        data.sections[selected].values[key.slice(6)] = value;
      else {
        const [, index, ...parts] = key.split("-");
        data.sections[selected].items[+index][parts.join("-")] = value;
      }
      changed();
    };
    pane
      .querySelectorAll("[data-hp-field]")
      .forEach(
        (element) =>
          (element.oninput = () =>
            setValue(element.dataset.hpField, element.value)),
      );
    pane.querySelectorAll("[data-hp-media]").forEach(
      (button) =>
        (button.onclick = () =>
          pickMedia((media) => {
            setValue(button.dataset.hpMedia, "/media/" + media.id);
            paint();
          })),
    );
    const font = pane.querySelector("#hp-font");
    if (font)
      font.onchange = () => {
        data.design.font = font.value;
        changed();
      };
    const enabled = pane.querySelector("#hp-enabled");
    if (enabled)
      enabled.onchange = () => {
        data.sections[selected].enabled = enabled.checked;
        changed();
        paint();
      };
    const add = pane.querySelector("#hp-add-item");
    if (add)
      add.onclick = () => {
        const section = response.schema.sections.find((s) => s.id === selected);
        data.sections[selected].items.push(
          Object.fromEntries(
            section.itemFields.map((f) => [f.key, f.default || ""]),
          ),
        );
        changed();
        paint();
      };
    for (const [attr, offset] of [
      ["up", -1],
      ["down", 1],
    ])
      pane
        .querySelectorAll(`[data-item-${attr}]`)
        .forEach(
          (button) =>
            (button.onclick = () =>
              move(
                data.sections[selected].items,
                +button.dataset[attr === "up" ? "itemUp" : "itemDown"],
                offset,
              )),
        );
    pane.querySelectorAll("[data-item-remove]").forEach(
      (button) =>
        (button.onclick = () => {
          data.sections[selected].items.splice(+button.dataset.itemRemove, 1);
          changed();
          paint();
        }),
    );
  };
  paint();
  root.querySelector("#save-homepage").onclick = async () => {
    const button = root.querySelector("#save-homepage");
    button.disabled = true;
    try {
      const saved = await api("homepage", "POST", { id, version, data });
      version = saved.version;
      data = saved.data;
      setDirty(false);
      root.querySelector("#homepage-status").textContent = "Saved";
      toast("Homepage saved. Preview your changes.");
    } catch (e) {
      toast(e.message, true);
    } finally {
      button.disabled = false;
    }
  };
}
