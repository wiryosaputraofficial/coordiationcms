# Coordiation CMS

An English-language, self-hosted publishing CMS built on **Coordiation Fullstack 0.1.0-alpha.1**. It uses native `.coord` pages, server loaders, HTTP handlers, the framework's SQLite adapter, and its password/session provider. No React, Next.js, or PHP runtime is required.

The interface follows [coordiation.com](https://coordiation.com): Geist typography, monochrome surfaces, fine borders, and black primary buttons. The supplied Coordiation logo, self-hosted Geist fonts, and official Coordiation Solar Linear icons are included. Native component recipes come from the Coordiation monochrome registry; see [Design system](docs/DESIGN-SYSTEM.md).

## Run locally

Requires Node.js 22.18+ (Node 24 is used by the deployment image).

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3118/login** and create the first administrator. The local installer is available only until the first account is created. Passwords require 15–256 characters. For development, use `npm run dev`; this framework alpha requires a browser refresh after rebuilding.

Data lives in `data/cms.sqlite`. Override the location with `CMS_DATABASE`. `.env` files are used by Docker Compose; local Node commands require exported environment variables.

## Included

- Posts and pages, drafts, review workflow, publication scheduling, private editor previews, trash and restoration.
- Nine block types: paragraph, heading, image, quote, list, code, divider, button, and sanitized HTML.
- Separate autosave recovery, 50 revisions per post, revision restoration, and version conflict protection.
- Categories, tags, featured images, and image metadata.
- Raster image uploads stored in SQLite, safe content types, and protection against deleting currently used media.
- Public comments with moderation, spam/trash states, and basic rate limiting.
- Administrator, editor, author, contributor, and subscriber roles; profile editing and password changes.
- Native theme installation, preview, activation, source editing, cloning, removal, and ZIP export.
- Four sample themes: Folio, Gazette, Mono, and Teraform. Ready-made ZIPs are in `theme-packages/`.
- Flat navigation menus, site identity, accent color, static homepage selection, and reading settings.
- Two built-in extensions: reading time and table of contents.
- Server-rendered pages, SEO controls and meter, social metadata, article JSON-LD, RSS, sitemap, and an optional AI-readable content index.
- OpenAI writing assistance with private connection settings and review before applying. See [SEO and AI](docs/SEO-AND-AI.md).
- Native JSON content import/export and a bounded WordPress WXR content importer.
- Docker/Traefik deployment, health checks, database backup and isolated restore commands.

## Theme authoring

Open **Themes → Create theme** to clone a starting point. Set its identity, colors, templates, and stylesheet. Preview it, activate it, and export its ZIP for distribution.

Theme packages belong to **Coordiation CMS**. WordPress PHP themes and plugins cannot be installed. See [Theme format](docs/THEMES.md) for the template contract and examples.

```sh
node scripts/export-themes.js
```

## Validation

```sh
npm run build
npm test
```

Tests launch an isolated compiled server on port 3319 and create disposable SQLite data. The suite covers authentication, role enforcement, CSRF, publication privacy, version conflicts, autosaves, revisions, media, theme packages, theme source editing, comments, scheduling, imports, password changes, and session revocation.

## Deployment and scope

See [Deployment](docs/DEPLOYMENT.md), [Security](docs/SECURITY.md), and [Feature scope](docs/FEATURES.md).

This is a working **0.1 release foundation**, not complete WordPress feature parity or a production certification. Coordiation Fullstack itself is an alpha. The feature matrix explicitly identifies capabilities that are not implemented; do not advertise full WordPress compatibility.

Official references: [Coordiation Fullstack installation](https://coordiation.com/docs/installation/using-fullstack), [WordPress core features](https://wordpress.org/about/features/). Font licensing is retained in `public/fonts/OFL.txt`; package dependencies retain their own licenses. The manifest's theme license field should reflect the distribution terms chosen by the theme author.
