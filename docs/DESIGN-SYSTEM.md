# Coordiation design system

The CMS uses the visual language and open-code component recipes published by Coordiation, adapted for its HTML-first Fullstack runtime.

- Official source: [component registry](https://coordiation.com/component-registry.json), version 1.0.0-rc.1.
- Components: button, badge, card, input, textarea, native select, native dialog, and semantic table.
- Native adapter: `src/client/components.js`. Recipes use the official `co-` utility classes and are compiled by `@coordiation/css` through `@coordiation;`.
- Registry components are React wrappers. The CMS preserves their native HTML semantics and styling recipes without adding a React runtime.
- Icons: original SVG files from Coordiation's **Solar Linear** collection, by **480 Design**, licensed **CC BY 4.0**. They are used as CSS masks so they inherit text color. See `ICON-MANIFEST.json` and `public/icons/ATTRIBUTION.txt` for exact names and attribution.
- Typography: self-hosted Geist and Geist Mono, with the original OFL license.
- Brand mark: the supplied `coordiation-logo.png`.

## Layout rules

The CMS uses a 4 px spacing scale, 40 px standard controls, 32 px compact controls, 20 px icons, and 24 px card padding. Page headings, toolbars, cards, and editor columns share the same horizontal edges. Icons align through flex containers rather than text baselines or manual offsets.

The editor has a flexible content column and a 296 px settings column. Below 1050 px the content and settings stack, preventing a squeezed writing surface. Below 760 px the sidebar becomes a toggleable drawer. Filter controls remain native buttons with `aria-pressed`, rather than claiming a tab-panel relationship that the shared filtered table does not implement.

Status colors are an intentional CMS adaptation. The rest of the interface follows Coordiation's monochrome palette and visible keyboard focus. Native dialog supplies keyboard focus containment and Escape dismissal.

## Reusable forms and public components

Tools and Settings are composed with the native `card`, `field`, and `switchField` parts in `src/client/ui.js`. Card structure follows the official Card/Header/Title/Description/Content recipes. Switch styling follows the registry's 44 × 24 px track and 20 px thumb, adapted to a native checkbox with `role="switch"` so form submission and keyboard interaction work without React. File inputs retain their native picker and validation with a styled file-selector button. Source recipes: `/r/card.json`, `/r/input.json`, `/r/select.json`, `/r/switch.json` on coordiation.com.

Public pages use the server adapter `src/server/public-components.js`. Theme HTML is sanitized and enriched with component classes for cards, navigation, forms, labels, inputs, textareas and buttons. `scripts/build-public-components.js` compiles the official utility recipes with `@coordiation/css`; `src/styles/public.css` adds theme-aware layout and responsive sizing. The generated `/components.css` is separate from admin styles and requires no public JavaScript. The shared layer also applies to already-installed themes without replacing their saved manifests.

The shared `Icon` renderer lives in `src/shared/icons.js` and is used by both admin and server-rendered themes. Public navigation and comment forms load the same Solar Linear masks as the workspace. Decorative icons use `aria-hidden="true"` while links, buttons, and fields retain their text labels. Migration `cms-003-component-icons` updates only the exact legacy navigation snippets in saved theme manifests; theme packages also include the component markup.

Teraform applies the shared public components to its studio landing page, Blog archive, articles, search, and comments. Its trusted CMS motion enhancement uses IntersectionObserver and Web Animations, while static content remains usable without JavaScript. Page-scoped entrance and image-parallax settings respect reduced motion and are preserved in theme exports.
