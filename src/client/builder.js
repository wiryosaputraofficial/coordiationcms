import {
  blockNames,
  styleOptions,
  devices,
  clone,
  nodeAt,
  listAt,
  moveBlock,
  newBlock,
  flattenBlocks,
  renderBuilder,
  starterTemplates,
  escapeBuilder as esc,
} from "../shared/builder.js";
import { field, nativeSelect } from "./ui.js";
import { icon } from "./icons.js";

/** Native canvas + inspector. Templates insert independent copies, never linked content. */
export function createBuilder(root, initial, options) {
  const { api, toast, openModal, pickMedia, canUpload, user, onChange } =
    options;
  let blocks = clone(initial),
    selected = blocks.length ? "0" : null,
    device = "desktop",
    history = [],
    future = [],
    drag = null,
    previewOnly = false,
    panelTab = "page",
    leftTab = "layers",
    zoom = "fit";
  const documentPanel = options.documentPanel;
  const get = () => clone(blocks);
  const snapshot = () => ({ blocks: get(), layout: options.getLayout() });
  function restore(value) {
    blocks = value.blocks;
    options.setLayout(value.layout);
  }
  function commit(fn) {
    const before = snapshot();
    try {
      fn();
      if (flattenBlocks(blocks).length > 200)
        throw new Error("Up to 200 blocks are allowed.");
      function depth(list, n = 0) {
        if (n > 5)
          throw new Error("Sections support up to five nesting levels.");
        list.forEach((b) => b.children && depth(b.children, n + 1));
      }
      depth(blocks);
      history.push(before);
      if (history.length > 50) history.shift();
      future = [];
      draw();
      onChange();
    } catch (e) {
      restore(before);
      selected = null;
      draw();
      toast(e.message, true);
    }
  }
  const selectedNode = () => {
    try {
      return selected === null ? null : nodeAt(blocks, selected);
    } catch {
      return null;
    }
  };
  const control = (action, label, name) =>
    `<button type="button" class="button small" data-pb-action="${action}">${name ? icon(name) : ""}${label}</button>`;
  function tree(list, parent = "") {
    return `<ol class="pb-tree">${list
      .map((b, i) => {
        const path = parent ? `${parent}.${i}` : String(i);
        return `<li><button type="button" draggable="true" data-pb-select="${path}" class="pb-layer ${path === selected ? "selected" : ""}" aria-pressed="${path === selected}">${icon(b.type === "section" ? "pages" : b.type === "image" ? "media" : b.type === "spacer" ? "divider" : b.type)}<span>${esc((b.content || blockNames[b.type]).slice(0, 45))}</span></button>${b.children?.length ? tree(b.children, path) : ""}</li>`;
      })
      .join("")}</ol>`;
  }
  function inspector() {
    const b = selectedNode();
    if (!b)
      return '<p class="field-hint">Select a block on the canvas or add your first section.</p>';
    const input = (key, label, multiline = false) =>
      field(
        "pb-content-" + key,
        label,
        multiline
          ? `<textarea id="pb-content-${key}" rows="5" maxlength="20000">${esc(b[key])}</textarea>`
          : `<input id="pb-content-${key}" value="${esc(b[key])}" maxlength="2000">`,
      );
    let content =
      b.type === "section"
        ? `<p class="field-hint">Children become columns. Nest sections to build richer layouts.</p>${control("add-inside", "Add inside section", "plus")}`
        : ["divider", "spacer"].includes(b.type)
          ? ""
          : b.type === "image"
            ? input("url", "Image URL") +
              input("alt", "Alternative text") +
              input("caption", "Caption") +
              (canUpload ? control("media", "Media library", "media") : "")
            : input(
                "content",
                b.type === "html"
                  ? "Safe HTML"
                  : b.type === "list"
                    ? "One item per line"
                    : "Content",
                true,
              ) +
              (b.type === "button" ? input("url", "Link URL") : "") +
              (b.type === "heading"
                ? field(
                    "pb-content-level",
                    "Heading level",
                    nativeSelect(
                      "pb-content-level",
                      [1, 2, 3, 4, 5, 6].map((value) => ({
                        value,
                        label: "Heading " + value,
                      })),
                      b.level || 2,
                    ),
                  )
                : "");
    return `<div class="pb-inspector-heading"><strong>${esc(blockNames[b.type])}</strong><span class="badge">${device}</span></div><section class="pb-content-controls" ${panelTab !== "content" ? "hidden" : ""}><div class="pb-inspector-fields">${content || '<p class="field-hint">Use spacing controls below to adjust this block.</p>'}</div></section><section class="pb-design-controls" ${panelTab !== "design" ? "hidden" : ""}><p class="field-hint">${device === "desktop" ? "Desktop values are inherited on smaller screens." : "Override desktop values for this screen size."} Colors use the theme palette.</p><div class="pb-inspector-fields">${designGroups(b)}</div></section><div class="pb-inspector-actions">${control("duplicate", "Duplicate", "pages")}${control("up", "Move up", "up")}${control("down", "Move down", "down")}${control("move", "Move to…", "arrow")}${control("remove", "Remove", "trash")}</div>`;
  }
  function styleControl(b, key, label) {
    return field(
      "pb-style-" + key,
      label,
      nativeSelect(
        "pb-style-" + key,
        [
          { value: "", label: "Default" },
          ...styleOptions[key].map((value) => ({
            value,
            label: String(value),
          })),
        ],
        b.styles?.[device]?.[key] ?? "",
      ),
    );
  }
  function designGroups(b) {
    const spacingBox = (prefix) =>
      `<div class="pb-spacing-box"><span class="pb-spacing-label">${prefix === "padding" ? "PADDING" : "MARGIN"}</span>${["Top", "Right", "Bottom", "Left"].map((side) => `<div class="pb-spacing-${side.toLowerCase()}">${styleControl(b, prefix + side, side)}</div>`).join("")}<span class="pb-spacing-center" aria-hidden="true">${icon("pages")}</span></div>`;
    const group = (label, content, open = true) =>
      `<details class="pb-property-group" ${open ? "open" : ""}><summary>${label}${icon("down")}</summary><div class="pb-property-fields">${content}</div></details>`;
    return [
      ...(b.type === "section"
        ? [
            group(
              "Layout",
              [
                ["layout", "Display"],
                ["direction", "Direction"],
                ["columns", "Columns"],
                ["gap", "Gap"],
                ["vertical", "Align items"],
                ["justify", "Justify"],
              ]
                .map(([key, label]) => styleControl(b, key, label))
                .join(""),
            ),
          ]
        : []),
      group(
        "Spacing",
        `<div class="pb-spacing-defaults">${styleControl(b, "padding", "All padding")}${styleControl(b, "margin", "All margin")}</div>${spacingBox("padding")}${spacingBox("margin")}`,
      ),
      group(
        "Size",
        styleControl(b, "width", "Width") +
          styleControl(b, "minHeight", "Min height"),
      ),
      group(
        "Typography",
        [
          ["font", "Font family"],
          ["size", "Font size"],
          ["weight", "Weight"],
          ["align", "Text align"],
          ["color", "Text color"],
        ]
          .map(([key, label]) => styleControl(b, key, label))
          .join(""),
      ),
      group(
        "Appearance",
        [
          ["background", "Background"],
          ["radius", "Radius"],
          ["border", "Border"],
          ["hidden", "Hidden"],
        ]
          .map(([key, label]) => styleControl(b, key, label))
          .join(""),
      ),
    ].join("");
  }
  function drawCanvas() {
    root.querySelector(".pb-preview").innerHTML = renderBuilder(blocks, {
      interactive: true,
    });
    root
      .querySelectorAll("[data-pb-path]")
      .forEach((el) =>
        el.classList.toggle("pb-selected", el.dataset.pbPath === selected),
      );
  }
  function draw() {
    if (!root.isConnected) return;
    documentPanel.remove();
    root.classList.toggle("pb-preview-only", previewOnly);
    root.innerHTML = `<div class="pb-toolbar"><div>${control("add", "Add block", "plus")}${control("templates", "Templates", "themes")}${control("save-template", "Save template", "download")}${control("preview", previewOnly ? "Edit blocks" : "Preview canvas", "eye")}</div><div class="pb-devices" aria-label="Preview width">${devices.map((d) => `<button type="button" class="button small ${device === d ? "primary" : ""}" data-pb-device="${d}" aria-pressed="${device === d}">${d.charAt(0).toUpperCase() + d.slice(1)}</button>`).join("")}<label for="pb-zoom" class="sr-only">Canvas zoom</label>${nativeSelect(
      "pb-zoom",
      [
        { value: "fit", label: "Fit" },
        { value: "0.5", label: "50%" },
        { value: "0.75", label: "75%" },
        { value: "1", label: "100%" },
      ],
      zoom,
    )}</div><div><button type="button" class="button small" data-pb-action="undo" ${!history.length ? "disabled" : ""}>Undo</button><button type="button" class="button small" data-pb-action="redo" ${!future.length ? "disabled" : ""}>Redo</button></div></div><div class="pb-workbench"><aside class="pb-layers"><nav class="pb-icon-rail" aria-label="Builder tools"><button type="button" data-pb-left="layers" title="Page structure" aria-label="Page structure" aria-pressed="${leftTab === "layers"}">${icon("pages")}</button><button type="button" data-pb-left="insert" title="Insert elements" aria-label="Insert elements" aria-pressed="${leftTab === "insert"}">${icon("plus")}</button><button type="button" data-pb-action="templates" title="Templates" aria-label="Open templates">${icon("themes")}</button><button type="button" data-pb-action="code" title="Edit code" aria-label="Edit code">${icon("code")}</button><button type="button" data-pb-action="save-template" title="Save template" aria-label="Save reusable template">${icon("download")}</button></nav><div class="pb-library-body"><header class="pb-library-header"><strong>${leftTab === "layers" ? "Page structure" : "Insert elements"}</strong><span class="badge">${flattenBlocks(blocks).length}</span></header><div class="pb-panel-scroll">${leftTab === "layers" ? `${tree(blocks)}<p class="field-hint">Drag to reorder · select to edit</p>` : ""}${[
      ["Layouts", ["section", "spacer", "divider"]],
      [
        "Basic",
        Object.keys(blockNames).filter(
          (t) => !["section", "spacer", "divider"].includes(t),
        ),
      ],
    ]
      .map(
        ([label, types]) =>
          `<section class="pb-library-section"><h3>${label}</h3><div class="pb-element-list">${types.map((type) => `<button type="button" data-pb-insert="${type}"><span class="pb-element-icon">${icon(type === "section" ? "pages" : type === "image" ? "media" : type === "spacer" ? "divider" : type)}</span><span><strong>${blockNames[type]}</strong><small>${type === "section" ? "Arrange content visually" : type === "image" ? "Add from your library" : type === "spacer" ? "Give your content space" : type === "html" ? "Add sanitized markup" : "Add to your canvas"}</small></span><span class="pb-element-grip" aria-hidden="true">${icon("menu")}</span></button>`).join("")}</div></section>`,
      )
      .join(
        "",
      )}</div></div></aside><div class="pb-stage"><div class="pb-viewport pb-viewport-${device}"><div class="pb-root"><div class="pb-content pb-preview"></div></div></div><p class="pb-preview-note">${device === "desktop" ? "Desktop · 1200 px" : device === "tablet" ? "Tablet · 768 px" : "Mobile · 375 px"} · Select a block to edit its content and appearance.</p></div><aside class="pb-inspector"><div class="pb-panel-tabs" role="group" aria-label="Inspector tabs">${[
      ["content", "Content", "edit"],
      ["design", "Style", "themes"],
      ["page", "Page", "settings"],
    ]
      .map(
        ([id, label, i]) =>
          `<button type="button" data-pb-panel="${id}" aria-pressed="${panelTab === id}">${icon(i)}${label}</button>`,
      )
      .join(
        "",
      )}</div><div class="pb-panel-scroll"><div class="pb-block-inspector" ${panelTab === "page" ? "hidden" : ""}>${inspector()}</div><div class="pb-document-mount" ${panelTab !== "page" ? "hidden" : ""}></div></div></aside></div>`;
    root.querySelector(".pb-document-mount").append(documentPanel);
    root.querySelector("#pb-zoom")?.addEventListener("change", (e) => {
      zoom = e.target.value;
      fitCanvas();
    });
    drawCanvas();
    fitCanvas();
    root.querySelectorAll('[id^="pb-content-"]').forEach((el) => {
      let recorded = false;
      el.addEventListener("input", () => {
        if (!recorded) {
          history.push(snapshot());
          if (history.length > 50) history.shift();
          future = [];
          recorded = true;
        }
        const key = el.id.slice(11);
        selectedNode()[key] = key === "level" ? Number(el.value) : el.value;
        drawCanvas();
        root.querySelector('[data-pb-action="undo"]').disabled = false;
        root.querySelector('[data-pb-action="redo"]').disabled = true;
        onChange();
      });
    });
    root.querySelectorAll('[id^="pb-style-"]').forEach((el) =>
      el.addEventListener("change", () => {
        const key = el.id.slice(9);
        commit(() => {
          const b = selectedNode();
          b.styles ||= {};
          b.styles[device] ||= {};
          if (el.value === "") delete b.styles[device][key];
          else
            b.styles[device][key] =
              typeof styleOptions[key][0] === "number"
                ? Number(el.value)
                : el.value;
        });
        root.querySelector("#" + el.id)?.focus();
      }),
    );
  }
  function add(parent = "") {
    const d = openModal(
      "Add a block",
      `<div class="block-picker">${Object.entries(blockNames)
        .map(
          ([key, label]) =>
            `<button type="button" data-type="${key}">${icon(key === "section" ? "pages" : key === "image" ? "media" : key === "spacer" ? "divider" : key)}${label}</button>`,
        )
        .join("")}</div>`,
    );
    d.querySelectorAll("[data-type]").forEach((el) =>
      el.addEventListener("click", () => {
        commit(() => {
          const list = listAt(blocks, parent);
          list.push(newBlock(el.dataset.type));
          selected = (parent ? parent + "." : "") + (list.length - 1);
        });
        d.close();
      }),
    );
  }
  async function templates() {
    const saved = await api("content-templates");
    const all = [...starterTemplates, ...saved];
    const d = openModal(
      "Template library",
      `<button type="button" class="button small" id="pb-import-template">Import template JSON</button><p>Insert a copy into this page or post. Later edits won’t change the original template.</p><div class="pb-template-list">${all.map((t, i) => `<article class="panel"><h3>${esc(t.name)}</h3><p class="field-hint">${t.id.startsWith("starter-") ? "Starter template" : "Saved template"} · ${flattenBlocks(t.blocks).length} blocks</p><button type="button" class="button small" data-insert="${i}">Append to content</button> <button type="button" class="button small" data-replace="${i}">Replace content</button> <button type="button" class="button small" data-export="${i}">Export JSON</button>${!t.id.startsWith("starter-") && (t.author_id === user.id || ["administrator", "editor"].includes(user.role)) ? ` <button type="button" class="button small" data-delete="${i}">Delete template</button>` : ""}</article>`).join("")}</div>`,
    );
    d.querySelector("#pb-import-template").addEventListener("click", () => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = ".json,application/json";
      picker.addEventListener("change", async () => {
        try {
          const file = picker.files[0];
          if (!file) return;
          if (file.size > 350000)
            throw new Error("Template files must be smaller than 350 KB.");
          const value = JSON.parse(await file.text());
          if (
            value.format !== "coordiation-content-template" ||
            value.version !== 1
          )
            throw new Error("Unsupported template format.");
          await api("content-templates", "POST", {
            name: value.name,
            blocks: value.blocks,
            layout: value.layout,
          });
          await templates();
          toast("Template imported.");
        } catch (error) {
          toast(error.message, true);
        }
      });
      picker.click();
    });
    d.querySelectorAll("[data-export]").forEach((el) =>
      el.addEventListener("click", () => {
        const t = all[Number(el.dataset.export)];
        const url = URL.createObjectURL(
          new Blob(
            [
              JSON.stringify(
                {
                  format: "coordiation-content-template",
                  version: 1,
                  name: t.name,
                  layout: t.layout,
                  blocks: t.blocks,
                },
                null,
                2,
              ),
            ],
            { type: "application/json" },
          ),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "coordiation-template.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
    );
    for (const action of ["insert", "replace", "delete"])
      d.querySelectorAll(`[data-${action}]`).forEach((el) =>
        el.addEventListener("click", async () => {
          const t = all[Number(el.dataset[action])];
          if (action === "insert") {
            commit(() => {
              blocks.push(...clone(t.blocks));
              selected = "" + (blocks.length - t.blocks.length);
            });
            d.close();
            return;
          }
          const confirm = openModal(
            action === "delete"
              ? "Delete template?"
              : "Replace current content?",
            `<p>${action === "delete" ? "Existing pages using this template will be preserved." : "Your current blocks will be replaced. You can undo this change before leaving the editor."}</p>`,
            '<button type="button" class="button primary" id="pb-confirm">Continue</button>',
          );
          confirm
            .querySelector("#pb-confirm")
            .addEventListener("click", async () => {
              try {
                if (action === "delete")
                  await api("content-templates", "DELETE", {
                    id: t.id,
                    version: t.version,
                  });
                else
                  commit(() => {
                    blocks = clone(t.blocks);
                    options.setLayout(t.layout || "theme");
                    selected = blocks.length ? "0" : null;
                  });
                confirm.close();
                if (action === "delete") await templates();
              } catch (e) {
                toast(e.message, true);
              }
            });
        }),
      );
  }
  async function saveTemplate() {
    const b = selectedNode();
    const existing = (await api("content-templates")).filter(
      (t) =>
        t.author_id === user.id ||
        ["administrator", "editor"].includes(user.role),
    );
    const d = openModal(
      "Save reusable template",
      `${field("pb-template-target", "Save as", nativeSelect("pb-template-target", [{ value: "new", label: "New template" }, ...existing.map((t) => ({ value: t.id, label: "Update: " + t.name }))], "new"))}${field("pb-template-name", "Template name", '<input id="pb-template-name" maxlength="100" required placeholder="My reusable layout">')}${field("pb-template-scope", "Include", nativeSelect("pb-template-scope", [{ value: "all", label: "All content" }, ...(b ? [{ value: "selected", label: "Selected block / section" }] : [])], "all"))}<p class="field-hint">Templates are shared with writers on this site. Save only content intended for reuse.</p>`,
      '<button type="button" class="button primary" id="pb-template-save">Save template</button>',
    );
    d.querySelector("#pb-template-target").addEventListener("change", (e) => {
      const t = existing.find((t) => t.id === e.target.value);
      if (t) d.querySelector("#pb-template-name").value = t.name;
    });
    d.querySelector("#pb-template-save").addEventListener(
      "click",
      async (e) => {
        const name = d.querySelector("#pb-template-name");
        if (!name.reportValidity()) return;
        e.currentTarget.disabled = true;
        try {
          const target = existing.find(
            (t) => t.id === d.querySelector("#pb-template-target").value,
          );
          await api("content-templates", "POST", {
            ...(target ? { id: target.id, version: target.version } : {}),
            name: name.value,
            layout: options.getLayout(),
            blocks:
              d.querySelector("#pb-template-scope").value === "selected"
                ? [clone(b)]
                : get(),
          });
          d.close();
          toast("Template saved.");
        } catch (error) {
          toast(error.message, true);
          e.target.disabled = false;
        }
      },
    );
  }
  function moveDialog() {
    const entries = [{ value: "root", label: "Top level" }];
    function walk(list, parent = "") {
      list.forEach((b, i) => {
        const p = parent ? parent + "." + i : "" + i;
        if (
          b.type === "section" &&
          p !== selected &&
          !p.startsWith(selected + ".")
        ) {
          entries.push({ value: p, label: "Section " + p });
          walk(b.children, p);
        }
      });
    }
    walk(blocks);
    const d = openModal(
      "Move block",
      field(
        "pb-destination",
        "Destination",
        nativeSelect("pb-destination", entries, "root"),
      ),
      '<button type="button" class="button primary" id="pb-move-confirm">Move to end</button>',
    );
    d.querySelector("#pb-move-confirm").addEventListener("click", () => {
      const value = d.querySelector("#pb-destination").value,
        parent = value === "root" ? "" : value;
      commit(() => {
        moveBlock(blocks, selected, parent, listAt(blocks, parent).length);
        selected = null;
      });
      d.close();
    });
  }
  async function codeEditor() {
    const current = await api("builder-document", "POST", {
      blocks: get(),
      layout: options.getLayout(),
    });
    const original = JSON.stringify(
      { blocks: current.blocks, layout: current.layout },
      null,
      2,
    );
    const d = openModal(
      "Code",
      `<div class="pb-code-tabs" role="group" aria-label="Code format"><button type="button" data-code-tab="json" aria-pressed="true">Template JSON</button><button type="button" data-code-tab="html" aria-pressed="false">Rendered HTML</button></div><p class="pb-code-hint">Edit native template JSON. Changes are validated before being applied to the canvas.</p><div class="pb-code-editor"><div class="pb-code-lines" aria-hidden="true"></div><textarea id="pb-code-source" aria-label="Template code" spellcheck="false" maxlength="350000"></textarea></div>`,
      '<button type="button" class="button" id="pb-code-cancel">Cancel</button><button type="button" class="button primary" id="pb-code-apply">Apply to canvas</button>',
    );
    d.classList.add("pb-code-modal");
    d.addEventListener("close", () => d.classList.remove("pb-code-modal"), {
      once: true,
    });
    const input = d.querySelector("#pb-code-source"),
      lines = d.querySelector(".pb-code-lines");
    let edited = original,
      active = "json";
    const numberLines = () => {
      lines.textContent = Array.from(
        { length: input.value.split("\n").length },
        (_, i) => String(i + 1),
      ).join("\n");
    };
    input.value = edited;
    numberLines();
    input.addEventListener("input", () => {
      edited = input.value;
      numberLines();
    });
    input.addEventListener("scroll", () => {
      lines.scrollTop = input.scrollTop;
    });
    d.querySelectorAll("[data-code-tab]").forEach((el) =>
      el.addEventListener("click", () => {
        active = el.dataset.codeTab;
        input.value = active === "json" ? edited : current.html;
        input.readOnly = active !== "json";
        input.setAttribute(
          "aria-label",
          active === "json" ? "Template code" : "Rendered HTML",
        );
        numberLines();
        d.querySelectorAll("[data-code-tab]").forEach((t) =>
          t.setAttribute("aria-pressed", String(t === el)),
        );
      }),
    );
    d.querySelector("#pb-code-cancel").addEventListener("click", () =>
      d.close(),
    );
    d.querySelector("#pb-code-apply").addEventListener("click", async (e) => {
      const button = e.currentTarget;
      button.disabled = true;
      try {
        const value = JSON.parse(edited);
        const validated = await api("builder-document", "POST", value);
        commit(() => {
          blocks = validated.blocks;
          options.setLayout(validated.layout);
          selected = null;
        });
        d.close();
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  }
  async function action(name) {
    if (name === "code") return codeEditor();
    if (name === "preview") {
      previewOnly = !previewOnly;
      draw();
      return;
    }
    if (name === "add") {
      leftTab = "insert";
      previewOnly = false;
      draw();
      return;
    }
    if (name === "add-inside") return add(selected);
    if (name === "templates") return templates();
    if (name === "save-template") return saveTemplate();
    if (name === "undo" || name === "redo") {
      const from = name === "undo" ? history : future,
        to = name === "undo" ? future : history;
      if (from.length) {
        to.push(snapshot());
        restore(from.pop());
        selected = null;
        draw();
        onChange();
      }
      return;
    }
    if (!selectedNode()) return;
    if (name === "move") return moveDialog();
    if (name === "media")
      return pickMedia((m) =>
        commit(() =>
          Object.assign(selectedNode(), {
            url: "/media/" + m.id,
            alt: m.alt,
            caption: m.caption,
          }),
        ),
      );
    commit(() => {
      const keys = selected.split("."),
        i = Number(keys.pop()),
        list = listAt(blocks, keys.join("."));
      if (name === "duplicate") list.splice(i + 1, 0, clone(list[i]));
      else if (name === "remove") {
        list.splice(i, 1);
        selected = null;
      } else {
        const to = i + (name === "up" ? -1 : 1);
        if (to >= 0 && to < list.length) {
          [list[i], list[to]] = [list[to], list[i]];
          selected = (keys.length ? keys.join(".") + "." : "") + to;
        }
      }
    });
  }
  root.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-pb-action]"),
      dev = e.target.closest("[data-pb-device]"),
      node = e.target.closest("[data-pb-select],[data-pb-path]");
    if (e.target.closest(".pb-preview a")) e.preventDefault();
    try {
      const tab = e.target.closest("[data-pb-panel]"),
        left = e.target.closest("[data-pb-left]"),
        insert = e.target.closest("[data-pb-insert]");
      if (tab) {
        panelTab = tab.dataset.pbPanel;
        draw();
        root.querySelector(`[data-pb-panel="${panelTab}"]`).focus();
      } else if (left) {
        leftTab = left.dataset.pbLeft;
        draw();
      } else if (insert) {
        commit(() => {
          const parent = selectedNode()?.type === "section" ? selected : "",
            list = listAt(blocks, parent);
          list.push(newBlock(insert.dataset.pbInsert));
          selected = (parent ? parent + "." : "") + (list.length - 1);
          panelTab = "content";
        });
      } else if (a) await action(a.dataset.pbAction);
      else if (dev) {
        device = dev.dataset.pbDevice;
        draw();
      } else if (node) {
        selected = node.dataset.pbSelect ?? node.dataset.pbPath;
        if (panelTab === "page") panelTab = "content";
        draw();
      }
    } catch (error) {
      toast(error.message, true);
    }
  });
  root.addEventListener("keydown", (e) => {
    const node = e.target.closest("[data-pb-path]");
    if (node && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      selected = node.dataset.pbPath;
      panelTab = "content";
      draw();
      root
        .querySelector(
          ".pb-inspector input,.pb-inspector textarea,.pb-inspector button",
        )
        ?.focus();
    }
  });
  root.addEventListener("dragstart", (e) => {
    const el = e.target.closest("[data-pb-select]");
    if (el) {
      drag = el.dataset.pbSelect;
      e.dataTransfer.setData("text/plain", drag);
      e.dataTransfer.effectAllowed = "move";
    }
  });
  root.addEventListener("dragover", (e) => {
    if (drag !== null && e.target.closest("[data-pb-select],[data-pb-path]")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  });
  root.addEventListener("drop", (e) => {
    const el = e.target.closest("[data-pb-select],[data-pb-path]");
    if (drag === null || !el) return;
    e.preventDefault();
    const target = el.dataset.pbSelect ?? el.dataset.pbPath,
      b = nodeAt(blocks, target);
    commit(() => {
      let parent, index;
      if (b.type === "section") {
        parent = target;
        index = b.children.length;
      } else {
        const keys = target.split(".");
        index = Number(keys.pop());
        parent = keys.join(".");
      }
      moveBlock(blocks, drag, parent, index);
      selected = null;
    });
    drag = null;
  });
  root.addEventListener("dragend", () => {
    drag = null;
  });
  function fitCanvas() {
    const viewport = root.querySelector(".pb-viewport"),
      stage = root.querySelector(".pb-stage");
    if (!viewport || !stage) return;
    const width = device === "desktop" ? 1200 : device === "tablet" ? 768 : 375;
    viewport.style.zoom = String(
      zoom === "fit"
        ? Math.min(1, Math.max(0.15, (stage.clientWidth - 48) / width))
        : Number(zoom),
    );
  }
  const resize = new ResizeObserver(fitCanvas);
  resize.observe(root);
  draw();
  return {
    dispose() {
      resize.disconnect();
    },
    get,
    add: () => add(),
    set(next) {
      commit(() => {
        blocks = clone(next);
        selected = blocks.length ? "0" : null;
      });
    },
  };
}
