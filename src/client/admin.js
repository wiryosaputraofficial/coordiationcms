import { renderAISettings, openWritingAssistant } from "./ai.js";
import { renderHomepageEditor } from "./homepage.js";
import { card, field, switchField } from "./ui.js";
import { analyzeSEO } from "../shared/seo.js";
import { icon } from "./icons.js";
import { initializeComponents } from "./components.js";
initializeComponents();
const $ = (s, root = document) => root.querySelector(s),
  $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const statusNames = {
  published: "Published",
  draft: "Draft",
  pending: "Pending review",
  scheduled: "Scheduled",
  trash: "Trash",
  approved: "Approved",
  spam: "Spam",
};
const badge = (s) =>
  `<span class="badge ${esc(s)}"><span class="badge-dot"></span>${esc(statusNames[s] || s)}</span>`;
const date = (v) =>
  new Date(v).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const time = (v) =>
  new Date(v).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const roles = {
  administrator: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  subscriber: "Subscriber",
};
let user,
  site,
  dashboard,
  editor = null,
  dirty = false,
  autosaveTimer,
  toastTimer,
  routeVersion = 0;
const isAdmin = () => user.role === "administrator";
const isEditor = () => ["administrator", "editor"].includes(user.role);
const isWriter = () => user.role !== "subscriber";
const canUpload = () =>
  ["administrator", "editor", "author"].includes(user.role);
