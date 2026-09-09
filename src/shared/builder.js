/** Portable, versioned native page-builder document helpers. No executable styles. */
export const blockNames = {
  section: "Section / columns",
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  quote: "Quote",
  list: "List",
  code: "Code",
  divider: "Divider",
  button: "Button",
  spacer: "Spacer",
  html: "Safe HTML",
};
export const styleOptions = {
  layout: ["grid", "flex", "block"],
  direction: ["row", "column"],
  justify: ["start", "center", "end", "between"],
  minHeight: [0, 100, 200, 320, 480, 640],
  font: ["inherit", "sans", "serif", "mono"],
  paddingTop: [0, 8, 16, 24, 32, 48, 64, 96],
  paddingRight: [0, 8, 16, 24, 32, 48, 64, 96],
  paddingBottom: [0, 8, 16, 24, 32, 48, 64, 96],
  paddingLeft: [0, 8, 16, 24, 32, 48, 64, 96],
  marginTop: [0, 8, 16, 24, 32, 48, 64],
  marginRight: [0, 8, 16, 24, 32, 48, 64],
  marginBottom: [0, 8, 16, 24, 32, 48, 64],
  marginLeft: [0, 8, 16, 24, 32, 48, 64],
  columns: [1, 2, 3, 4],
  gap: [0, 8, 16, 24, 32, 48, 64],
  padding: [0, 8, 16, 24, 32, 48, 64, 96],
  margin: [0, 8, 16, 24, 32, 48, 64],
  size: ["inherit", "small", "body", "lead", "title", "display"],
  align: ["left", "center", "right"],
  vertical: ["start", "center", "end"],
  width: ["full", "wide", "reading"],
  background: ["none", "white", "muted", "dark", "accent"],
  color: ["inherit", "dark", "muted", "white", "accent"],
  radius: [0, 8, 16, 24, 32],
  border: ["none", "line"],
  weight: ["normal", "medium", "bold"],
  hidden: ["no", "yes"],
};
export const devices = ["desktop", "tablet", "mobile"];
export const clone = (value) => JSON.parse(JSON.stringify(value));
export function flattenBlocks(blocks = []) {
  return blocks.flatMap((b) => [b, ...flattenBlocks(b.children || [])]);
}
export function nodeAt(blocks, path) {
  return path
    .split(".")
    .reduce(
      (node, key) => (Array.isArray(node) ? node : node.children)[Number(key)],
      blocks,
    );
}
export function listAt(blocks, parent = "") {
  return parent === "" ? blocks : nodeAt(blocks, parent).children;
}
export function moveBlock(blocks, source, parent, index) {
  if (parent === source || parent.startsWith(source + ".")) return false;
  const from = source.split(".");
  const at = Number(from.pop());
  const origin = listAt(blocks, from.join("."));
  const target = listAt(blocks, parent);
  if (!origin?.[at] || !Array.isArray(target)) return false;
  const value = origin.splice(at, 1)[0];
  target.splice(
    Math.max(0, index - (target === origin && at < index ? 1 : 0)),
    0,
    value,
  );
  return true;
}
export function newBlock(type) {
  if (type === "section")
    return {
      type,
      children: [],
      styles: {
        desktop: { columns: 2, gap: 24, padding: 24 },
        mobile: { columns: 1, padding: 16 },
      },
    };
  return {
    type,
    content:
      type === "heading"
        ? "Your heading"
        : type === "button"
          ? "Explore more"
          : "",
    level: 2,
  };
}
export function blockClasses(b) {
  const classes = ["pb-node", "pb-" + b.type];
  for (const device of devices)
    for (const [key, value] of Object.entries(b.styles?.[device] || {})) {
      if (styleOptions[key]?.includes(value))
        classes.push(`pb-${device}-${key}-${value}`);
    }
  return classes.join(" ");
}
export const escapeBuilder = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderBuilder(
  blocks,
  {
    cleanHTML = () => "<p>Safe HTML preview is available after saving.</p>",
    interactive = false,
    toc = [],
  } = {},
) {
  let heading = 0;
  function render(list, parent = "") {
    return list
      .map((b, i) => {
        const path = parent ? `${parent}.${i}` : String(i),
          e = escapeBuilder;
        const value = e(b.content).replace(/\n/g, "<br>");
        let inner = "";
        switch (b.type) {
          case "section":
            inner = render(b.children || [], path);
            break;
          case "heading": {
            const id = `section-${++heading}`,
              level = [1, 2, 3, 4, 5, 6].includes(b.level) ? b.level : 2;
            toc.push(`<li><a href="#${id}">${value}</a></li>`);
            inner = `<h${level} id="${id}">${value || "Heading"}</h${level}>`;
            break;
          }
          case "paragraph":
            inner = `<p>${value || (interactive ? "Write something…" : "")}</p>`;
            break;
          case "quote":
            inner = `<blockquote>${value}</blockquote>`;
            break;
          case "list":
            inner = `<ul>${(b.content || "")
              .split("\n")
              .filter(Boolean)
              .map((x) => `<li>${e(x)}</li>`)
              .join("")}</ul>`;
            break;
          case "code":
            inner = `<pre><code>${e(b.content)}</code></pre>`;
            break;
          case "image":
            inner =
              b.url && (/^https:\/\//.test(b.url) || /^\/(?!\/)/.test(b.url))
                ? `<figure><img src="${e(b.url)}" alt="${e(b.alt)}" loading="lazy">${b.caption ? `<figcaption>${e(b.caption)}</figcaption>` : ""}</figure>`
                : interactive
                  ? '<div class="pb-image-placeholder">Choose an image</div>'
                  : "";
            break;
          case "button":
            inner = `<a class="pb-button" href="${e(b.url && (/^https:\/\//.test(b.url) || /^\/(?!\/)/.test(b.url)) ? b.url : "#")}">${value}</a>`;
            break;
          case "divider":
            inner = "<hr>";
            break;
          case "spacer":
            inner = '<div class="pb-space" aria-hidden="true"></div>';
            break;
          case "html":
            inner = cleanHTML(b.content || "");
            break;
        }
        return `<div class="${blockClasses(b)}"${interactive ? ` data-pb-path="${path}" tabindex="0" role="group" aria-label="${e(blockNames[b.type])}"` : ""}>${inner}${interactive && b.type === "section" && !b.children?.length ? '<span class="pb-empty-section">Empty section · select to add blocks</span>' : ""}</div>`;
      })
      .join("");
  }
  return render(blocks);
}
const heading = (content, size = "title") => ({
  type: "heading",
  level: 2,
  content,
  styles: { desktop: { size } },
});
const paragraph = (content) => ({ type: "paragraph", content });
const section = (children, styles = {}) => ({
  type: "section",
  children,
  styles: {
    desktop: { columns: 1, gap: 24, padding: 48, ...styles },
    mobile: { columns: 1, padding: 24 },
  },
});
export const starterTemplates = [
  {
    id: "starter-landing",
    name: "Studio landing page",
    layout: "canvas",
    blocks: [
      section(
        [
          {
            ...heading("Turn your next idea into something real.", "display"),
            level: 1,
          },
          paragraph(
            "Introduce your studio, your work, and the people you help.",
          ),
          { type: "button", content: "See our work", url: "/blog" },
        ],
        { background: "dark", color: "white", padding: 64 },
      ),
      section(
        [
          section(
            [
              heading("Thoughtful strategy", "lead"),
              paragraph("Share what makes your approach different."),
            ],
            { background: "muted", radius: 16 },
          ),
          section(
            [
              heading("Meaningful design", "lead"),
              paragraph("Explain the results your clients can expect."),
            ],
            { background: "muted", radius: 16 },
          ),
        ],
        { columns: 2 },
      ),
      section(
        [
          heading("Let’s create something together."),
          paragraph("Add your next step and invite readers to get in touch."),
        ],
        { align: "center" },
      ),
    ],
  },
  {
    id: "starter-story",
    name: "Editorial story",
    layout: "theme",
    blocks: [
      section(
        [
          paragraph(
            "Start with a clear introduction that invites the reader into your story.",
          ),
          heading("A new perspective"),
          paragraph("Build your story here, one thoughtful detail at a time."),
          {
            type: "quote",
            content: "Great stories help us see familiar things differently.",
          },
          heading("What comes next"),
          paragraph("Leave your reader with something useful to remember."),
        ],
        { width: "reading", padding: 24 },
      ),
    ],
  },
  {
    id: "starter-services",
    name: "Services section",
    layout: "theme",
    blocks: [
      section([
        heading("How we can help"),
        section(
          [
            section(
              [
                heading("Strategy", "lead"),
                paragraph("A clear direction for your next chapter."),
              ],
              { background: "muted", radius: 16 },
            ),
            section(
              [
                heading("Design", "lead"),
                paragraph("Bring your ideas to life with intention."),
              ],
              { background: "muted", radius: 16 },
            ),
            section(
              [
                heading("Development", "lead"),
                paragraph("A reliable foundation to grow from."),
              ],
              { background: "muted", radius: 16 },
            ),
          ],
          { columns: 3, padding: 0 },
        ),
      ]),
    ],
  },
];
