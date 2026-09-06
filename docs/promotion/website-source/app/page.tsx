import type { Metadata } from "next";
import Link from "@/app/_components/SiteLink";
import { createSeoMetadata } from "@/app/seo";
import HeaderActions from "@/app/_components/HeaderActions";
import NpmDownloadsStat from "./_components/NpmDownloadsStat";
import FullstackIntro from "./_components/FullstackIntro";
import CMSIntro from "./_components/CMSIntro";
import AnimatedNumber from "./_components/AnimatedNumber";
import SolarIcon from "./_components/SolarIcon";
import ThemeCarousel, { type ThemeCarouselSlide } from "./_components/ThemeCarousel";
import { capabilities, type CapabilityStatus } from "./docs/capabilities";
import componentRegistry from "./docs/generated/component-registry.json";
import iconRegistry from "./docs/generated/icon-registry.json";
import themeRegistry from "./docs/generated/theme-registry.json";
import registry from "./docs/generated/utility-registry.json";

export const metadata: Metadata = createSeoMetadata({
  path: "/",
  title: "Coordiation CSS — Build interfaces. Keep the system.",
  description:
    "Build accessible, responsive interfaces with a runtime-free utility-first CSS compiler, open-code components, icons, themes, and AI-readable registries.",
  keywords: [
    "Coordiation CSS",
    "utility-first CSS",
    "CSS framework",
    "open-code components",
    "AI-readable CSS",
  ],
});

const utilityCount = registry.staticUtilities.length;
const familyCount = registry.families.length;
const verifiedExampleCount = registry.families.reduce((total, family) => total + family.resolvedExamples.length, 0);
const completeCapabilityCount = capabilities.filter((capability) => capability.status === "complete").length;
const inProgressCapabilityCount = capabilities.filter((capability) => capability.status === "partial").length;
const componentCount = componentRegistry.componentCount;
const iconCount = iconRegistry.iconCount;
const themeCount = themeRegistry.themeCount;
const npmDownloadFallback = 3084;

const themeVisuals: Record<string, Pick<ThemeCarouselSlide, "accent" | "contrast">> = {
  "editorial-advisor": { accent: "#f1d6a8", contrast: "light" },
  "quiet-journal": { accent: "#d86d3b", contrast: "light" },
  "finance-dashboard": { accent: "#5c55f5", contrast: "dark" },
  "industrial-forge": { accent: "#ff4a12", contrast: "dark" },
  "mono-portfolio": { accent: "#c9ff2f", contrast: "light" },
  "noir-habitat": { accent: "#b79c74", contrast: "dark" },
  "studio-index": { accent: "#258a54", contrast: "light" },
  "signal-agency": { accent: "#c6ff27", contrast: "dark" },
  "serein-journal": { accent: "#b08a4a", contrast: "light" },
  "spectrum-studio": { accent: "#f94137", contrast: "dark" },
};

const themeCarouselSlides: ThemeCarouselSlide[] = themeRegistry.themes.map((theme) => ({
  name: theme.name,
  title: theme.title,
  description: theme.description,
  cover: theme.cover,
  preview: theme.preview,
  detail: `/themes/${theme.name}`,
  command: theme.command,
  sections: theme.sections.length,
  ...(themeVisuals[theme.name] ?? { accent: "#111111", contrast: "dark" }),
}));

function combinedStatus(ids: readonly string[]): CapabilityStatus {
  const statuses = ids.map((id) => capabilities.find((capability) => capability.id === id)?.status ?? "planned");
  if (statuses.includes("planned")) return "planned";
  if (statuses.includes("partial")) return "partial";
  return "complete";
}

const utilities = [
  "co-grid",
  "co-gap-6",
  "co-bg-black",
  "hover:co-bg-white",
  "md:co-grid-cols-3",
  "dark:co-text-white",
];

