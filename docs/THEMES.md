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
