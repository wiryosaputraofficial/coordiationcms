# Changelog

## Unreleased

- Add the native Posts/Pages visual builder with docked Insert/Layers and Content/Style/Page panels, responsive preview and zoom.
- Add nested sections, responsive design tokens, content layouts, undo/redo, and reusable template import/export with permissions and version checks.
- Preserve nested content in autosaves, revisions, SEO analysis, descriptions, reading time, and AI input.


## 0.2.0 — 2026-09-08

This release brings the current Statistics features to the npm distribution.

- Add an administrator-only Statistics page with 7, 30, and 90-day reporting periods.
- Show daily page views, publication trends, content status, comments and form submission counts, and top pages through Coordiation Interactive Charts.
- Add peak-hour reporting with WIB/UTC display and a daily heatmap for the ten most visited page paths.
- Provide accessible chart tables, reduced-motion support, lazy loading, retry states, and responsive layouts.
- Use shared Coordiation Label, NativeSelect and Button recipes for reporting controls, with Solar icons and aligned sizing.
- Use ECharts 6.1.0 and a browser-only chart build step compatible with Fullstack's client/server boundary checks.
- Record only aggregate daily path totals and site-wide hourly counts. Exclude signed-in readers, previews, searches, common bots, prefetches and unsuccessful public requests. Remove expired aggregates on the next recorded view or statistics request.

For new sites, use `npx coordiation-cms@0.2.0 init my-site`, then install dependencies, build, and start as described in the README.

Existing sites are independent source copies and do not receive automatic npm upgrades. Back up the database and private configuration, compare and merge the release source with your customizations, install the updated dependencies, rebuild, and restart. Database migrations `cms-009-statistics` and `cms-010-hourly-statistics` run when the updated database service initializes. Daily and hourly traffic collection begin with their respective migrations; historical hourly counts are not reconstructed. Existing content and theme settings are retained. See `docs/DEPLOYMENT.md` for backup and update guidance.

The core remains MIT licensed. Coordiation Fullstack remains an alpha dependency, and this CMS remains an early release with the limitations documented in `docs/FEATURES.md`.

## 0.1.0 — 2026-09-07

Initial npm distribution with an independent-site initializer, publishing workflows, native themes, Teraform homepage editing, SEO controls, OpenAI writing assistance, and MIT licensing for the core.