const featuredAdvantages = [
  {
    index: "01",
    eyebrow: "AI-NATIVE CONTEXT",
    metric: "TASK-SCOPED",
    title: "Give agents the brief, not the whole codebase.",
    description:
      "Generate compact manifests and task packs with only the components, utility hints, rules, files, and checks an agent needs for the work in front of it.",
    href: "/docs/tooling/agent-context",
    link: "Explore agent context",
  },
  {
    index: "02",
    eyebrow: "STATIC BY DEFAULT",
    metric: "0 KB RUNTIME",
    title: "Ship deterministic CSS without browser-side machinery.",
    description:
      "Coordiation scans literal candidates at build time and emits static CSS. The result is predictable, inspectable, and independent of a client runtime.",
    href: "/docs",
    link: "See the compiler",
  },
  {
    index: "03",
    eyebrow: "OWNED UI SOURCE",
    metric: `${componentCount} · ${iconCount.toLocaleString("en-US")} · ${themeCount}`,
    title: "Start with a complete visual vocabulary.",
    description:
      "Install open-code components, first-party icon collections, and complete themes that already use Coordiation classes and machine-readable contracts.",
    href: "/components",
    link: "Browse the UI system",
  },
  {
    index: "04",
    eyebrow: "ONE SOURCE OF TRUTH",
    metric: `${completeCapabilityCount} VERIFIED`,
    title: "Keep docs, agents, and generated CSS in agreement.",
    description:
      "The compiler, documentation, examples, release checks, and APIs are published from tested registries instead of separate hand-maintained promises.",
    href: "/release-check",
    link: "Open release check",
  },
] as const;

const featureGroups = [
  {
    index: "01",
    eyebrow: "COMPILER FOUNDATION",
    title: "Scan, theme, and compile",
    description:
      "A runtime-free compiler scans every supported template, resolves CSS-first tokens, applies Preflight, and emits only the utilities your project uses.",
    ids: ["source-detection", "framework-scanning", "static-output", "theme-variables", "custom-prefix", "important", "arbitrary", "preflight"],
    example: "@coordiation;",
    href: "/docs/core/theme-variables",
  },
  {
    index: "02",
    eyebrow: "ADAPTIVE VARIANTS",
    title: "Compose every condition",
    description:
      "Responsive, state, structural, dark, RTL, group, peer, ARIA, data, media, supports, and container conditions stack predictably.",
    ids: ["responsive", "state-variants", "context-variants", "attribute-variants", "conditional-variants"],
    example: "md:hover:aria-expanded:co-block",
    href: "/docs/variants/conditional-rules",
  },
  {
    index: "03",
    eyebrow: "LAYOUT SYSTEM",
    title: "Structure every interface",
    description:
      "Complete layout, positioning, Flexbox, Grid, spacing, sizing, tables, columns, and logical properties work across writing modes.",
    ids: ["layout", "flex-grid", "spacing-sizing", "tables-columns", "logical"],
    example: "co-grid co-gap-6 md:co-grid-cols-3",
    href: "/docs/utilities/layout",
  },
  {
    index: "04",
    eyebrow: "VISUAL SYSTEM",
    title: "Style without leaving markup",
    description:
      "Typography, modern color, gradients, borders, rings, effects, masks, transforms, transitions, animation, and SVG share one token system.",
    ids: ["typography", "backgrounds", "borders", "effects", "transforms", "transitions", "svg", "icons", "component-registry", "modern-color"],
    example: "co-bg-linear-to-r/oklch co-shadow-lg",
    href: "/docs/utilities/backgrounds",
  },
  {
    index: "05",
    eyebrow: "INCLUSIVE INTERACTION",
    title: "Accessible by construction",
    description:
      "Screen-reader helpers, forced colors, color schemes, cursors, selection, scrollbars, snapping, touch gestures, and reduced motion are built in.",
    ids: ["accessibility", "interaction"],
    example: "co-sr-only motion-reduce:co-animate-none",
    href: "/docs/utilities/interaction",
  },
  {
    index: "06",
    eyebrow: "EXTENSIBILITY",
    title: "Make the framework yours",
    description:
      "Register CSS-first utilities and variants, install reusable plugins, control source discovery, add safelists, and plug in framework extractors.",
    ids: ["custom-utility", "custom-variant", "plugin-api", "sources", "extraction-hooks"],
    example: "@co-utility card-* { ... }",
    href: "/docs/core/plugin-api",
  },
  {
    index: "07",
    eyebrow: "BUILD PIPELINE",
    title: "Fits the tools you already use",
    description:
      "Vite, PostCSS, and CLI adapters share bundling, nesting, prefixing, minification, incremental caching, source maps, and watch diagnostics.",
    ids: ["vite", "postcss", "cli", "css-toolchain", "cache", "source-maps"],
    example: "coordiation-css --content src --watch",
    href: "/docs/installation/using-vite",
  },
  {
    index: "08",
    eyebrow: "DEVELOPER + AI TOOLING",
    title: "Give agents a smaller, verifiable brief",
    description:
      "Compact project manifests, task context packs, the language server, formatter, codemods, and compatibility contracts make automated changes focused and traceable.",
    ids: ["agent-context", "language-server", "formatter", "codemods", "native-scanner", "compatibility"],
    example: "coordiation context pricing --json",
    href: "/docs/tooling/agent-context",
  },
  {
    index: "09",
    eyebrow: "APPLICATION THEMES",
    title: "Begin with the whole story",
    description:
      "Install complete application templates with editable source, responsive composition, original media, documented sections, and AI-readable customization contracts.",
    ids: ["registry-cli", "themes"],
    example: "npx @coordiation/cli@next add theme editorial-advisor",
    href: "/themes",
  },
 ] as const;

