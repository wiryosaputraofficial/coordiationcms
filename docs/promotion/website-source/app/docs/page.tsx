import type { Metadata } from "next";
import Link from "@/app/_components/SiteLink";
import { createSeoMetadata } from "@/app/seo";
import { capabilities } from "./capabilities";

export const metadata: Metadata = createSeoMetadata({
  path: "/docs",
  title: "Coordiation CSS documentation",
  description:
    "Install Coordiation CSS and learn its utilities, variants, components, icons, themes, build adapters, and framework integrations.",
});

export default function DocsOverview() {
  return (
    <article className="docs-article">
      <div className="docs-breadcrumb"><span>Docs</span><b>/</b><span>Getting started</span></div>
      <p className="docs-overline">GETTING STARTED</p>
      <h1>Installation</h1>
      <p className="docs-lead">Start a publishing site with Coordiation CMS, build an HTML-first fullstack application, or add Coordiation CSS to your existing project. Choose the guide that matches what you want to build.</p>
      <div className="docs-callout"><strong>Coordiation CMS · Published on npm</strong><p>Create a complete publishing workspace with posts, pages, SEO controls, and native themes. Requires Node.js 22.18 or newer; Node.js 24 is recommended.</p><Link href="/docs/installation/using-cms">Install Coordiation CMS →</Link></div>
      <div className="docs-callout"><strong>New: Coordiation Fullstack alpha</strong><p>Server-rendered .coord pages, backend APIs and eight guided delivery modes. No required React or Next.js runtime. Requires Node.js 22.18 or newer; alpha APIs may change.</p><Link href="/docs/installation/using-fullstack">Install the fullstack alpha →</Link></div>
      <div className="docs-callout"><strong>Release candidate 1.0.0-rc.1 is available</strong><p>All {capabilities.length} tracked capability areas are implemented and documented across twelve public packages. Install the candidate with the npm <code>next</code> tag while <code>latest</code> remains unchanged.</p><Link href="/docs/releases/1.0.0-rc.1">Read the RC release notes →</Link></div>
      <h2 id="cookbook">Build a complete page</h2>
      <div className="integration-grid framework-integration-grid">
        <Link href="/cookbook"><span>Complete recipe · React + Vite</span><strong>One-page product website</strong><p>Build a responsive landing page section by section, from theme tokens and Coordiation icons through navigation, hero, proof, features, workflow, pricing, FAQ, CTA, footer, and production checks.</p><code>10 sections · copy-ready source</code><b>→</b></Link>
      </div>
      <h2 id="release-candidate">Release candidate</h2>
      <div className="integration-grid">
        <Link href="/docs/releases/1.0.0-rc.1"><span>Published · next</span><strong>1.0.0-rc.1 release notes</strong><p>See the complete package train, lifecycle capabilities, validation results, and stable-release boundary.</p><code>12 public packages</code><b>→</b></Link>
        <Link href="/docs/migration/1.0-rc"><span>From 0.1 and CLI 0.2</span><strong>Migrate to 1.0 RC</strong><p>Upgrade package versions, migrate negative utility syntax, and adopt revision-aware lifecycle contracts.</p><code>@coordiation/upgrade@next</code><b>→</b></Link>
      </div>
      <h2 id="choose-integration">Choose your integration</h2>
      <div className="integration-grid">
        <Link href="/docs/installation/using-npm"><span>Published packages</span><strong>Using npm</strong><p>Install the compiler, adapters, icons, themes, components, and tooling from the public npm registry.</p><code>@coordiation/*</code><b>→</b></Link>
        <Link href="/docs/installation/using-vite"><span>Recommended</span><strong>Using Vite</strong><p>Fast development, automatic template scanning, and stylesheet updates through the official Vite adapter.</p><code>@coordiation/vite</code><b>→</b></Link>
        <Link href="/docs/installation/using-postcss"><span>Flexible</span><strong>Using PostCSS</strong><p>Add Coordiation CSS to an existing PostCSS pipeline.</p><code>@coordiation/postcss</code><b>→</b></Link>
        <Link href="/docs/installation/using-cli"><span>Framework agnostic</span><strong>Using the CLI</strong><p>Compile once or run a durable cross-platform watch process without a bundler plugin.</p><code>coordiation-css</code><b>→</b></Link>
      </div>
      <h2 id="framework-guides">Framework guides</h2>
      <div className="integration-grid framework-integration-grid">
        <Link href="/docs/installation/using-react"><span>Vite</span><strong>React</strong><p>Scan JSX and TSX files with fast updates and zero styling runtime.</p><code>vite.config.js</code><b>→</b></Link>
        <Link href="/docs/installation/using-nextjs"><span>PostCSS</span><strong>Next.js</strong><p>App Router and Pages Router setup through the official PostCSS adapter.</p><code>postcss.config.mjs</code><b>→</b></Link>
        <Link href="/docs/installation/using-astro"><span>Vite</span><strong>Astro</strong><p>Scan Astro components and import the generated virtual stylesheet.</p><code>astro.config.mjs</code><b>→</b></Link>
        <Link href="/docs/installation/using-laravel"><span>Blade + Vite</span><strong>Laravel</strong><p>Compile utilities found in Blade templates and frontend components.</p><code>resources/**</code><b>→</b></Link>
        <Link href="/docs/installation/using-svelte"><span>Vite</span><strong>SvelteKit</strong><p>Register Coordiation beside SvelteKit and load it from the root layout.</p><code>+layout.svelte</code><b>→</b></Link>
        <Link href="/docs/installation/using-html-css"><span>CLI</span><strong>HTML + CSS</strong><p>Generate a static, runtime-free stylesheet without a framework.</p><code>coordiation-css</code><b>→</b></Link>
        <Link href="/docs/installation/using-php"><span>CLI</span><strong>PHP</strong><p>Scan PHP templates and deploy ordinary compiled CSS.</p><code>*.php</code><b>→</b></Link>
        <Link href="/docs/installation/using-wordpress"><span>Theme workflow</span><strong>WordPress</strong><p>Compile inside a custom or child theme and enqueue the generated asset.</p><code>functions.php</code><b>→</b></Link>
      </div>
      <h2 id="requirements">Requirements</h2>
      <ul className="docs-list"><li>Node.js 20 or newer for CSS tooling; CMS and Fullstack require Node.js 22.18 or newer</li><li>Static, complete class names in source files</li><li>Vite 5 or newer when using the Vite adapter</li></ul>
      <div className="docs-next"><span>Next</span><Link href="/docs/installation/using-npm"><b>Install from npm</b><i>→</i></Link></div>
    </article>
  );
}
