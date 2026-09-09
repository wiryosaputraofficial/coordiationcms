# Coordiation Page Builder

The native builder is available in both **Posts** and **Pages**. It edits the body of a page or article; it does not require PHP, React, or an Elementor plugin.

## Workspace

- **Insert / Layers** on the left: insert native blocks and navigate nested sections. Drag a layer onto a section to move it inside, or onto another block to place it before that block. **Move to…**, **Move up**, and **Move down** provide keyboard alternatives.
- **Canvas** in the center: select blocks, preview desktop (1200 px), tablet (768 px), or mobile (375 px), and choose Fit, 50%, 75%, or 100% zoom. **Preview canvas** hides the side panels. The canvas previews content, not the surrounding theme header and footer; the saved Preview link shows the complete themed page.
- **Content** on the right: edit text, heading level, image URL/alt/caption, media library selection, and button links.
- **Style** on the right: grid/flex/block layout, columns, gaps, per-side spacing, typography, alignment, width, palette colors, border, radius, and visibility. Desktop values cascade down; tablet applies below 1024 px and mobile below 640 px of available content width. Sections stack on mobile unless explicitly overridden. Hidden blocks remain accessible in Layers.
- **Page** on the right: title, excerpt, layout, SEO, publication, featured image, taxonomy, comments, and revisions.

Use **Save** to persist changes. Existing content autosaves after a short idle period. New content needs its first explicit Save before autosave is available. Undo/Redo keeps up to 50 block-edit snapshots while the editor stays open. Reopening or saving the editor resets this local undo history; server revisions remain available. Page metadata edits are handled by Save and revision history, not block Undo.

## Blocks and layouts

Supported blocks: section/columns, paragraph, heading (H1–H6), image, quote, list, code, divider, button, spacer, and sanitized HTML. Sections can contain sections. Documents support 200 blocks total, up to five section nesting levels, and a 300 KB serialized content limit.

**Theme default** retains the theme's article layout. **Wide content** expands supported article containers while retaining the theme header. **Blank canvas** renders only the builder body and enabled comments; add an H1 block because the theme's title is removed. Arbitrary custom themes may need CSS adjustments for wide layout. Existing content defaults to the theme layout.

All public content is rendered as HTML on the server. SEO analysis, descriptions, reading time, and AI input include text inside sections. AI rewriting creates ordinary text blocks and can replace a designed body; review the confirmation and keep a revision or template when preserving layout is important.

## Reusable templates

Open **Templates** for starter layouts and the site's saved library. Append a copy, or replace current content after confirmation. Replacing also applies the saved page-layout mode and can be undone. Appending keeps the current mode.

**Save template** saves either the whole body or the selected block/section. Choose a new template or update one you own. Administrators and editors can update any template; authors and contributors can update their own. Library contents are visible to writers, so do not save confidential drafts as shared templates. Templates are independent copies: editing/deleting a template does not alter previously created pages.

Export/import uses `.json` with `format: "coordiation-content-template"` and `version: 1`. Imports are validated and HTML is sanitized on the server. The library holds up to 200 templates. Media is referenced by URL, not bundled; `/media/...` assets must be migrated separately when distributing templates between sites. Theme manifests and content templates remain different formats.

## Current boundaries

This is the first native visual builder, not feature parity with Elementor Pro or Framer. It does not yet include arbitrary custom CSS/colors, inline rich-text formatting, forms as builder widgets, sliders, dynamic query widgets, global linked symbols, display conditions, page-builder motion effects, collaborative editing, or visual editing of theme headers/footers. Safe HTML is sanitized on save and shown as a placeholder in the editor; use the saved Preview for its rendered output. Existing Teraform homepage settings remain available separately.

## Storage and safety

Migration `cms-011-page-builder` adds `posts.layout` and a `content_templates` table. Blocks and responsive styles remain in `posts.blocks`, so revisions and native content import/export preserve them. Full database backups include the library; normal content export includes posts/pages but not the standalone template library (export those individually). Styling uses predefined external CSS classes and preserves the site's Content Security Policy. Imported templates cannot add executable scripts or arbitrary CSS. Old installations must be upgraded before importing nested builder content.

## Code panel

Use the rail’s **Edit code** button to open the dark code panel. Template JSON is editable; **Rendered HTML** shows the sanitized output from the document when the panel opened. **Apply to canvas** validates the JSON and updates the editor without publishing. Use Save to persist it. JavaScript and arbitrary CSS execution are not supported.
