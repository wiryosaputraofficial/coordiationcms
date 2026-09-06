/**
 * Native HTML adaptation of Coordiation's open-code monochrome registry.
 * Registry components use React wrappers; Fullstack uses native HTML instead.
 * The utility recipes below are from /r/{button,input,select,card,table,badge}.json.
 * See docs/DESIGN-SYSTEM.md for provenance and intentional CMS adaptations.
 */
const recipes = [
  [
    ".button",
    "co-inline-flex co-items-center co-justify-center co-gap-2 co-rounded-md co-font-medium co-transition co-outline-none focus-visible:co-ring-2 focus-visible:co-ring-black disabled:co-opacity-50",
  ],
  [".button.primary", "co-bg-black co-text-white hover:co-bg-black/80"],
  [
    ".button:not(.primary):not(.ghost)",
    "co-border co-border-black/20 co-bg-white co-text-black hover:co-bg-black/5",
  ],
  [
    ".button.ghost,.icon-button",
    "co-inline-flex co-items-center co-justify-center co-bg-transparent co-text-black hover:co-bg-black/5 co-rounded-md",
  ],
  [".button:not(.small)", "co-h-10 co-px-4 co-text-sm"],
  [".button.small", "co-h-8 co-px-3 co-text-xs"],
  [
    "input:not([type=checkbox]):not([type=hidden]):not([type=color]):not(.title-input)",
    "co-flex co-h-10 co-w-full co-rounded-md co-border co-border-black/20 co-bg-white co-px-3 co-text-sm co-outline-none placeholder:co-text-black/40 focus-visible:co-ring-2 focus-visible:co-ring-black disabled:co-opacity-50",
  ],
  [
    "select",
    "co-h-10 co-w-full co-rounded-md co-border co-border-black/20 co-bg-white co-px-3 co-text-sm co-outline-none focus-visible:co-ring-2",
  ],
  [
    "textarea:not(.excerpt-input):not([data-field])",
    "co-w-full co-rounded-md co-border co-border-black/20 co-bg-white co-px-3 co-py-2 co-text-sm focus-visible:co-ring-2",
  ],
  [
    ".panel,.stat-card,.theme-card",
    "co-rounded-xl co-border co-border-black/15 co-bg-white co-text-black co-shadow-sm",
  ],
  [".table-wrap", "co-w-full co-overflow-auto"],
  ["table", "co-w-full co-caption-bottom co-text-sm"],
  [
    "th",
    "co-h-11 co-text-left co-align-middle co-font-medium co-text-black/60",
  ],
  ["td", "co-align-middle"],
  [
    ".badge",
    "co-inline-flex co-items-center co-rounded-full co-px-2.5 co-py-1 co-text-xs co-font-medium",
  ],
  [
    ".modal",
    "co-rounded-xl co-border co-border-black/20 co-bg-white co-text-black co-shadow-xl",
  ],
];

function synchronize() {
  for (const [selector, classes] of recipes) {
    for (const element of document.querySelectorAll(selector)) {
      element.classList.add(...classes.split(" "));
    }
  }
  const route = location.hash.slice(1).split("/")[0] || "dashboard";
  const active =
    { edit: "posts", new: "posts", customize: "themes", terms: "posts" }[
      route
    ] || route;
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.querySelector("#mobile-toggle");
  if (sidebar && toggle) {
    const mobile = matchMedia("(max-width: 760px)").matches;
    const expanded = sidebar.classList.contains("open");
    sidebar.inert = mobile && !expanded;
    toggle.setAttribute("aria-controls", "sidebar");
    toggle.setAttribute("aria-expanded", String(expanded));
  }
  for (const link of document.querySelectorAll("[data-nav]")) {
    const selected = link.dataset.nav === active;
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  for (const tabs of document.querySelectorAll(".tabs")) {
    tabs.setAttribute("aria-label", "Filter content by status");
    tabs.setAttribute("role", "group");
    for (const tab of tabs.querySelectorAll(".tab")) {
      tab.setAttribute(
        "aria-pressed",
        String(tab.classList.contains("active")),
      );
    }
  }
}

export function initializeComponents() {
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      synchronize();
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", schedule);
  window.addEventListener("hashchange", schedule);
  window.addEventListener("resize", schedule);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelector(".sidebar")?.classList.remove("open");
      schedule();
    }
  });
  synchronize();
}
