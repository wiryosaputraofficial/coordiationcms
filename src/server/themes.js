import { makeTeraformTheme } from "../themes/teraform.js";
import { teraformCSS } from "../themes/teraform-style.js";
import { validateHomepageSchema } from "../shared/homepage.js";
import { icon } from "../shared/icons.js";
import { componentAttributes } from "./public-components.js";
import Handlebars from "handlebars";
import sanitizeHtml from "sanitize-html";
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";

const home = `<header class="site-header"><a class="site-logo" href="/"><img src="/coordiation-logo.png" alt="Coordiation">{{site.title}}</a><nav>{{#each menu}}<a href="{{href}}">{{label}}</a>{{/each}}</nav><form action="/"><input aria-label="Search posts" name="q" placeholder="Search stories…" value="{{query}}"><button>Search</button></form></header><main><section class="hero"><span class="eyebrow">THE JOURNAL</span><h1>{{site.title}}</h1><p>{{site.tagline}}</p></section><section class="post-grid">{{#each posts}}<article class="post-card">{{#if image}}<a href="/{{slug}}"><img src="{{image}}" alt="{{imageAlt}}"></a>{{/if}}<span class="eyebrow">{{category}} · {{date}}</span><h2><a href="/{{slug}}">{{title}}</a></h2><p>{{excerpt}}</p><a class="read-link" href="/{{slug}}">Read story ${icon("external")}</a></article>{{else}}<p>No stories to show yet.</p>{{/each}}</section><nav class="pagination">{{#if previous}}<a class="icon-link" href="{{previous}}">${icon("back")} Previous</a>{{/if}}{{#if next}}<a class="icon-link" href="{{next}}">Next ${icon("arrow")}</a>{{/if}}</nav></main><footer>{{site.footer}}</footer>`;
const single = `<header class="site-header"><a class="site-logo" href="/"><img src="/coordiation-logo.png" alt="Coordiation">{{site.title}}</a><nav>{{#each menu}}<a href="{{href}}">{{label}}</a>{{/each}}</nav><a class="icon-link" href="/">${icon("back")} All stories</a></header><main class="single"><span class="eyebrow">{{post.category}} · {{post.date}}</span><h1>{{post.title}}</h1><p class="lead">{{post.excerpt}}</p><p class="byline">{{post.author}}{{#if post.readingTime}} · {{post.readingTime}} min read{{/if}}</p>{{#if post.image}}<img class="cover" src="{{post.image}}" alt="{{post.imageAlt}}">{{/if}}<div class="article-body">{{{content}}}</div>{{{comments}}}</main><footer>{{site.footer}}</footer>`;
const css = `*{box-sizing:border-box}body{margin:0;background:var(--theme-bg,#fff);color:var(--theme-fg,#19201f);font-family:Geist,Arial,sans-serif;line-height:1.7;font-size:16px}a{color:inherit;text-decoration:none}button{cursor:pointer}input,textarea,button{font:inherit;padding:10px 14px;border:1px solid #ccd1d0;border-radius:4px;background:transparent;color:inherit}textarea{width:100%;min-height:110px}button{background:var(--accent);color:white;border-color:var(--accent)}label{display:block;margin:12px 0}img{max-width:100%;height:auto}.site-header{max-width:1320px;margin:auto;min-height:110px;padding:25px 44px;display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid #dadeda}.site-logo{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:800;letter-spacing:-1px}.site-logo img{width:30px;height:30px}nav{display:flex;gap:28px;flex-wrap:wrap}.site-header input{width:165px}.site-header form{display:flex;gap:6px}main{max-width:1320px;margin:auto;padding:0 44px}.hero{padding:80px 0 65px;border-bottom:1px solid #dadeda;margin-bottom:40px}.eyebrow{font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:var(--accent)}h1{font-size:clamp(46px,7vw,94px);line-height:1.03;letter-spacing:-4px;margin:24px 0}h2{font-size:28px;line-height:1.25;letter-spacing:-.7px}.hero p{font-size:21px;max-width:650px}.post-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:44px 32px}.post-card{border-bottom:1px solid #dadeda;padding-bottom:30px}.post-card img{width:100%;height:240px;object-fit:cover;margin-bottom:20px}.post-card p{color:#65706c}.read-link{display:flex;justify-content:space-between;font-weight:bold;font-size:14px}.read-link span{color:var(--accent)}footer{max-width:1232px;margin:80px auto 0;border-top:1px solid #dadeda;padding:30px 0;font-size:14px}.single{max-width:850px;padding-top:65px}.single h1{font-size:clamp(36px,5vw,65px);letter-spacing:-2px}.lead{font-size:23px;color:#67706d}.byline{font-size:14px}.cover{width:100%;max-height:550px;object-fit:cover;margin:30px 0}.article-body{font-size:19px}.article-body h2{margin-top:45px}.article-body blockquote{border-left:3px solid var(--accent);margin:30px 0;padding:15px 28px;font-size:26px}.article-body pre{background:#eef0ef;padding:20px;overflow:auto}.article-body figure{margin:30px 0}.article-body figcaption{font-size:14px;color:#68726b}.article-body a{color:var(--accent);text-decoration:underline}.article-body .button{display:inline-block;background:var(--accent);color:white;padding:12px 24px;border-radius:4px;text-decoration:none}.comments{border-top:1px solid #ddd;margin-top:60px;padding-top:20px}.comment{padding:16px 0;border-bottom:1px solid #ddd}.pagination{justify-content:space-between;margin-top:40px}.toc{background:#eff1ef;padding:20px}.preview-banner{background:#20252b;color:white;text-align:center;padding:10px}.notice{padding:16px;background:#eaf1ea}@media(max-width:800px){.site-header{padding:20px;flex-wrap:wrap}.site-header form{display:none}main{padding:0 22px}.hero{padding:55px 0}.post-grid{grid-template-columns:1fr 1fr;gap:24px}footer{margin:45px 22px 0}.single{padding-top:40px}}@media(max-width:540px){.post-grid{grid-template-columns:1fr}h1{letter-spacing:-2px}.site-header nav{gap:14px;font-size:14px}.hero p{font-size:18px}}`;
export const builtInThemes = [
  {
    id: "folio",
    name: "Folio",
    version: "1.0.0",
    author: "Coordiation Studio",
    description: "A clean editorial canvas for stories and creative work.",
    license: "MIT",
    cmsVersion: "1",
    accent: "#050505",
    background: "#ffffff",
    foreground: "#19201f",
    font: "sans",
    home,
    single,
    css,
  },
  {
    id: "gazette",
    name: "Gazette",
    version: "1.0.0",
    author: "Coordiation Studio",
    description: "Magazine character. Typography with a story to tell.",
    license: "MIT",
    cmsVersion: "1",
    accent: "#ab3629",
    background: "#faf8f3",
    foreground: "#29251e",
    font: "serif",
    home: home.replace("THE JOURNAL", "NOTES & PERSPECTIVES"),
    single,
    css:
      css +
      "h1,h2,.site-logo{font-family:Georgia,serif}.hero{text-align:center}.hero p{margin-left:auto;margin-right:auto}.post-card:first-child{grid-column:span 2}.post-card:first-child h2{font-size:40px}@media(max-width:540px){.post-card:first-child{grid-column:auto}}",
  },
  {
    id: "mono",
    name: "Mono",
    version: "1.0.0",
    author: "Coordiation Studio",
    description: "Bold contrast for portfolios and modern publications.",
    license: "MIT",
    cmsVersion: "1",
    accent: "#b5e852",
    background: "#141714",
    foreground: "#f3f5ef",
    font: "sans",
    home: home.replace("THE JOURNAL", "INDEPENDENT PUBLISHING"),
    single,
    css:
      css +
      ".site-logo img{filter:invert(1)}.post-card p,.lead{color:#acb3a7}button{color:#141714}.site-header,.hero,.post-card,footer{border-color:#3d4339}.hero h1{font-weight:900}.post-grid{gap:45px}.toc,pre{background:#262d24!important}",
  },
  makeTeraformTheme(teraformCSS),
];
const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "img",
  "input",
  "button",
  "form",
  "textarea",
  "label",
  "figure",
  "figcaption",
  "header",
  "footer",
  "main",
  "nav",
  "section",
  "article",
  "details",
  "summary",
  "fieldset",
  "legend",
];
export function cleanHTML(html, components = false) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      "*": ["class", "id", "aria-label", "aria-hidden"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      form: ["action", "method"],
      input: [
        "type",
        "name",
        "value",
        "placeholder",
        "required",
        "maxlength",
        "autocomplete",
        "checked",
        "disabled",
      ],
      textarea: ["name", "required", "maxlength"],
      button: ["type", "disabled"],
      label: ["for"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      ...(components ? { "*": componentAttributes } : {}),
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
export function validTheme(t) {
  if (!t || typeof t !== "object" || !/^[a-z][a-z0-9-]{1,49}$/.test(t.id || ""))
    throw new Error(
      "Theme IDs must use lowercase letters, numbers, or hyphens.",
    );
  for (const k of [
    "name",
    "version",
    "author",
    "description",
    "license",
    "home",
    "single",
    "css",
    "accent",
    "background",
    "foreground",
  ])
    if (
      typeof t[k] !== "string" ||
      t[k].length > (["home", "single", "css"].includes(k) ? 100000 : 500)
    )
      throw new Error(`Theme: invalid ${k}.`);
  if (
    t.archive != null &&
    (typeof t.archive !== "string" || t.archive.length > 100000)
  )
    throw new Error("Theme: invalid archive.");
  if (t.cmsVersion !== "1") throw new Error("Theme API version must be 1.");
  for (const k of ["accent", "background", "foreground"])
    if (!/^#[0-9a-f]{6}$/i.test(t[k]))
      throw new Error("Theme colors must use #RRGGBB.");
  if (
    /url\s*\(|@import|expression\s*\(|[<\\]|(?:^|[;{])\s*behavior\s*:|-moz-binding/i.test(
      t.css,
    )
  )
    throw new Error(
      "Theme CSS cannot contain external URLs, escapes, or active code.",
    );
  if (t.homepage) validateHomepageSchema(t.homepage);
  const templates = [
    t.home,
    t.single,
    ...(t.archive ? [t.archive] : []),
    ...(t.homepage?.sections.map((s) => s.template) || []),
  ];
  for (const template of templates) {
    const ast = Handlebars.parse(template);
    let nodes = 0;
    const inspect = (node, depth = 0, eachDepth = 0) => {
      if (depth > 30 || ++nodes > 12000)
        throw new Error("The template is too complex.");
      if (!node || typeof node !== "object") return;
      if (
        node.type === "BlockStatement" &&
        node.path.original === "each" &&
        ++eachDepth > 1
      )
        throw new Error("Nested each loops are not supported.");
      if (
        [
          "PartialStatement",
          "PartialBlockStatement",
          "Decorator",
          "DecoratorBlock",
          "SubExpression",
        ].includes(node.type)
      )
        throw new Error(
          "Partials, decorators, and subexpressions are not supported.",
        );
      if (
        node.type === "BlockStatement" &&
        !["each", "if", "unless"].includes(node.path.original)
      )
        throw new Error("Unsupported template helper.");
      if (node.type === "MustacheStatement" && node.params.length)
        throw new Error("Helpers are not supported.");
      if (
        node.type === "PathExpression" &&
        /(__proto__|constructor|prototype|lookup|\.\.)/.test(node.original)
      )
        throw new Error("Template path is not allowed.");
      for (const value of Object.values(node))
        if (Array.isArray(value))
          value.forEach((x) => inspect(x, depth + 1, eachDepth));
        else if (value && typeof value === "object")
          inspect(value, depth + 1, eachDepth);
    };
    inspect(ast);
  }
  const result = Object.fromEntries(
    [
      "id",
      "name",
      "version",
      "author",
      "description",
      "license",
      "cmsVersion",
      "accent",
      "background",
      "foreground",
      "font",
      "home",
      "single",
      "css",
    ].map((k) => [k, t[k] || "sans"]),
  );
  if (t.homepage) result.homepage = t.homepage;
  if (t.archive) result.archive = t.archive;
  if (JSON.stringify(result).length > 280000)
    throw new Error("Theme is too large.");
  return result;
}
export function unpackTheme(bytes) {
  const names = [];
  const files = unzipSync(bytes, {
    filter: (f) => {
      names.push(f.name);
      return f.name === "theme.json" && f.originalSize <= 300000;
    },
  });
  if (names.length !== 1 || names[0] !== "theme.json" || !files["theme.json"])
    throw new Error(
      "The ZIP must contain one theme.json at its root (up to 300 KB).",
    );
  return validTheme(JSON.parse(strFromU8(files["theme.json"])));
}
export function packTheme(theme) {
  return zipSync({ "theme.json": strToU8(JSON.stringify(theme, null, 2)) });
}
export function renderTheme(template, data) {
  return cleanHTML(Handlebars.compile(template, { strict: false })(data), true);
}