async function api(path, method = "GET", data) {
  const options = { method };
  if (data instanceof FormData) options.body = data;
  else if (data !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(data);
  }
  const r = await fetch("/api/cms/" + path, options);
  if (r.status === 401) {
    location.href = "/login";
    throw new Error("Your session has expired.");
  }
  let result;
  try {
    result = await r.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  if (!r.ok) throw new Error(result.error || "The request failed.");
  return result;
}
function toast(message, error = false) {
  clearTimeout(toastTimer);
  const el = $("#toast");
  el.textContent = message;
  el.className = "toast" + (error ? " error" : "");
  el.hidden = false;
  toastTimer = setTimeout(() => (el.hidden = true), 6000);
}
function bind(selector, event, fn, root = document) {
  const e = $(selector, root);
  if (e)
    e.addEventListener(event, async (ev) => {
      try {
        await fn(ev);
      } catch (error) {
        toast(error.message, true);
      }
    });
}
function button(label, action, kind = "", i) {
  return `<button class="button ${kind}" data-action="${action}">${i ? icon(i) : ""}${label}</button>`;
}
function heading(title, description, actions = "") {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function empty(title, description, action = "") {
  return `<div class="empty">${icon("posts")}<h3>${title}</h3><p>${description}</p>${action}</div>`;
}
function openModal(title, body, footer = "") {
  const d = $("#modal");
  $("#modal-content").innerHTML =
    `<div class="modal-header"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-close aria-label="Close">${icon("close")}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ""}`;
  d.setAttribute("aria-labelledby", "dialog-title");
  if (!d.open) d.showModal();
  bind("[data-close]", "click", () => d.close(), d);
  return d;
}
async function confirmAction(title, message, fn) {
  const d = openModal(
    title,
    `<p>${message}</p>`,
    button("Cancel", "cancel") + button("Yes, continue", "confirm", "danger"),
  );
  bind("[data-action=cancel]", "click", () => d.close(), d);
  bind(
    "[data-action=confirm]",
    "click",
    async (e) => {
      const actionButton = e.currentTarget;
      actionButton.disabled = true;
      try {
        await fn();
        d.close();
      } finally {
        actionButton.disabled = false;
      }
    },
    d,
  );
}
function miniTheme(t, compact = false) {
  if (t.id === "teraform" || t.hasHomepage)
    return `<div class="mini-browser-bar"><i></i><i></i><i></i></div><div class="teraform-thumbnail"><div><span>TERAFORM ${icon("spark")}</span><h3>Your next<br>chapter.<br><em>Designed.</em></h3><p>Brand. Digital. Product.</p><b>Explore ${icon("external")}</b></div><img src="/theme-assets/teraform/ember.svg" alt="Teraform abstract artwork"></div>`;
  const id = ["folio", "gazette", "mono"].includes(t.id) ? t.id : "custom";
  return `<div class="mini-browser-bar"><i></i><i></i><i></i></div><div class="mini-site preview-${id}"><div class="mini-nav"><b>${esc(site.title)}</b><span>Journal &nbsp; About &nbsp; ${icon("external")}</span></div><h3>${id === "gazette" ? "Stories worth<br>staying for." : id === "mono" ? "Make room<br>for your ideas." : "A space for<br>your next story."}</h3><p>${compact ? "Ideas, stories, and things that matter." : esc(t.description || "Stories and creative work, in your own space.")}</p><div class="mini-lines"><span></span><span></span><span></span></div></div>`;
}
function nav() {
  const groups = [
    [
      "WORKSPACE",
      [
        ["dashboard", "Dashboard"],
        ["posts", "Posts"],
        ["pages", "Pages"],
        ["media", "Media"],
        ["comments", "Comments"],
        ["inquiries", "Form inbox"],
      ],
    ],
    [
      "YOUR SITE",
      [
        ["themes", "Themes"],
        ["menus", "Menus"],
        ["plugins", "Plugins"],
        ["users", "Users"],
      ],
    ],
    [
      "MANAGEMENT",
      [
        ["tools", "Tools"],
        ["settings", "Settings"],
      ],
    ],
  ];
  $("#navigation").innerHTML = groups
    .map(([label, items]) => {
      const filtered = items.filter(
        ([id]) =>
          id === "dashboard" ||
          (id === "posts" && isWriter()) ||
          (id === "pages" && isEditor()) ||
          (id === "media" && canUpload()) ||
          (id === "comments" && isEditor()) ||
          (id === "inquiries" && isAdmin()) ||
          ([
            "themes",
            "menus",
            "plugins",
            "users",
            "tools",
            "settings",
          ].includes(id) &&
            isAdmin()),
      );
      return filtered.length
        ? `<div class="nav-label">${label}</div>${filtered.map(([id, name]) => `<a href="#${id}" class="nav-item" data-nav="${id}">${icon(id === "menus" ? "menu" : id === "inquiries" ? "email" : id)}<span>${name}</span>${id === "comments" && dashboard.commentCount ? `<span class="nav-count">${dashboard.commentCount}</span>` : ""}</a>`).join("")}`
        : "";
    })
    .join("");
  $("#sidebar-title").textContent = site.title;
  $("#user-name").textContent = user.name;
  $("#user-initial").textContent = user.name.slice(0, 2).toUpperCase();
}
function contentRow(p, small = false) {
  return `<tr><td class="title-cell"><a href="#edit/${p.id}">${esc(p.title)}</a><span class="subline">${small ? (p.type === "page" ? "Pages" : "Posts") : "/" + esc(p.slug)}</span></td><td>${badge(p.status)}</td><td>${date(p.updated_at)}</td>${small ? "" : `<td><div class="row-actions"><a class="button small" href="#edit/${p.id}">${icon("edit")} Edit</a><button class="icon-button" data-trash="${p.id}" aria-label="${p.status === "trash" ? "Delete permanently" : "Move to trash"}">${icon("trash")}</button></div></td>`}</tr>`;
}
async function renderDashboard() {
  dashboard = await api("dashboard");
  site = dashboard.settings;
  nav();
  const stats = dashboard.stats;
  const sum = (type, status) =>
    stats
      .filter((s) => s.type === type && (!status || s.status === status))
      .reduce((n, s) => n + s.count, 0);
  const active = dashboard.themes.find((t) => t.id === site.activeTheme) || {
    name: "Themes",
    id: "folio",
    version: "1.0",
  };
  $("#workspace").innerHTML =
    heading(
      `Welcome back, ${esc(user.name.split(" ")[0])} ${icon("spark")}`,
      "Everything you need to manage your site, in one place.",
      isWriter()
        ? `<a href="#new/post" class="button primary">${icon("plus")} Write a post</a>`
        : "",
    ) +
    `<section class="welcome-panel"><div><span class="eyebrow">YOUR CREATIVE SPACE</span><h2>Great ideas deserve a place to live.</h2><p>Share a story, refresh your look, and make this little corner of the internet your own.</p>${isAdmin() ? `<a href="#themes" class="button">Explore themes ${icon("arrow")}</a>` : `<a href="/" class="button" target="_blank" rel="noopener">View site ${icon("arrow")}</a>`}</div><div class="welcome-motif">${icon("posts")}</div></section><div class="stats-grid">${[
      ["Posts", sum("post"), "posts", `${sum("post", "published")} published`],
      [
        "Pages",
        sum("page"),
        "pages",
        `${sum("page", "published")} published pages`,
      ],
      ["Media", dashboard.mediaCount, "media", "In your media library"],
      ["Comments", dashboard.commentCount, "comments", "Awaiting approval"],
    ]
      .map(
        ([label, count, i, foot]) =>
          `<div class="stat-card"><div class="stat-top"><span>${label}</span>${icon(i)}</div><div class="stat-value">${count}</div><div class="stat-foot">${foot}</div></div>`,
      )
      .join(
        "",
      )}</div><div class="dashboard-grid"><div><section class="panel"><div class="panel-head"><h2>Recent content</h2>${isWriter() ? `<a class="text-link" href="#posts">View all ${icon("arrow")}</a>` : ""}</div>${dashboard.recent.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Updated</th></tr></thead><tbody>${dashboard.recent.map((p) => contentRow(p, true)).join("")}</tbody></table></div>` : empty("Start your first story", "The content you create will appear here.")}</section><section class="panel activity-panel"><div class="panel-head"><h2>Recent activity</h2>${icon("clock")}</div><div class="panel-body">${dashboard.activity.length ? dashboard.activity.map((a) => `<div class="activity-item"><span class="activity-icon">${icon("edit")}</span><div><p>${esc(a.message)}</p><small>${esc(a.actor)} · ${time(a.created_at)}</small></div></div>`).join("") : '<p class="muted">No activity yet.</p>'}</div></section></div><div><section class="panel"><div class="panel-head"><h2>Active theme</h2><span class="badge published"><span class="badge-dot"></span>Active</span></div><div class="theme-feature">${miniTheme(active, true)}</div><div class="theme-info"><div><strong>${esc(active.name)}</strong><p>By Coordiation Studio · v${esc(active.version)}</p></div>${icon("themes")}</div><div class="theme-buttons">${isAdmin() ? '<a href="#customize" class="button">Customize</a>' : ""}<a href="/" target="_blank" rel="noopener" class="button">View site ${icon("external")}</a></div></section>${isWriter() ? `<section class="panel quick-draft"><div class="panel-head"><h2>Quick draft</h2>${icon("edit")}</div><form id="quick-draft" class="panel-body"><label class="sr-only" for="draft-title">Draft title</label><input id="draft-title" name="title" placeholder="A title for your next idea…" required maxlength="250"><label class="sr-only" for="draft-body">Draft content</label><textarea id="draft-body" name="content" placeholder="What is on your mind?" class="draft-content"></textarea><div class="draft-actions"><span>Save now. Make it great later.</span><button class="button small primary">Save draft</button></div></form></section>` : ""}</div></div>`;
  bind("#quick-draft", "submit", async (e) => {
    e.preventDefault();
    const b = Object.fromEntries(new FormData(e.target));
    await api("posts", "POST", {
      title: b.title,
      blocks: [{ type: "paragraph", content: b.content }],
      status: "draft",
    });
    toast("Draft saved.");
    await renderDashboard();
  });
}
async function renderPosts(type) {
  const posts = (await api("posts")).filter((p) => p.type === type),
    name = type === "post" ? "Posts" : "Pages";
  let tab = "all",
    query = "";
  $("#workspace").innerHTML =
    heading(
      name,
      `${posts.filter((p) => p.status !== "trash").length} ${name.toLowerCase()} in your workspace.`,
      `<a href="#new/${type}" class="button primary">${icon("plus")} Add ${name.toLowerCase()}</a>`,
    ) +
    `<div class="toolbar"><div class="tabs">${["all", "published", "draft", "pending", "scheduled", "trash"].map((s) => `<button class="tab ${s === "all" ? "active" : ""}" data-tab="${s}">${s === "all" ? "All" : statusNames[s]} <small>${posts.filter((p) => (s === "all" ? p.status !== "trash" : p.status === s)).length}</small></button>`).join("")}</div><div class="search-box"><input id="content-search" aria-label="Search content" placeholder="Search by title or slug…"></div></div><section class="panel" id="post-table"></section>`;
  const paint = () => {
    const items = posts.filter(
      (p) =>
        (tab === "all" ? p.status !== "trash" : p.status === tab) &&
        (p.title + " " + p.slug).toLowerCase().includes(query),
    );
    $("#post-table").innerHTML = items.length
      ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${items.map((p) => contentRow(p)).join("")}</tbody></table></div>`
      : empty(
          "No content found",
          "Try another filter or create something new.",
        );
    $$("[data-trash]").forEach((el) =>
      bind(`[data-trash="${el.dataset.trash}"]`, "click", () => {
        const p = posts.find((x) => x.id === el.dataset.trash);
        confirmAction(
          p.status === "trash" ? "Delete permanently?" : "Move to trash?",
          p.status === "trash"
            ? "This content and its revisions will be permanently deleted."
            : "You can restore this content from the Trash tab.",
          async () => {
            await api(
              "posts",
              p.status === "trash" ? "DELETE" : "POST",
              p.status === "trash"
                ? { id: p.id, version: p.version }
                : { ...p, status: "trash" },
            );
            toast("Content updated.");
            await renderPosts(type);
          },
        );
      }),
    );
  };
  paint();
  $$("[data-tab]").forEach((el) =>
    el.addEventListener("click", () => {
      tab = el.dataset.tab;
      $$("[data-tab]").forEach((e) => e.classList.toggle("active", e === el));
      paint();
    }),
  );
  bind("#content-search", "input", (e) => {
    query = e.target.value.toLowerCase();
    paint();
  });
}
const blockNames = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  quote: "Quote",
  list: "List",
  code: "Code",
  divider: "Divider",
  button: "Button",
  html: "Safe HTML",
};
function readEditor() {
  if (!editor) return null;
  const f = $("#post-form"),
    b = { ...editor.post };
  for (const k of [
    "title",
    "slug",
    "excerpt",
    "status",
    "visibility",
    "featured_id",
  ])
    b[k] = f.elements[k]?.value || "";
  b.seo = {
    title: f.elements.seo_title.value,
    description: f.elements.seo_description.value,
    canonical: f.elements.seo_canonical.value,
    noindex: f.elements.seo_noindex.checked,
  };
  b.comments_open = f.elements.comments_open.checked;
  b.categories = $$("[name=categories]:checked", f).map((x) => x.value);
  b.tags = $$("[name=tags]:checked", f).map((x) => x.value);
  b.publish_at = f.elements.publish_at.value
    ? new Date(f.elements.publish_at.value).toISOString()
    : null;
  b.blocks = $$(".editor-block").map((el) => ({
    type: el.dataset.type,
    content: $("[data-field=content]", el)?.value || "",
    url: $("[data-field=url]", el)?.value || "",
    alt: $("[data-field=alt]", el)?.value || "",
    caption: $("[data-field=caption]", el)?.value || "",
    level: Number($("[data-field=level]", el)?.value || 2),
  }));
  return b;
}
function updateSEO() {
  const container = $("#seo-analysis");
  if (!container || !editor) return;
  const expanded = container.querySelector("details")?.open;
  const result = analyzeSEO(readEditor(), site.title);
  container.innerHTML = `<div class="seo-score-row"><strong>${result.score}<small>/100</small></strong><span>${result.label}</span></div><meter class="seo-meter" min="0" max="100" low="50" high="80" optimum="100" value="${result.score}" aria-label="SEO readiness">${result.score} out of 100</meter><p class="field-hint">Editorial guidance, not a ranking guarantee.</p><div class="seo-search-preview"><span class="eyebrow">Search preview</span><span class="seo-preview-url">/${esc(result.slug || "your-page")}</span><strong>${esc(result.title || "Your page title")}</strong><p>${esc(result.description || "Add an excerpt to describe this page in search results.")}</p></div><p class="field-hint">${result.indexable ? "Published and public: eligible for search indexing." : readEditor()?.seo?.noindex ? "Search indexing is disabled for this content." : "This content is not public yet. Search engines cannot index a draft or private preview."}</p><details class="seo-details" ${expanded ? "open" : ""}><summary>Review ${result.checks.filter((c) => !c.pass && c.applicable !== false).length} suggestions</summary><ul class="seo-checks">${result.checks.map((c) => `<li class="${c.applicable === false ? "seo-neutral" : c.pass ? "seo-pass" : "seo-improve"}"><strong>${icon(c.applicable === false ? "divider" : c.pass ? "check" : "spark")} ${esc(c.label)}</strong><p>${esc(c.detail)}</p></li>`).join("")}</ul></details>`;
}
function paintBlocks(blocks) {
  $("#blocks").innerHTML = blocks
    .map(
      (b, i) =>
        `<div class="editor-block" data-type="${b.type}"><div class="block-tools"><span class="block-type-label">${icon(b.type === "image" ? "media" : b.type)} ${blockNames[b.type]}</span><button type="button" class="icon-button" data-up="${i}" aria-label="Move block up" ${i === 0 ? "disabled" : ""}>${icon("up")}</button><button type="button" class="icon-button" data-down="${i}" aria-label="Move block down" ${i === blocks.length - 1 ? "disabled" : ""}>${icon("down")}</button><button type="button" class="icon-button" data-remove="${i}" aria-label="Remove block">${icon("close")}</button></div>${b.type === "divider" ? "<hr>" : b.type === "image" ? `<input data-field="url" placeholder="Image URL /media/… or HTTPS" aria-label="Image URL" value="${esc(b.url)}"><input data-field="alt" placeholder="Alternative text" aria-label="Alternative text" value="${esc(b.alt)}"><input data-field="caption" placeholder="Image caption" aria-label="Image caption" value="${esc(b.caption)}">${canUpload() ? `<button type="button" class="button small" data-block-media="${i}">${icon("media")} Choose from library</button>` : ""}` : `${b.type === "heading" ? `<select data-field="level" aria-label="Heading level"><option value="2">Heading 2</option><option value="3" ${b.level === 3 ? "selected" : ""}>Heading 3</option></select>` : ""}<textarea data-field="content" aria-label="${blockNames[b.type]}" placeholder="${b.type === "list" ? "One item per line…" : b.type === "html" ? "HTML will be sanitized when saved…" : "Start writing…"}">${esc(b.content)}</textarea>${b.type === "button" ? `<input data-field="url" aria-label="Button URL" value="${esc(b.url)}" placeholder="https://…">` : ""}`}</div>`,
    )
    .join("");
  for (const action of ["up", "down", "remove"])
    $$(`[data-${action}]`).forEach((el) =>
      el.addEventListener("click", () => {
        const all = readEditor().blocks,
          i = Number(el.dataset[action]);
        if (action === "remove") all.splice(i, 1);
        else {
          const to = i + (action === "up" ? -1 : 1);
          if (to < 0 || to >= all.length) return;
          [all[i], all[to]] = [all[to], all[i]];
        }
        paintBlocks(all);
        dirty = true;
      }),
    );
  $$("[data-block-media]").forEach((el) =>
    bind(`[data-block-media="${el.dataset.blockMedia}"]`, "click", () =>
      pickMedia((m) => {
        const blocks = readEditor().blocks;
        blocks[+el.dataset.blockMedia] = {
          ...blocks[+el.dataset.blockMedia],
          url: "/media/" + m.id,
          alt: m.alt,
          caption: m.caption,
        };
        paintBlocks(blocks);
        dirty = true;
      }),
    ),
  );
  updateSEO();
}
async function renderEditor(id, type = "post") {
  const [result, terms] = await Promise.all([
    id
      ? api("posts?id=" + id)
      : Promise.resolve({
          post: {
            type,
            title: "",
            slug: "",
            excerpt: "",
            blocks: [{ type: "paragraph", content: "" }],
            status: "draft",
            visibility: "public",
            categories: [],
            tags: [],
            comments_open: true,
          },
          revisions: [],
        }),
    api("terms"),
  ]);
  editor = result;
  dirty = false;
  const p = result.post;
  $("#workspace").innerHTML =
    heading(
      id
        ? "Edit " + (p.type === "page" ? "page" : "post")
        : "A new story starts here.",
      "Bring your ideas together, one block at a time.",
      `<span id="save-status" class="muted">${id ? "Saved" : "New draft"}</span>${id ? `<a class="button" href="/${esc(p.slug)}?preview=1" target="_blank" rel="noopener">${icon("eye")} Preview</a>` : ""}${button("AI writing", "ai-writing", "", "spark")}${button("Save", "save-post", "primary", "check")}`,
    ) +
    `${result.autosave ? '<div class="inline-alert">An unsaved autosave is available. <button class="button small" data-action="recover-autosave">Recover autosave</button></div>' : ""}<form id="post-form"><div class="editor-layout"><div class="editor-canvas"><label class="sr-only" for="post-title">Title</label><input name="title" id="post-title" class="title-input" placeholder="Add a title…" value="${esc(p.title)}" required maxlength="250"><label class="sr-only" for="post-excerpt">Excerpt</label><textarea id="post-excerpt" name="excerpt" class="excerpt-input" placeholder="A short introduction for your readers…">${esc(p.excerpt)}</textarea><div id="blocks" class="block-list"></div><button type="button" class="block-add" data-action="add-block">${icon("plus")} Add a block</button></div><aside class="editor-sidebar"><section class="panel seo-panel"><div class="panel-head"><h2>SEO meter</h2>${icon("spark")}</div><div class="panel-body" id="seo-analysis"></div><div class="panel-body"><label>SEO title<input name="seo_title" value="${esc(p.seo?.title || "")}" maxlength="120" placeholder="Use the article title"></label><label>Meta description<textarea name="seo_description" maxlength="320" placeholder="Use the excerpt">${esc(p.seo?.description || "")}</textarea></label><label>Canonical URL<input name="seo_canonical" value="${esc(p.seo?.canonical || "")}" type="url" placeholder="Automatic URL"></label><label class="check-label"><input type="checkbox" name="seo_noindex" ${p.seo?.noindex ? "checked" : ""}>Exclude from search indexing</label><p class="field-hint">The site name is added to the SEO title. Leave canonical empty unless this content belongs at another URL.</p></div></section><section class="panel"><div class="panel-head"><h2>Publishing</h2>${icon("settings")}</div><div class="panel-body"><label>Status<select name="status">${Object.entries(
      statusNames,
    )
      .filter(
        ([s]) =>
          ["draft", "pending", "published", "scheduled", "trash"].includes(s) &&
          (user.role !== "contributor" ||
            ["draft", "pending", "trash"].includes(s)),
      )
      .map(
        ([s, n]) =>
          `<option value="${s}" ${p.status === s ? "selected" : ""}>${n}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Visibility<select name="visibility"><option value="public">Public</option><option value="private" ${p.visibility === "private" ? "selected" : ""}>Private (editor preview)</option></select></label><label>Publish date<input name="publish_at" type="datetime-local" value="${p.publish_at ? localDate(p.publish_at) : ""}"><p class="field-hint">Choose Scheduled to publish automatically. Time follows your device timezone.</p></label><label>Slug<input name="slug" value="${esc(p.slug)}" placeholder="post-title"></label><label class="check-label"><input name="comments_open" type="checkbox" ${p.comments_open ? "checked" : ""}>Show comments on this ${p.type === "page" ? "page" : "post"}</label><p class="field-hint">Site-wide comment settings also apply.</p></div></section><section class="panel"><div class="panel-head"><h2>Featured image</h2></div><div class="panel-body"><input type="hidden" name="featured_id" value="${esc(p.featured_id || "")}"><button type="button" class="cover-picker" data-action="pick-cover">${p.featured_id ? `<img src="/media/${p.featured_id}" alt="Featured image">` : `${icon("media")} Choose image`}</button><button type="button" class="button small ghost" data-action="clear-cover">Clear selection</button></div></section>${[
      "category",
      "tag",
    ]
      .map(
        (kind) =>
          `<section class="panel"><div class="panel-head"><h2>${kind === "category" ? "Categories" : "Tag"}</h2>${isEditor() ? `<a href="#terms/${kind}" class="text-link">Manage</a>` : ""}</div><div class="panel-body">${
            terms
              .filter((t) => t.kind === kind)
              .map(
                (t) =>
                  `<label class="check-label"><input type="checkbox" name="${kind === "category" ? "categories" : "tags"}" value="${t.id}" ${(kind === "category" ? p.categories : p.tags).includes(t.id) ? "checked" : ""}>${esc(t.name)}</label>`,
              )
              .join("") ||
            '<p class="field-hint">None yet. Use Manage to add one.</p>'
          }</div></section>`,
      )
      .join("")}${
      result.revisions.length
        ? `<section class="panel"><div class="panel-head"><h2>Revision history</h2></div><div class="panel-body revisions">${result.revisions
            .slice(0, 10)
            .map(
              (r) =>
                `<button type="button" data-revision="${r.id}">${icon("clock")} ${time(r.created_at)}</button>`,
            )
            .join("")}</div></section>`
        : ""
    }</aside></div></form>`;
  paintBlocks(p.blocks);
  bind("#post-form", "submit", (e) => e.preventDefault());
  bind("#post-form", "input", () => {
    updateSEO();
    dirty = true;
    $("#save-status").textContent = "Unsaved changes";
    clearTimeout(autosaveTimer);
    if (editor.post.id)
      autosaveTimer = setTimeout(async () => {
        try {
          await api("autosave", "POST", readEditor());
          $("#save-status").textContent = "Autosave saved";
        } catch (e) {
          toast(e.message, true);
        }
      }, 2500);
  });
  bind("[data-action=save-post]", "click", async (e) => {
    const actionButton = e.currentTarget;
    actionButton.disabled = true;
    try {
      const post = await api("posts", "POST", readEditor());
      dirty = false;
      clearTimeout(autosaveTimer);
      toast("Content saved successfully.");
      if (id === post.id) await renderEditor(id);
      else location.hash = "edit/" + post.id;
    } finally {
      actionButton.disabled = false;
    }
  });
  bind("[data-action=add-block]", "click", () => {
    const d = openModal(
      "Add a block",
      `<div class="block-picker">${Object.entries(blockNames)
        .map(
          ([key, name]) =>
            `<button data-block="${key}">${icon(key === "image" ? "media" : key)}${name}</button>`,
        )
        .join("")}</div>`,
    );
    $$("[data-block]", d).forEach((el) =>
      el.addEventListener("click", () => {
        const blocks = readEditor().blocks;
        blocks.push({ type: el.dataset.block, content: "" });
        paintBlocks(blocks);
        dirty = true;
        d.close();
      }),
    );
  });
  bind("[data-action=pick-cover]", "click", () => {
    if (!canUpload())
      throw new Error("Your role cannot access the media library.");
    return pickMedia((m) => {
      $("#post-form").elements.featured_id.value = m.id;
      $("[data-action=pick-cover]").innerHTML =
        `<img src="/media/${m.id}" alt="Featured image">`;
      dirty = true;
    });
  });
  bind("[data-action=ai-writing]", "click", () =>
    openWritingAssistant({
      api,
      toast,
      openModal,
      readEditor,
      isAdmin: isAdmin(),
      apply: (task, value, blocks) => {
        const form = $("#post-form");
        if (task === "title") form.elements.seo_title.value = value;
        else if (task === "description")
          form.elements.seo_description.value = value;
        else
          paintBlocks(
            task === "improve" ? blocks : [...readEditor().blocks, ...blocks],
          );
        dirty = true;
        updateSEO();
      },
    }),
  );
  bind("[data-action=clear-cover]", "click", () => {
    $("#post-form").elements.featured_id.value = "";
    $("[data-action=pick-cover]").innerHTML = "Choose image";
    dirty = true;
  });
  bind("[data-action=recover-autosave]", "click", () => {
    const saved = JSON.parse(result.autosave.snapshot),
      form = $("#post-form");
    for (const k of [
      "title",
      "slug",
      "excerpt",
      "status",
      "visibility",
      "featured_id",
    ])
      if (form.elements[k]) form.elements[k].value = saved[k] || "";
    for (const key of ["title", "description", "canonical"])
      form.elements["seo_" + key].value = saved.seo?.[key] || "";
    form.elements.seo_noindex.checked = saved.seo?.noindex === true;
    form.elements.comments_open.checked = !!saved.comments_open;
    form.elements.publish_at.value = saved.publish_at
      ? localDate(saved.publish_at)
      : "";
    for (const k of ["categories", "tags"])
      $$(`[name=${k}]`, form).forEach(
        (el) => (el.checked = saved[k].includes(el.value)),
      );
    paintBlocks(saved.blocks);
    dirty = true;
    $(".inline-alert").remove();
    toast("Autosave recovered. Click Save to apply it.");
  });
  $$("[data-revision]").forEach((el) =>
    bind(`[data-revision="${el.dataset.revision}"]`, "click", () =>
      confirmAction(
        "Restore revision?",
        "The current version will be preserved in revision history.",
        async () => {
          await api("restore", "POST", {
            id: p.id,
            revision: el.dataset.revision,
            version: p.version,
          });
          dirty = false;
          toast("Revision restored.");
          await renderEditor(p.id);
        },
      ),
    ),
  );
}
function localDate(v) {
  const d = new Date(v);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
async function pickMedia(callback) {
  const items = await api("media");
  const d = openModal(
    "Choose media",
    items.length
      ? `<div class="media-grid">${items.map((m) => `<div class="media-card"><button data-pick="${m.id}" aria-label="Select ${esc(m.name)}"><img src="/media/${m.id}" alt="${esc(m.alt || m.name)}"></button><div class="media-card-info"><strong>${esc(m.name)}</strong></div></div>`).join("")}</div>`
      : empty("Your library is empty", "Upload an image from the Media page."),
  );
  $$("[data-pick]", d).forEach((el) =>
    el.addEventListener("click", () => {
      callback(items.find((m) => m.id === el.dataset.pick));
      d.close();
    }),
  );
}
async function renderMedia() {
  const items = await api("media");
  $("#workspace").innerHTML =
    heading(
      "Media library",
      `${items.length} images to bring your stories to life.`,
      button("Upload media", "upload-media", "primary", "upload"),
    ) +
    `<input id="media-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>${items.length ? `<div class="media-grid">${items.map((m) => `<article class="media-card"><button data-media="${m.id}" aria-label="Detail ${esc(m.name)}"><img src="/media/${m.id}" alt="${esc(m.alt || m.name)}" loading="lazy"></button><div class="media-card-info"><strong>${esc(m.name)}</strong><small>${Math.ceil(m.size / 1024)} KB · ${date(m.created_at)}</small></div></article>`).join("")}</div>` : `<section class="panel">${empty("Give your story a picture", "Upload PNG, JPG, GIF, or WebP. Up to 800 KB per image.")}</section>`}`;
  bind("[data-action=upload-media]", "click", () => $("#media-upload").click());
  bind("#media-upload", "change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const form = new FormData();
    form.append("file", f);
    await api("media", "POST", form);
    toast("Media uploaded.");
    await renderMedia();
  });
  $$("[data-media]").forEach((el) =>
    bind(`[data-media="${el.dataset.media}"]`, "click", () => {
      const m = items.find((x) => x.id === el.dataset.media);
      const d = openModal(
        "Detail media",
        `<img class="media-detail-img" src="/media/${m.id}" alt="${esc(m.alt)}"><form id="media-meta"><label>File name<input readonly value="${esc(m.name)}"></label><label>Alternative text<input name="alt" value="${esc(m.alt)}" maxlength="500"></label><label>Caption<textarea name="caption">${esc(m.caption)}</textarea></label><label>URL<input readonly value="${location.origin}/media/${m.id}"></label></form>`,
        button("Delete", "delete-media", "danger") +
          button("Save", "save-media", "primary"),
      );
      bind(
        "[data-action=save-media]",
        "click",
        async () => {
          await api("media-meta", "POST", {
            id: m.id,
            ...Object.fromEntries(new FormData($("#media-meta"))),
          });
          d.close();
          toast("Media updated.");
          await renderMedia();
        },
        d,
      );
      bind(
        "[data-action=delete-media]",
        "click",
        () => {
          confirmAction(
            "Delete media?",
            "Deleted images cannot be recovered.",
            async () => {
              await api("media", "DELETE", { id: m.id });
              toast("Media deleted.");
              await renderMedia();
            },
          );
        },
        d,
      );
    }),
  );
}
async function renderThemes() {
  const data = await api("themes");
  $("#workspace").innerHTML =
    heading(
      "Themes",
      "A different look. The same story, entirely yours.",
      button("Create theme", "create-theme", "", "plus") +
        button("Install theme", "install-theme", "primary", "upload"),
    ) +
    `<input type="file" id="theme-file" accept=".zip" hidden><div class="theme-grid">${data.items.map((t) => `<article class="theme-card ${t.id === data.active ? "is-active" : ""}">${miniTheme(t)}<div class="theme-card-body"><h2>${esc(t.name)}${t.id === data.active ? '<span class="badge published">Active</span>' : ""}</h2><p>${esc(t.description)}</p><div class="theme-card-meta">${esc(t.author)} · v${esc(t.version)} · ${esc(t.license)}</div><div class="heading-actions">${t.id === data.active ? '<a href="#customize" class="button small primary">Customize</a>' : `<button class="button small primary" data-activate="${t.id}">Activate</button>`} ${t.hasHomepage ? `<a href="#homepage/${t.id}" class="button small">${icon("edit")} Edit homepage</a>` : ""}<a href="/?preview=1&theme=${t.id}" target="_blank" rel="noopener" class="button small">Preview ${icon("external")}</a><button class="icon-button" data-edit-theme="${t.id}" aria-label="Edit theme source">${icon("code")}</button><a href="/api/cms/themes?export=${t.id}" class="icon-button" aria-label="Export ${esc(t.name)}">${icon("download")}</a>${t.id !== data.active ? `<button class="icon-button" data-delete-theme="${t.id}" aria-label="Delete theme">${icon("trash")}</button>` : ""}</div></div></article>`).join("")}</div><p class="field-hint theme-format">Theme packages use the Coordiation CMS format (.zip containing theme.json). Export a theme to create and distribute your own variants.</p>`;
  bind("[data-action=create-theme]", "click", () => editThemeSource(null));
  $$("[data-edit-theme]").forEach((el) =>
    bind(`[data-edit-theme="${el.dataset.editTheme}"]`, "click", () =>
      editThemeSource(el.dataset.editTheme),
    ),
  );
  bind("[data-action=install-theme]", "click", () => $("#theme-file").click());
  bind("#theme-file", "change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const f = new FormData();
    f.append("file", file);
    await api("install-theme", "POST", f);
    toast("Theme installed.");
    await renderThemes();
  });
  $$("[data-activate]").forEach((el) =>
    bind(`[data-activate="${el.dataset.activate}"]`, "click", async () => {
      await api("themes", "POST", { id: el.dataset.activate });
      site = await api("settings");
      toast("Your new theme is live.");
      await renderThemes();
    }),
  );
  $$("[data-delete-theme]").forEach((el) =>
    bind(`[data-delete-theme="${el.dataset.deleteTheme}"]`, "click", () =>
      confirmAction(
        "Delete theme?",
        "Keep an exported copy if you might need this theme again.",
        async () => {
          await api("themes", "DELETE", { id: el.dataset.deleteTheme });
          await renderThemes();
          toast("Theme deleted.");
        },
      ),
    ),
  );
}
async function editThemeSource(id) {
  const t = await api("theme-source?id=" + (id || site.activeTheme));
  const d = openModal(
    id ? "Theme editor" : "Create your theme",
    `<form id="theme-source-form"><div class="form-grid"><label>Theme ID<input name="id" value="${esc(id || "new-theme")}" ${id ? "readonly" : ""} required pattern="[a-z][a-z0-9-]{1,49}"></label><label>Theme name<input name="name" value="${esc(id ? t.name : "New Theme")}" required></label><label>Version<input name="version" value="${esc(t.version)}" required></label><label>Author<input name="author" value="${esc(id ? t.author : user.name)}" required></label></div><label>Description<input name="description" value="${esc(t.description)}" required></label><label>License<input name="license" value="${esc(t.license)}" required></label><div class="form-grid"><label>Accent<input type="color" name="accent" value="${t.accent}"></label><label>Background<input type="color" name="background" value="${t.background}"></label><label>Text<input type="color" name="foreground" value="${t.foreground}"></label></div><details><summary>Template & stylesheet</summary><p class="field-hint">Variables: site, menu, posts, post. HTML slots: content and comments. Supports each, if, unless. HTML is sanitized; JavaScript is not allowed.</p><label>Home<textarea name="home" class="source-area">${esc(t.home)}</textarea></label><label>Post / page<textarea name="single" class="source-area">${esc(t.single)}</textarea></label><label>Stylesheet CSS<textarea name="css" class="source-area">${esc(t.css)}</textarea></label></details></form>`,
    button("Save theme", "save-theme-source", "primary"),
  );
  bind(
    "[data-action=save-theme-source]",
    "click",
    async () => {
      const f = $("#theme-source-form");
      if (!f.reportValidity()) return;
      await api("theme-source", "POST", {
        theme: {
          ...t,
          ...Object.fromEntries(new FormData(f)),
          cmsVersion: "1",
        },
        update: !!id,
      });
      d.close();
      toast("Theme saved. Export the ZIP to distribute it.");
      await renderThemes();
    },
    d,
  );
}
async function renderSettings(customize = false) {
  site = await api("settings");
  const themes = await api("themes");
  const homepageTheme = themes.items.find(
    (t) => t.id === themes.active && t.hasHomepage,
  );
  const pages = (await api("posts")).filter(
    (p) =>
      p.type === "page" &&
      p.status === "published" &&
      p.visibility === "public",
  );
  $("#workspace").innerHTML =
    heading(
      customize ? "Customize site" : "Settings",
      "Set your site identity and how it works.",
      `<a class="button" href="#ai-settings">${icon("spark")} AI writing</a>` +
        (homepageTheme
          ? `<a class="button" href="#homepage/${homepageTheme.id}">${icon("edit")} Edit homepage</a>`
          : "") +
        button("Save changes", "save-settings", "primary", "check"),
    ) +
    `<form id="settings-form"><div class="settings-grid"><div class="component-stack">${card(
      "Site identity",
      "Give your publication a name and a recognizable style.",
      field(
        "setting-title",
        "Site title",
        `<input id="setting-title" name="title" value="${esc(site.title)}" required maxlength="150">`,
      ) +
        field(
          "setting-tagline",
          "Tagline",
          `<input id="setting-tagline" name="tagline" value="${esc(site.tagline)}" maxlength="300" aria-describedby="setting-tagline-hint">`,
          "A short sentence that describes your site.",
        ) +
        field(
          "setting-footer",
          "Footer text",
          `<input id="setting-footer" name="footer" value="${esc(site.footer)}" maxlength="300">`,
        ) +
        field(
          "setting-accent",
          "Accent color",
          `<div class="ui-color-control"><input id="setting-accent" name="accent" type="color" value="${esc(site.accent)}"><output id="accent-value" for="setting-accent">${esc(site.accent)}</output></div>`,
        ),
      icon("themes"),
    )}
      ${card("Site preview", "See your publication as your readers do.", `<p class="field-hint">Save your changes before opening the preview.</p><a class="button" href="/" target="_blank" rel="noopener">${icon("external")} View site</a>`, icon("eye"))}</div>
      <div class="component-stack">${card(
        "Reading",
        "Choose what visitors see on your homepage.",
        field(
          "setting-homepage",
          "Homepage display",
          `<select id="setting-homepage" name="homepage"><option value="">Theme homepage / latest posts</option>${pages.map((p) => `<option value="${p.id}" ${site.homepage === p.id ? "selected" : ""}>${esc(p.title)}</option>`).join("")}</select>`,
        ) +
          field(
            "setting-page-size",
            "Posts per page",
            `<input id="setting-page-size" name="postsPerPage" type="number" min="1" max="50" value="${site.postsPerPage}">`,
          ),
        icon("pages"),
      )}
      ${card(
        "Discussion",
        "Control comments across your posts and pages.",
        switchField(
          "allowComments",
          "Accept new comments",
          "New comments are reviewed before publication.",
          site.allowComments,
        ) +
          switchField(
            "hideComments",
            "Hide comments everywhere",
            "Hide comments and the form, and block new submissions. Existing comments are preserved.",
            site.hideComments,
          ),
        icon("comments"),
      )}</div></div></form>`;
  const saveSettings = async (event) => {
    event.preventDefault();
    const f = $("#settings-form");
    if (!f.reportValidity()) return;
    const saveButton = $("[data-action=save-settings]");
    if (saveButton.disabled) return;
    saveButton.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(f));
      data.postsPerPage = Number(data.postsPerPage);
      data.allowComments = f.elements.allowComments.checked;
      data.hideComments = f.elements.hideComments.checked;
      await api("settings", "POST", data);
      site = await api("settings");
      nav();
      toast("Settings saved.");
    } finally {
      saveButton.disabled = false;
    }
  };
  bind("[data-action=save-settings]", "click", saveSettings);
  bind("#settings-form", "submit", saveSettings);
  bind("#setting-accent", "input", (e) => {
    $("#accent-value").textContent = e.currentTarget.value;
  });
}
async function renderMenus() {
  site = await api("settings");
  let items = site.menu.map((x) => ({ ...x }));
  $("#workspace").innerHTML =
    heading(
      "Navigation menus",
      "Help visitors find what they are looking for.",
      button("Save menu", "save-menu", "primary", "check"),
    ) +
    `<section class="panel form-panel"><h2>Primary menu</h2><div id="menu-items"></div>${button("Add link", "add-link", "", "plus")}<p class="field-hint">Use a local path such as /about or an HTTPS URL. Use arrows to reorder links.</p></section>`;
  const read = () =>
    $$(".menu-row").map((el) => ({
      label: $("[name=label]", el).value,
      href: $("[name=href]", el).value,
    }));
  const paint = () => {
    $("#menu-items").innerHTML = items
      .map(
        (item, i) =>
          `<div class="menu-row"><input name="label" aria-label="Menu label" placeholder="Label" value="${esc(item.label)}"><input name="href" aria-label="Menu URL" placeholder="/about" value="${esc(item.href)}"><button class="icon-button" data-menu-up="${i}" aria-label="Move up">${icon("up")}</button><button class="icon-button" data-menu-down="${i}" aria-label="Move down">${icon("down")}</button><button class="icon-button" data-menu-delete="${i}" aria-label="Delete">${icon("trash")}</button></div>`,
      )
      .join("");
    for (const action of ["up", "down", "delete"])
      $$(`[data-menu-${action}]`).forEach((el) =>
        el.addEventListener("click", () => {
          items = read();
          const i = Number(
            el.dataset["menu" + action[0].toUpperCase() + action.slice(1)],
          );
          if (action === "delete") items.splice(i, 1);
          else {
            const to = i + (action === "up" ? -1 : 1);
            if (to < 0 || to >= items.length) return;
            [items[i], items[to]] = [items[to], items[i]];
          }
          paint();
        }),
      );
  };
  paint();
  bind("[data-action=add-link]", "click", () => {
    items = read();
    items.push({ label: "", href: "" });
    paint();
  });
  bind("[data-action=save-menu]", "click", async () => {
    await api("settings", "POST", { menu: read() });
    toast("Menu applied to your site.");
  });
}
async function renderTerms(kind) {
  const items = (await api("terms")).filter((t) => t.kind === kind),
    name = kind === "category" ? "Categories" : "Tag";
  $("#workspace").innerHTML =
    heading(
      name,
      `Organize your content so it is easier to find.`,
      `<a class="button" href="#posts">${icon("back")} Posts</a>`,
    ) +
    `<div class="two-columns"><form id="term-form" class="panel form-panel"><h2>Add ${name.toLowerCase()}</h2><input type="hidden" name="id"><label>Name<input name="name" required maxlength="100"></label><label>Slug<input name="slug" placeholder="Generated from the name"></label><button class="button primary">Save</button></form><section class="panel">${items.length ? `<table><thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead><tbody>${items.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.slug)}</td><td><button class="icon-button" data-term-edit="${t.id}" aria-label="Edit">${icon("edit")}</button><button class="icon-button" data-term-delete="${t.id}" aria-label="Delete">${icon("trash")}</button></td></tr>`).join("")}</tbody></table>` : empty(`No ${name.toLowerCase()}`, "Add one using the form.")}</section></div>`;
  bind("#term-form", "submit", async (e) => {
    e.preventDefault();
    await api("terms", "POST", {
      kind,
      ...Object.fromEntries(new FormData(e.target)),
    });
    toast("Taxonomy saved.");
    await renderTerms(kind);
  });
  $$("[data-term-edit]").forEach((el) =>
    el.addEventListener("click", () => {
      const t = items.find((x) => x.id === el.dataset.termEdit),
        f = $("#term-form");
      for (const k of ["id", "name", "slug"]) f.elements[k].value = t[k];
    }),
  );
  $$("[data-term-delete]").forEach((el) =>
    bind(`[data-term-delete="${el.dataset.termDelete}"]`, "click", () =>
      confirmAction(
        "Delete taxonomy?",
        "This category or tag will be removed from its associated content.",
        async () => {
          await api("terms", "DELETE", { id: el.dataset.termDelete });
          await renderTerms(kind);
        },
      ),
    ),
  );
}
async function renderComments() {
  const items = await api("comments");
  let filter = "pending";
  $("#workspace").innerHTML =
    heading("Comments", "Build meaningful conversations with your readers.") +
    `<div class="toolbar"><div class="tabs">${["pending", "approved", "spam", "trash"].map((s) => `<button class="tab ${s === filter ? "active" : ""}" data-tab="${s}">${statusNames[s]} (${items.filter((c) => c.status === s).length})</button>`).join("")}</div></div><section class="panel" id="comment-list"></section>`;
  const paint = () => {
    const rows = items.filter((c) => c.status === filter);
    $("#comment-list").innerHTML = rows.length
      ? `<div class="table-wrap"><table><thead><tr><th>Author</th><th>Comments</th><th>Actions</th></tr></thead><tbody>${rows.map((c) => `<tr><td>${esc(c.name)}<small class="subline">${esc(c.email)}</small><small class="subline">${date(c.created_at)}</small></td><td class="comment-body"><a href="#edit/${c.post_id}" class="text-link">${esc(c.post_title)}</a><p>${esc(c.body)}</p>${badge(c.status)}</td><td><div class="row-actions">${c.status !== "approved" ? `<button class="button small" data-comment="${c.id}" data-status="approved">Approve</button>` : ""}${c.status !== "spam" ? `<button class="button small" data-comment="${c.id}" data-status="spam">Spam</button>` : ""}<button class="button small danger" data-comment="${c.id}" data-status="${c.status === "trash" ? "delete" : "trash"}">${c.status === "trash" ? "Delete permanently" : "Trash"}</button></div></td></tr>`).join("")}</tbody></table></div>`
      : empty("All caught up.", "There are no comments in this category.");
    $$("[data-comment]").forEach((el) =>
      el.addEventListener("click", async () => {
        try {
          const action = async () => {
            await api(
              "comments",
              el.dataset.status === "delete" ? "DELETE" : "POST",
              { id: el.dataset.comment, status: el.dataset.status },
            );
            toast("Comment updated.");
            await renderComments();
          };
          if (el.dataset.status === "delete")
            await confirmAction(
              "Delete comment?",
              "This comment will be permanently deleted.",
              action,
            );
          else await action();
        } catch (e) {
          toast(e.message, true);
        }
      }),
    );
  };
  paint();
  $$("[data-tab]").forEach((el) =>
    el.addEventListener("click", () => {
      filter = el.dataset.tab;
      $$("[data-tab]").forEach((t) => t.classList.toggle("active", t === el));
      paint();
    }),
  );
}
async function renderUsers() {
  const items = await api("users");
  $("#workspace").innerHTML =
    heading(
      "Users",
      "The people behind your site.",
      button("Add user", "add-user", "primary", "plus"),
    ) +
    `<section class="panel"><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>${items.map((u) => `<tr><td class="title-cell">${esc(u.name)} ${u.id === user.id ? '<span class="badge">You</span>' : ""}</td><td>${esc(u.email)}</td><td>${roles[u.role]}</td><td><button class="button small" data-user="${u.id}">Edit role</button></td></tr>`).join("")}</tbody></table></div></section>`;
  const form = (u = {}) => {
    const d = openModal(
      u.id ? "Edit user" : "Add user",
      `<form id="user-form"><label>Name<input name="name" value="${esc(u.name || "")}" required></label><label>Email<input type="email" name="email" value="${esc(u.email || "")}" ${u.id ? "readonly" : ""} required></label>${u.id ? "" : '<label>Initial password<input name="password" type="password" minlength="15" maxlength="256" required autocomplete="new-password"><p class="field-hint">At least 15 characters.</p></label>'}<label>Role<select name="role">${Object.entries(
        roles,
      )
        .map(
          ([r, n]) =>
            `<option value="${r}" ${(u.role || "author") === r ? "selected" : ""}>${n}</option>`,
        )
        .join(
          "",
        )}</select></label><p class="field-hint">Administrators manage the site; editors manage all content; authors manage their posts; contributors submit drafts; subscribers have a profile only. Changing a role ends that user’s sessions.</p></form>`,
      button("Save user", "save-user", "primary"),
    );
    bind(
      "[data-action=save-user]",
      "click",
      async () => {
        const f = $("#user-form");
        if (!f.reportValidity()) return;
        await api("users", "POST", {
          ...Object.fromEntries(new FormData(f)),
          id: u.id,
        });
        d.close();
        toast("User saved.");
        await renderUsers();
      },
      d,
    );
  };
  bind("[data-action=add-user]", "click", () => form());
  $$("[data-user]").forEach((el) =>
    el.addEventListener("click", () =>
      form(items.find((u) => u.id === el.dataset.user)),
    ),
  );
}
async function renderPlugins() {
  site = await api("settings");
  const plugins = [
    {
      id: "reading-time",
      name: "Reading time",
      icon: "clock",
      description: "Display estimated reading time on each post.",
    },
    {
      id: "table-of-contents",
      name: "Table of contents",
      icon: "list",
      description:
        "Automatically create article navigation from heading blocks.",
    },
  ];
  $("#workspace").innerHTML =
    heading("Plugin", "Extra functionality for a better reading experience.") +
    `<section class="panel">${plugins.map((p) => `<div class="plugin-row"><div class="plugin-icon">${icon(p.icon)}</div><div><h2>${p.name}</h2><p>${p.description}</p><small class="muted">Coordiation CMS · 1.0.0</small></div><button class="button ${site.plugins.includes(p.id) ? "" : "primary"}" data-plugin="${p.id}">${site.plugins.includes(p.id) ? "Deactivate" : "Activate"}</button></div>`).join("")}</section><p class="field-hint theme-format">Built-in extensions use the CMS API. WordPress PHP plugins are not compatible.</p>`;
  $$("[data-plugin]").forEach((el) =>
    bind(`[data-plugin="${el.dataset.plugin}"]`, "click", async () => {
      const id = el.dataset.plugin;
      await api("settings", "POST", {
        plugins: site.plugins.includes(id)
          ? site.plugins.filter((x) => x !== id)
          : [...site.plugins, id],
      });
      toast("Plugin updated.");
      await renderPlugins();
    }),
  );
}
async function renderTools() {
  $("#workspace").innerHTML =
    heading("Tools", "Move your content and keep ownership of your data.") +
    `<div class="tools-grid">${card("Import content", "Bring posts and pages into your workspace.", `<form id="import-form" class="ui-form">${field("import-format", "Source format", `<select id="import-format" name="format"><option value="wordpress">WordPress WXR (.xml)</option><option value="coordiation">Coordiation (.json)</option></select>`)}${field("import-file", "Content file", `<input class="ui-file-input" type="file" id="import-file" accept=".xml,.json" required aria-describedby="import-file-hint">`, "Choose a JSON or XML export, up to 700 KB.")}<div class="ui-info"><strong>What gets imported</strong><p>Up to 200 posts or pages, with supported content and taxonomy. Duplicate slugs receive a suffix. Media files and user accounts are not imported.</p></div><button class="button primary" type="submit">${icon("upload")} Import content</button></form>`, icon("upload"))}
      ${card("Export content", "Keep a portable copy of your published work and drafts.", `<div class="ui-info"><strong>Included in your export</strong><p>Posts, pages, blocks, categories, and tags in the Coordiation JSON format.</p></div><a class="button" href="/api/cms/export">${icon("download")} Download JSON export</a><p class="field-hint">This content export does not include media files or user accounts. Full database backups are managed on the server.</p>`, icon("download"))}</div>`;
  bind("#import-form", "submit", async (e) => {
    e.preventDefault();
    const f = $("#import-file").files[0];
    if (!f) return;
    if (f.size > 700000) throw new Error("File must be no larger than 700 KB.");
    const format = e.target.elements.format.value;
    const submit = e.currentTarget.querySelector("button[type=submit]");
    if (submit.disabled) return;
    submit.disabled = true;
    try {
      const result = await api("import", "POST", {
        format,
        content: await f.text(),
      });
      toast(`${result.count} items imported.`);
    } finally {
      submit.disabled = false;
    }
  });
}
async function renderInquiries() {
  const items = await api("inquiries");
  $("#workspace").innerHTML =
    heading(
      "Form inbox",
      "Contact messages and newsletter requests received by your site.",
    ) +
    (items.length
      ? `<div class="component-stack">${items.map((item) => card(item.kind === "newsletter" ? "Newsletter request" : item.name, `${item.email} · ${time(item.created_at)}`, `<p class="inquiry-message">${esc(item.message || "This visitor requested newsletter updates.")}</p><p class="field-hint">${esc(JSON.parse(item.services).join(", "))}${item.budget ? " · " + esc(item.budget) : ""}</p>`, icon(item.kind === "newsletter" ? "email" : "comments"))).join("")}</div>`
      : empty(
          "No messages yet",
          "Contact and newsletter submissions will appear here.",
        ));
}
function renderProfile() {
  $("#workspace").innerHTML =
    heading("Your profile", "Update the name displayed with your content.") +
    `<section class="panel form-panel"><form id="profile-form"><label>Name<input name="name" value="${esc(user.name)}" required></label><label>Email<input readonly value="${esc(user.email)}"></label><p class="muted">${roles[user.role]}</p><button class="button primary preview-action">Save profile</button></form></section><section class="panel form-panel secondary-panel"><h2>Change password</h2><form id="password-form"><label>Current password<input type="password" name="current" autocomplete="current-password" required></label><label>New password<input type="password" name="password" autocomplete="new-password" minlength="15" maxlength="256" required></label><button class="button">Change and sign in again</button></form></section>`;
  bind("#profile-form", "submit", async (e) => {
    e.preventDefault();
    await api("profile", "POST", Object.fromEntries(new FormData(e.target)));
    user.name = e.target.elements.name.value;
    nav();
    toast("Profile saved.");
  });
  bind("#password-form", "submit", async (e) => {
    e.preventDefault();
    await api("password", "POST", Object.fromEntries(new FormData(e.target)));
    dirty = false;
    location.href = "/login";
  });
}
async function route() {
  const version = ++routeVersion;
  clearTimeout(autosaveTimer);
  editor = null;
  dirty = false;
  $("#sidebar").classList.remove("open");
  const [name = "dashboard", id] = (
    location.hash.slice(1) || "dashboard"
  ).split("/");
  const active = ["new", "edit"].includes(name)
    ? "posts"
    : name === "customize"
      ? "themes"
      : name === "terms"
        ? "posts"
        : name;
  $$("[data-nav]").forEach((el) =>
    el.classList.toggle("active", el.dataset.nav === active),
  );
  $("#breadcrumb").textContent =
    {
      dashboard: "Dashboard",
      posts: "Posts",
      pages: "Pages",
      media: "Media",
      themes: "Themes",
      menus: "Menus",
      plugins: "Plugins",
      users: "Users",
      tools: "Tools",
      settings: "Settings",
      edit: "Editor",
      new: "Editor",
      customize: "Customize",
      homepage: "Homepage editor",
      inquiries: "Form inbox",
      "ai-settings": "AI writing",
      terms: "Taxonomy",
      comments: "Comments",
      profile: "Profile",
    }[name] || "Dashboard";
  $("#workspace").innerHTML = '<p class="loading">Loading your workspace…</p>';
  try {
    if (
      [
        "themes",
        "menus",
        "plugins",
        "users",
        "tools",
        "settings",
        "customize",
        "homepage",
        "inquiries",
        "ai-settings",
      ].includes(name) &&
      !isAdmin()
    )
      throw new Error("This page is only available to administrators.");
    switch (name) {
      case "ai-settings":
        await renderAISettings({ api, toast });
        break;
      case "homepage":
        await renderHomepageEditor(id, {
          api,
          toast,
          pickMedia,
          setDirty: (value) => {
            dirty = value;
          },
        });
        break;
      case "inquiries":
        await renderInquiries();
        break;
      case "posts":
        await renderPosts("post");
        break;
      case "pages":
        await renderPosts("page");
        break;
      case "edit":
        await renderEditor(id);
        break;
      case "new":
        await renderEditor(null, id);
        break;
      case "media":
        await renderMedia();
        break;
      case "themes":
        await renderThemes();
        break;
      case "settings":
      case "customize":
        await renderSettings(name === "customize");
        break;
      case "menus":
        await renderMenus();
        break;
      case "terms":
        await renderTerms(id === "tag" ? "tag" : "category");
        break;
      case "comments":
        await renderComments();
        break;
      case "users":
        await renderUsers();
        break;
      case "plugins":
        await renderPlugins();
        break;
      case "tools":
        await renderTools();
        break;
      case "profile":
        renderProfile();
        break;
      default:
        await renderDashboard();
    }
    if (version === routeVersion) window.scrollTo(0, 0);
  } catch (e) {
    $("#workspace").innerHTML = empty(
      "Unable to open this page",
      esc(e.message),
      '<a href="#dashboard" class="button">Back to dashboard</a>',
    );
  }
}
window.addEventListener("hashchange", route);
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (
    link &&
    dirty &&
    link.target !== "_blank" &&
    link.getAttribute("href") !== location.hash
  ) {
    e.preventDefault();
    const href = link.getAttribute("href");
    confirmAction(
      "Leave the editor?",
      "Your unsaved changes may be lost.",
      () => {
        dirty = false;
        clearTimeout(autosaveTimer);
        location.href = href;
      },
    );
  }
});
bind("#mobile-toggle", "click", () => $("#sidebar").classList.toggle("open"));
bind("#profile-button", "click", () => {
  const d = openModal(
    esc(user.name),
    `<p class="muted">${esc(user.email)}</p><p>${roles[user.role]}</p>`,
    `<a href="#profile" class="button" id="edit-profile">${icon("users")} Profile</a>${button("Sign out", "logout", "danger", "logout")}`,
  );
  bind("#edit-profile", "click", () => d.close(), d);
  bind(
    "[data-action=logout]",
    "click",
    async () => {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw new Error("Unable to sign out.");
      dirty = false;
      location.href = "/login";
    },
    d,
  );
});
try {
  dashboard = await api("dashboard");
  user = dashboard.user;
  site = dashboard.settings;
  nav();
  await route();
} catch (e) {
  toast(e.message, true);
}