const roadmap = featureGroups.map((group) => ({
  name: group.eyebrow,
  count: group.ids.length,
  status: combinedStatus(group.ids),
}));

const statusLabel: Record<CapabilityStatus, string> = { complete: "Complete", partial: "In progress", planned: "Planned" };
const statusClass: Record<CapabilityStatus, string> = { complete: "is-complete", partial: "is-progress", planned: "is-planned" };

const integrations = [
  { name: "Core", label: "Compiler", description: "The scanner, CSS-first theme engine, utility registry, variants, diagnostics, and static CSS emitter.", href: "/docs", code: "@coordiation/css" },
  { name: "Vite", label: "Recommended", description: "Virtual CSS, root-aware scanning, watched theme files, and dependency-aware hot updates.", href: "/docs/installation/using-vite", code: "@coordiation/vite" },
  { name: "PostCSS", label: "Pipeline", description: "A standard PostCSS 8 adapter with dependency messages, warnings, and multi-entry safety.", href: "/docs/installation/using-postcss", code: "@coordiation/postcss" },
  { name: "CLI", label: "Standalone", description: "One-shot builds and durable watch mode with atomic output and no bundler requirement.", href: "/docs/installation/using-cli", code: "coordiation-css" },
  { name: "Language Server", label: "Editor", description: "Completion, compiler-authored hover previews, project configuration, and actionable diagnostics over LSP 3.17.", href: "/docs/tooling/language-server", code: "@coordiation/language-server" },
  { name: "Agent Context", label: "AI-native", description: "Compact project manifests and task packs expose only the components, utility hints, rules, and checks an agent needs.", href: "/docs/tooling/agent-context", code: "@coordiation/agent" },
  { name: "Formatter", label: "Canonical", description: "Stable class sorting powered by the same candidate ordering used by the compiler.", href: "/docs/tooling/formatter", code: "@coordiation/formatter" },
  { name: "Upgrade", label: "Migration", description: "Versioned, idempotent codemods with exact edits, dry runs, JSON plans, and deprecation ownership.", href: "/docs/tooling/upgrade", code: "@coordiation/upgrade" },
  { name: "Oxide", label: "Native", description: "An optional C11 scanner for Linux, macOS, and Windows with explicit JavaScript fallback.", href: "/docs/tooling/native-scanner", code: "@coordiation/oxide" },
  { name: "Icons", label: "2,165 glyphs", description: "Complete Solar Linear and Iconsax Line Oval collections with tree-shakeable SVG strings, accessible rendering, provenance, and an AI-readable registry.", href: "/icons", code: "@coordiation/icons" },
  { name: "Components", label: "64 open-code components", description: "A complete independent React catalog with owned source, Coordiation utilities, install endpoints, and AI-readable contracts.", href: "/components", code: "@coordiation/ui" },
  { name: "Installer", label: "First-party CLI", description: "Install owned component or application theme source, bundled SVG icons, and declared media with safe paths and explicit overwrite protection.", href: "/docs/themes", code: "@coordiation/cli" },
  { name: "Themes", label: `${themeCount} complete applications`, description: "Original, responsive portfolios, journals, dashboards, creative and architecture studios, industrial sites, and detailed case-study systems with live previews, owned source, Coordiation components, install endpoints, and section-level AI contracts.", href: "/themes", code: "@coordiation/themes" },
];

