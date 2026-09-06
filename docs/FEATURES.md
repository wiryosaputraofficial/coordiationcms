# Feature scope

The target is a WordPress-style publishing workflow with a native Coordiation theme ecosystem. Version 0.1 is not a complete reimplementation of WordPress.

| Area         | Implemented                                                                                         | Remaining differences                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Publishing   | Posts/pages, drafts, review, scheduled publication, public/private visibility, trash, restore       | Password-protected posts, content locking across tabs, nested page hierarchy, custom content types                              |
| Editor       | Nine structured blocks, reorder/remove, image selection, excerpt, featured image, categories/tags   | Gutenberg compatibility, inline rich-text toolbar, reusable/synced patterns, nested blocks, drag-and-drop layout, collaboration |
| History      | Existing-post autosaves, recovery, latest 50 revisions, restoration, optimistic version checks      | New unsaved posts do not autosave until first manual save; full audit diff UI                                                   |
| Media        | PNG/JPEG/GIF/WebP uploads up to 800 KB, alt text, caption, shared media library                     | Video/audio/PDF, thumbnails, cropping, transforms, large uploads, object storage                                                |
| Themes       | Three included themes, source editor, clone, ZIP install/export, preview, activation, global accent | PHP compatibility, JavaScript theme assets, child themes, remote updates, a visual site-layout editor                           |
| Plugins      | Two working built-in extensions                                                                     | Arbitrary native plugin installation, third-party hook registry, WordPress plugins                                              |
| Navigation   | Flat primary menu, reorder, local/HTTPS links                                                       | Nested dropdown menus, multiple menu locations, widget editor                                                                   |
| Users        | Five roles, user creation, role changes, profiles, password changes, sessions                       | Email verification/recovery, MFA, SSO, user deletion/reassignment, self-registration                                            |
| Comments     | Submission, moderation, spam/trash, basic rate limits                                               | Threaded replies, email notifications, advanced anti-spam                                                                       |
| Discovery    | SSR, basic canonical and OG text metadata, sitemap, RSS, title/excerpt search, pagination           | Per-post SEO overrides, image sitemap, redirects, social-card generation, full-text indexing                                    |
| Imports      | Native JSON posts/pages/taxonomies; WordPress WXR posts/pages with sanitized HTML                   | WXR attachments, author mapping, WXR taxonomy/comments, other blog importers, full-site migration                               |
| Operations   | Persistent SQLite, Docker, TLS proxy, health endpoint, backup and isolated restore scripts          | Multi-node hosting, multisite, one-click application upgrades, remote encrypted backup service                                  |
| Localization | English UI and sample content                                                                       | Language switcher, translated sites, multilingual publishing                                                                    |

Scheduled posts are made public on the first content/dashboard/RSS/sitemap request after their scheduled time. No background scheduler is installed. The original requested full feature parity remains future product work; this matrix is the scope of the delivered implementation.

The public post list is bounded to 10,000 records per query. The import limit is 200 posts and 500 taxonomy terms per request. Upload limits reflect the framework's 1 MiB HTTP-body limit. SQLite is suitable for a bounded single-node CMS, not an assertion of WordPress-scale throughput.
