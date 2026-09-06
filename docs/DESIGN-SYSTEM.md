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
