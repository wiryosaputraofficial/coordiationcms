# Coordiation CMS showcase

Public showcase: https://coordiation.com/cms
Live public CMS: https://app.coordiation.com/
Source repository: https://github.com/wiryosaputraofficial/coordiationcms

The Coordiation homepage includes a CMS feature section and desktop/mobile navigation links. The showcase presents four real administrator screenshots, a Teraform homepage screenshot, full-size image links, and live preview / GitHub calls to action. Copy remains English and identifies the current CMS as an early preview. The public preview uses the site's active theme; Teraform is shown as an included theme example. Admin access remains authenticated.

## Assets

All five screenshots were captured directly from the local CMS on 6 September 2026, at the existing browser viewport, with sample content. No generated UI mockups or provider credentials are included. The administrator name is the product owner's public name. No inbox submissions, private email addresses, or connection settings are shown.

- `screenshots/admin-dashboard.jpg`: dashboard and sidebar.
- `screenshots/admin-editor.jpg`: post editor, AI button, and SEO meter.
- `screenshots/admin-homepage.jpg`: Teraform section and homepage editor.
- `screenshots/admin-themes.jpg`: native theme management.
- `screenshots/teraform-homepage.jpg`: public Teraform frontend.

## Website integration

`website-source/` retains the changed website files. `coordiation-website.patch` applies to the captured Coordiation website source; `base-checksums.json` records the prior hashes to detect intervening changes. Copy screenshots to the website's `public/cms/` directory. The changes preserve the website's existing build, authentication, hosting settings, dependencies, and theme registry.

Validation: website production build, lint of changed components and metadata, rendered showcase, screenshot asset links, CTA targets, and sitemap route registration.

## npm installation guide

The showcase's `#inside` section now includes an `#install` quick start with copyable npm commands, prerequisites, and the local administrator setup URL. The full guide lives at https://coordiation.com/docs/installation/using-cms and is linked from `/docs`, documentation navigation/search, and the sitemap. Both surfaces share the versioned installation command source.

`installation-guide.patch` applies after the original showcase integration; `installation-base-checksums.json` detects intervening website edits. `website-source/` contains the latest complete versions of changed files. The commands target the verified published package `coordiation-cms@0.1.0`.
