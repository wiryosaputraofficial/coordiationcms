# Coordiation CMS theme format, API 1

A package is a ZIP containing **one `theme.json` at its root**, up to 300 KB uncompressed and 800 KB uploaded. Nested directories, additional assets, and executable scripts are not accepted. Images should be managed through the CMS media library or HTTPS URLs. CSS cannot contain external URLs or imports.

```json
{
  "id": "my-studio",
  "name": "My Studio",
  "version": "1.0.0",
  "author": "Your studio",
  "description": "An editorial theme for independent publishers.",
  "license": "Your distribution license",
  "cmsVersion": "1",
  "accent": "#050505",
  "background": "#ffffff",
  "foreground": "#111111",
  "font": "sans",
  "home": "<main><h1>{{site.title}}</h1>{{#each posts}}<article><h2><a href=\"/{{slug}}\">{{title}}</a></h2><p>{{excerpt}}</p></article>{{/each}}</main>",
  "single": "<main><h1>{{post.title}}</h1><article>{{{content}}}</article>{{{comments}}}</main>",
  "css": "body{background:var(--theme-bg);color:var(--theme-fg);font-family:Geist,Arial,sans-serif}main{max-width:1000px;margin:auto;padding:40px}a{color:var(--accent)}"
}
```

The `font` manifest property is descriptive. Set actual font families in CSS. Geist is provided by the CMS engine.

## Available data

| Context            | Properties                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `site`             | `title`, `tagline`, `footer`, `activeTheme`, `accent`, `postsPerPage`, `allowComments`       |
| `menu[]`           | `label`, `href`                                                                              |
| `posts[]`          | `title`, `slug`, `excerpt`, `category`, `date`, `image`, `imageAlt`, `author`, `readingTime` |
| `post`             | The same properties as an entry in `posts[]`                                                 |
| `content`          | Sanitized HTML generated from the post's structured blocks                                   |
| `comments`         | Approved comments and the moderated comment form                                             |
| `query`            | Current search text, on the home template                                                    |
| `previous`, `next` | Pagination URLs, or empty strings                                                            |

`{{value}}` escapes text. Use `{{{content}}}` and `{{{comments}}}` for the CMS-rendered slots. `{{#each items}}`, `{{#if value}}`, `{{#unless value}}`, and `{{else}}` are supported. Loops cannot be nested. Partials, custom helpers, decorators, subexpressions, parent paths, and prototype access are rejected. Final output is sanitized even when using triple braces.

All HTML is served through a restrictive public-page CSP. Scripts, inline event handlers, iframes, and inline styles are removed. Use CSS classes. Available CSS variables are `--accent`, `--theme-bg`, and `--theme-fg`.

## Distribution workflow

1. Create a theme with a unique lowercase ID in **Themes → Create theme**.
2. Author the home and single templates, CSS, colors, and package metadata.
3. Save and preview the actual public renderer. Preview does not activate the theme.
4. Check mobile layouts, empty content, long titles, menus, image alt text, comments, and pagination.
5. Export the ZIP. A buyer can install it from **Themes → Install theme**.

An existing theme can be edited through its source button. An installed ID cannot be overwritten by ZIP import; use source editing for updates or distribute a new ID. Theme previews show live CMS content, while the small library thumbnail is an illustrative card rather than a screenshot of arbitrary custom templates.

The CMS does not issue license keys, process payments, enforce DRM, fetch remote theme updates, or provide a public marketplace. These services are separate from the installable theme format.

## Editable homepages (Teraform)

Choose **Themes → Teraform → Edit homepage** to edit every section, including images from Media, links, repeated cards, visibility, order, and colors/typography. Save before opening Preview. To publish the landing page, activate the theme and choose **Settings → Homepage → Theme homepage / latest posts**. A selected static page continues to take precedence on the live site. Header and footer remain at the edges of the layout.

Themes can opt in with a `homepage` object containing `version: 1`, a `sections` array, and optional `design` defaults. Each section has a unique `id`, `label`, `template`, `fields`, optional `itemFields` and `items`, and optional `visible`. Fields contain `key`, `label`, `type`, and `default`; supported types are `text`, `textarea`, `url`, `image`, and `color`. Limits are 20 sections, 30 fields per group, and 16 items per section. Templates use escaped field names and one-level `{{#each items}}` loops; the same safety rules apply as for other templates.

The renderer supplies `homepageContent`, `homepageHeader`, and `homepageFooter` HTML slots. Teraform renders the first on its home template and the latter two around articles. Per-theme settings are stored separately from templates and preserve defaults for newly added fields. Export and source cloning fold the current saved settings into package defaults, including colors, item content, section order, and visibility.

ZIP packages still contain only `theme.json`. Uploaded media is not embedded; move referenced media separately or use stable HTTPS URLs when distributing a theme. Teraform's bundled `/theme-assets/teraform/` SVG artwork is included in this CMS release and uses original artwork, not assets from the reference site. The design takes inspiration from [the supplied reference](https://formix.framer.website/), with original branding, copy, and illustrations.

Teraform contact and newsletter forms submit to the built-in inbox. Administrators read submissions from **Tools → Form inbox**. This does not send email or connect a mailing service. Custom theme authors must follow the form field contract in `src/server/inquiries.js`; only the active theme can accept submissions.