export default function Home() {
  return (
    <main>
      <div className="announcement">
        <span className="announcement-dot" />
        {inProgressCapabilityCount ? `${completeCapabilityCount} capabilities complete · ${inProgressCapabilityCount} in progress` : `All ${completeCapabilityCount} tracked capabilities are complete`}
        <Link href="/release-check">View release readiness <SolarIcon name="arrow-right" size={14} /></Link>
      </div>

      <header className="managed-header site-header home-header">
        <a className="brand" href="#top" aria-label="Coordiation CSS home">
          <img src="/coordiation-logo.png" alt="" />
          <span>Coordiation</span>
          <span className="brand-product">CSS</span>
        </a>
        <nav aria-label="Main navigation">
          <Link href="/cookbook">Cookbook</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/discussions">Discuss</Link>
          <Link href="/components">Components</Link>
          <Link href="/themes">Themes</Link>
          <Link href="/cms">CMS</Link>
          <Link href="/icons">Icons</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <HeaderActions />
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <img className="hero-watermark" src="/coordiation-logo.png" alt="" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow"><span>CO</span> Utility-first · AI-readable · Runtime-free</div>
          <h1>Build interfaces.<br /><em>Keep the system.</em></h1>
          <p>
            A complete utility-first CSS system for Coordiation. Build responsive,
            accessible interfaces with {completeCapabilityCount} verified capabilities, {integrations.length} official packages,
            CSS-first tokens, and machine-readable tooling.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/docs/installation/using-vite">Start building <SolarIcon name="arrow-right" size={16} /></Link>
            <a className="button button-light" href="#engine">See how it works</a>
          </div>
          <div className="hero-proof">
            <span><b>0</b> browser runtime</span>
            <span><b>{utilityCount}</b> static utilities</span>
            <span><b>{familyCount}</b> complete families</span>
            <span><b>JSON</b> AI-readable</span>
          </div>
        </div>

        <div className="hero-demo" aria-label="Coordiation CSS code example">
          <div className="window-bar">
            <div className="window-dots"><i /><i /><i /></div>
            <span>hero.coord</span>
            <span className="window-status">compiled</span>
          </div>
          <pre className="code-block"><code>
            <span className="line"><span className="ln">01</span><span className="muted">&lt;</span><span className="tag">section</span></span>
            <span className="line"><span className="ln">02</span>  <span className="attr">class</span><span className="muted">=</span><span className="string">&quot;co-grid co-gap-8</span></span>
            <span className="line"><span className="ln">03</span>         <span className="string">co-bg-white co-p-8</span></span>
            <span className="line line-focus"><span className="ln">04</span>         <span className="string">md:co-grid-cols-2</span></span>
            <span className="line"><span className="ln">05</span>         <span className="string">dark:co-bg-black&quot;</span><span className="muted">&gt;</span></span>
            <span className="line"><span className="ln">06</span>  <span className="muted">&lt;</span><span className="tag">h1</span> <span className="attr">class</span><span className="muted">=</span><span className="string">&quot;co-text-6xl</span></span>
            <span className="line"><span className="ln">07</span>      <span className="string">co-font-bold&quot;</span><span className="muted">&gt;</span></span>
            <span className="line"><span className="ln">08</span>    Move at the speed of thought.</span>
            <span className="line"><span className="ln">09</span>  <span className="muted">&lt;/</span><span className="tag">h1</span><span className="muted">&gt;</span></span>
            <span className="line"><span className="ln">10</span><span className="muted">&lt;/</span><span className="tag">section</span><span className="muted">&gt;</span></span>
          </code></pre>
          <div className="compile-line">
            <span className="compile-check"><SolarIcon name="check-circle" size={16} /></span>
            <span><b>{familyCount}</b> families verified</span>
            <span className="compile-size">{utilityCount} utilities indexed</span>
          </div>
        </div>
      </section>

      <section className="utility-marquee" aria-label="Example utilities">
        <span className="marquee-label">LITERAL · TRACEABLE</span>
        <div className="marquee-track">
          {[...utilities, ...utilities].map((utility, index) => (
            <code key={`${utility}-${index}`}>{utility}</code>
          ))}
        </div>
      </section>

      <section className="homepage-stats" aria-label="Framework statistics">
        <div><AnimatedNumber value={utilityCount} /><span>Static utilities</span><p>Generated from the canonical compiler registry.</p></div>
        <div><AnimatedNumber value={familyCount} delay={40} /><span>Complete families</span><p>Every family is documented and registry-backed.</p></div>
        <div><AnimatedNumber value={verifiedExampleCount} delay={80} /><span>Verified examples</span><p>Broken examples fail registry generation.</p></div>
        <div><AnimatedNumber value={completeCapabilityCount} delay={120} /><span>Complete capabilities</span><p>Published through the machine-readable API.</p></div>
        <div className="homepage-stat-product"><AnimatedNumber value={iconCount} delay={160} /><span>Coordiation icons</span><p>Solar Linear and Iconsax Line Oval, ready to import.</p></div>
        <div className="homepage-stat-product"><AnimatedNumber value={componentCount} delay={200} /><span>Open-code components</span><p>Accessible source you can install, inspect, and own.</p></div>
        <div className="homepage-stat-product"><AnimatedNumber value={themeCount} delay={240} /><span>Complete themes</span><p>Responsive application starting points built with Coordiation.</p></div>
        <NpmDownloadsStat initialDownloads={npmDownloadFallback} />
      </section>

      <FullstackIntro />

      <CMSIntro />

      <ThemeCarousel slides={themeCarouselSlides} />

      <section className="homepage-advantages" aria-labelledby="advantages-heading">
        <div className="homepage-advantages-heading">
          <p className="kicker kicker-light">WHY COORDIATION</p>
          <h2 id="advantages-heading">Move faster.<br />Keep every decision.</h2>
          <p>Coordiation gives human and AI teams one compact, verifiable system for moving from an idea to a production interface without rebuilding the foundation.</p>
        </div>
        <div className="homepage-advantage-grid">
          {featuredAdvantages.map((feature) => (
            <article className="homepage-advantage-card" key={feature.index}>
              <div><span>{feature.index} · {feature.eyebrow}</span><b>{feature.metric}</b></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <Link href={feature.href}>{feature.link} <SolarIcon name="arrow-to-top-right" size={15} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="section-heading">
          <p className="kicker">THE SYSTEM</p>
          <h2>Small utilities.<br />Serious capability.</h2>
          <p>All {completeCapabilityCount} completed capabilities are grouped below by the job they solve. Every item links back to the same tested registry used by the compiler and documentation.</p>
        </div>
        <div className="feature-suite-grid">
          {featureGroups.map((feature) => (
            <article className="feature-suite-card" key={feature.index}>
              <div className="feature-suite-topline"><span>{feature.index} · {feature.eyebrow}</span><b>{feature.ids.length} capabilities</b></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-suite-list">
                {feature.ids.map((id) => <span key={id}>{capabilities.find((capability) => capability.id === id)?.area}</span>)}
              </div>
              <div className="feature-suite-footer"><code>{feature.example}</code><Link href={feature.href}>Explore <SolarIcon name="arrow-to-top-right" size={14} /></Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section system-showcase" id="system">
        <div className="section-heading">
          <p className="kicker">ONE SYSTEM</p>
          <h2>Human-readable.<br />Agent-verifiable.</h2>
          <p>The same CSS-first decisions power authored components, generated utilities, documentation, and machine-readable manifests.</p>
        </div>
        <div className="showcase-grid">
          <article className="showcase-card showcase-theme">
            <div className="showcase-meta"><span>01 · THEME</span><Link href="/docs/core/theme-variables">Explore tokens <SolarIcon name="arrow-to-top-right" size={14} /></Link></div>
            <h3>Own the design system in CSS.</h3>
            <p>Extend or override colors, type, radii, shadows, breakpoints, perspective, and motion through recognized variables.</p>
            <div className="showcase-palette" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <code>--co-color-product: oklch(62% .2 260);</code>
          </article>
          <article className="showcase-card showcase-responsive">
            <div className="showcase-meta"><span>02 · RESPONSIVE</span><Link href="/docs/core/responsive-design">Explore breakpoints <SolarIcon name="arrow-to-top-right" size={14} /></Link></div>
            <h3>Adapt by viewport or local space.</h3>
            <p>Compose mobile-first breakpoints, exact ranges, media features, and named container queries without runtime listeners.</p>
            <div className="showcase-layout" aria-hidden="true"><aside /><div><i /><i /><i /></div></div>
            <code>md:co-grid-cols-2 @lg/card:co-grid-cols-3</code>
          </article>
          <article className="showcase-card showcase-ai">
            <div className="showcase-meta"><span>03 · AI CONTRACT</span><a href="/api/capabilities">Open API <SolarIcon name="arrow-to-top-right" size={14} /></a></div>
            <h3>Generate only what really ships.</h3>
            <p>Agents can inspect capability status, class patterns, resolved declarations, variants, and limitations before writing code.</p>
            <pre><code>{`{
  "framework": "Coordiation CSS",
  "status": "complete",
  "candidate": "md:co-grid-cols-3"
}`}</code></pre>
          </article>
        </div>
      </section>

      <section className="engine-section" id="engine">
        <div className="engine-copy">
          <p className="kicker kicker-light">THE ENGINE</p>
          <h2>From template<br />to tiny CSS.</h2>
          <p>Coordiation reads your source as text, resolves every candidate against your tokens, composes its variants, and emits deterministic CSS.</p>
          <ol className="engine-steps">
            <li><span>01</span><div><b>Scan</b><small>Find complete utility candidates</small></div></li>
            <li><span>02</span><div><b>Resolve</b><small>Connect utilities to design tokens</small></div></li>
            <li><span>03</span><div><b>Compose</b><small>Apply variants and conditions</small></div></li>
            <li><span>04</span><div><b>Emit</b><small>Write static, layered CSS</small></div></li>
          </ol>
        </div>
        <div className="engine-terminal">
          <div className="terminal-title"><span>coordiation-css</span><span>● LIVE</span></div>
          <div className="terminal-body">
            <p><span className="prompt">$</span> coordiation-css --content src</p>
            <p className="terminal-muted">Scanning <b>src/**/*.{`{coord,tsx,html}`}</b></p>
            <div className="terminal-meter"><span /></div>
            <p><span className="terminal-check"><SolarIcon name="check-circle" size={14} /></span> {familyCount} utility families loaded</p>
            <p><span className="terminal-check"><SolarIcon name="check-circle" size={14} /></span> {utilityCount} static utilities indexed</p>
            <p><span className="terminal-check"><SolarIcon name="check-circle" size={14} /></span> 0 unsupported utilities</p>
            <div className="terminal-result">
              <span>utility-registry.json</span>
              <strong>{verifiedExampleCount} verified</strong>
              <small>AI-readable manifest</small>
            </div>
          </div>
        </div>
      </section>

      <section className="ai-native-section">
        <div>
          <p className="kicker kicker-light">BUILT FOR HUMAN + AI TEAMS</p>
          <h2>A support contract,<br />not a guessing game.</h2>
          <p>Coordiation publishes the exact capabilities and utilities an agent may use. Every generated class can be traced back to a tested declaration.</p>
          <div className="ai-native-actions"><a href="/llms.txt">Read llms.txt <SolarIcon name="arrow-right" size={15} /></a><a href="/api/capabilities">Capability API <SolarIcon name="arrow-right" size={15} /></a></div>
        </div>
        <div className="ai-contract-card">
          <div><span>AGENT CHECKLIST</span><span>LIVE</span></div>
          <ol><li><b>01</b><span>Read framework instructions</span><code>/llms.txt</code></li><li><b>02</b><span>Inspect support status</span><code>/api/capabilities</code></li><li><b>03</b><span>Discover owned UI source</span><code>/api/components</code></li><li><b>04</b><span>Resolve exact utilities</span><code>/api/utilities</code></li><li><b>05</b><span>Emit literal candidates</span><code>co-*</code></li></ol>
        </div>
      </section>

      <section className="section quick-start" id="quick-start">
        <div className="section-heading compact">
          <p className="kicker">QUICK START</p>
          <h2>Start with Vite.</h2>
          <p>Install the independent compiler and official adapter, then import one generated virtual stylesheet.</p>
        </div>
        <div className="install-card">
          <div className="install-tabs"><span className="active">Vite</span><span>PostCSS</span><span>CLI</span><i>RECOMMENDED</i></div>
          <code><span>$</span> pnpm add -D @coordiation/css @coordiation/vite</code>
          <div className="install-divider" />
          <pre><span className="muted">{"/* src/coordiation.css */"}</span>{`\n`}@coordiation;{`\n\n`}@co-theme {`{`}{`\n`}  --co-color-product: oklch(62% 0.2 260);{`\n`}{`}`}</pre>
          <div className="install-next"><Link href="/docs/installation/using-vite">Continue with the Vite guide <SolarIcon name="arrow-right" size={15} /></Link></div>
        </div>
      </section>

      <section className="section integrations-section" id="integrations">
        <div className="section-heading">
          <p className="kicker">OFFICIAL PACKAGES</p>
          <h2>One system.<br />Every workflow.</h2>
          <p>Twelve entry points cover compilation, installation, themes, components, icons, build integration, editor intelligence, formatting, upgrades, and optional native scanning.</p>
        </div>
        <div className="homepage-integration-grid">
          {integrations.map((integration, index) => <Link href={integration.href} key={integration.name}>
            <div><span>{String(index + 1).padStart(2, "0")}</span><span>{integration.label}</span></div>
            <h3>{integration.name}</h3>
            <p>{integration.description}</p>
            <code>{integration.code}</code><b><SolarIcon name="arrow-right" size={18} /></b>
          </Link>)}
        </div>
      </section>

      <section className="section roadmap-section" id="roadmap">
        <div className="roadmap-copy">
          <p className="kicker">COMPLETE FEATURE MAP</p>
          <h2>Nothing hidden.<br />Nothing implied.</h2>
          <p>Every shipped feature belongs to a named group, a tested capability ID, and a documentation path. The Release Check remains the exact source of truth.</p>
          <Link href="/release-check">Open release check <SolarIcon name="arrow-right" size={16} /></Link>
        </div>
        <div className="roadmap-list">
          {roadmap.map(({ name, count, status }, index) => (
            <div className="roadmap-row" key={name}>
              <span className="roadmap-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{name}<small>{count} capabilities</small></strong>
              <span className={`roadmap-status ${statusClass[status]}`}><i />{statusLabel[status]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="creator-section" id="about" aria-labelledby="creator-heading">
        <figure className="creator-portrait">
          <img src="/wiryo-saputra.png" alt="Wiryo Saputra, creator of Coordiation" width="1254" height="1254" loading="lazy" decoding="async" />
          <figcaption><span>CREATOR / FOUNDER</span><span>COORDIATION · 2026</span></figcaption>
        </figure>
        <div className="creator-copy">
          <p className="kicker">WHY I BUILT COORDIATION</p>
          <h2 id="creator-heading">Make products that<br /><em>matter to people.</em></h2>
          <p className="creator-lede">Coordiation exists to help you move from a good idea to a dependable product without rebuilding the same foundations every time.</p>
          <blockquote>I built this framework so human and AI teams can spend less time fighting their tools and spend more time understanding real needs, creating useful products, and helping more people.</blockquote>
          <div className="creator-signoff">
            <div><strong>Wiryo Saputra</strong><span>Creator of Coordiation</span></div>
            <a href="mailto:wiryosaputra@coordiation.com"><SolarIcon name="letter" size={19} />wiryosaputra@coordiation.com</a>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <img src="/coordiation-logo-white.png" alt="" />
        <p className="kicker kicker-light">COORDIATION STARTS HERE</p>
        <h2>Build the interface.<br />Keep the system.</h2>
        <Link className="button button-white" href="/docs/installation/using-vite">Read the installation guide <SolarIcon name="arrow-right" size={16} /></Link>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <img src="/coordiation-logo.png" alt="" />
          <span>Coordiation</span><span className="brand-product">CSS</span>
        </a>
        <p>Independent utility-first CSS for the Coordiation framework.</p>
        <span>© 2026 Coordiation</span>
      </footer>
    </main>
  );
}
