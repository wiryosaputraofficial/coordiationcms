# SEO and AI publishing

## Search and discovery

Post and page editors provide an SEO meter, search preview, optional SEO title and meta description, canonical URL, and an **Exclude from search indexing** control. Empty overrides use the article title and excerpt, with a body-text fallback for the rendered description. The site name is appended to titles. Custom canonical URLs require HTTPS. Canonicals identify the preferred URL; they do not redirect visitors.

Public HTML is server-rendered with canonical links, Open Graph/Twitter metadata, featured images, and escaped JSON-LD describing the website, page or article, author, publication/modification dates, and breadcrumbs. Paginated blog pages have their own canonical URLs. Search/filter results and authenticated previews use noindex. Drafts and private content are unavailable to anonymous visitors. Noindex is an indexing instruction, not access control.

The sitemap, RSS feed, and `/llms.txt` omit draft, private, and explicitly noindex items. RSS contains the latest 30 posts. The optional plaintext AI index links to up to 100 recent public posts/pages; it is a convenience, not a recognized ranking requirement or guarantee that an AI service will use the content. The framework supplies robots.txt and sitemap.xml. Authentication protects the admin area, whose page metadata also requests noindex.

Use descriptive headings, accurate author identity, original useful content, and meaningful image alt text. Meter lengths and word counts are editorial hints. Search appearance, inclusion, and rankings are controlled by search providers. A canonical or noindex choice should be reviewed before publishing.

References: [Google article structured data](https://developers.google.com/search/docs/appearance/structured-data/article), [Google pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), and [Google AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Connect OpenAI

1. As an administrator, open **Settings → AI writing**.
2. Enter an OpenAI API key and a model available to your API account. The initial model ID is `gpt-5.4-mini`.
3. Save the connection. A blank key preserves the existing key; **Remove the saved API key** disconnects it.
4. In a post/page editor, choose **AI writing**, a task, output language, and brief. Generate, review and edit the result, then explicitly apply it to the editor and save.

Tasks include outlines, drafts, improvements, SEO titles, and meta descriptions. Drafts/outlines append blocks; improvements replace the body only if it has not changed since opening the assistant. Applying a suggestion does not publish it. Model access, quota, and billing are separate from this CMS.

On Generate, the server sends the brief, title, language, and up to 20,000 characters of editor text to OpenAI's Responses API. Requests set `store: false`, limit output to 4,000 tokens, and time out after 45 seconds. This is not a claim of zero provider retention; the provider's account and data policies still apply. No browser API key, arbitrary provider URL, browsing tools, or automatic publishing is involved. Generated facts, citations, and wording require human review.

Only administrators can change the connection; writing roles can request suggestions. Provider keys are encrypted with AES-256-GCM in SQLite, using a separate 0600 encryption-key file in the database directory. API responses and content exports never include the saved key. Keep the database and encryption key private and back up both; see [recovery instructions](DEPLOYMENT.md#backup-and-recovery). Rate limits apply per user and globally within the running server process.

Automated tests simulate provider responses, including errors and incomplete output. A successful settings save indicates local configuration, not a verified provider connection. A real generation request requires your API key and available quota.

References: [OpenAI text generation](https://developers.openai.com/api/docs/guides/text) and [model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini).
