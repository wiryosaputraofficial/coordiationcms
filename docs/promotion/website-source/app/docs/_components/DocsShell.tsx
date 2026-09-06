"use client";

import Link from "@/app/_components/SiteLink";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import SolarIcon from "../../_components/SolarIcon";
import HeaderActions from "@/app/_components/HeaderActions";

const navigation = [
  { title: "Coordiation CMS", items: [["Install CMS", "/docs/installation/using-cms"], ["Administrator setup", "/docs/installation/using-cms#administrator"], ["Deploy your CMS", "/docs/installation/using-cms#production"], ["CMS showcase", "/cms"]] },
  { title: "Fullstack alpha", items: [["Install Fullstack", "/docs/installation/using-fullstack"], ["Guided delivery modes", "/docs/installation/using-fullstack#delivery-modes"]] },
  { title: "Getting started", items: [["Installation", "/docs"], ["Using npm", "/docs/installation/using-npm"], ["Using Vite", "/docs/installation/using-vite"], ["Themes", "/docs/themes"], ["Components", "/docs/components"], ["Solar Linear icons", "/docs/icons/solar-linear"], ["Iconsax Line Oval icons", "/docs/icons/iconsax-line-oval"], ["Editor setup", "/docs/tooling/language-server"], ["Compatibility", "/docs/core/compatibility"]] },
  { title: "Cookbooks", items: [["Build a one-page website", "/cookbook"]] },
  { title: "Framework guides", items: [["React", "/docs/installation/using-react"], ["Next.js", "/docs/installation/using-nextjs"], ["Astro", "/docs/installation/using-astro"], ["Laravel", "/docs/installation/using-laravel"], ["SvelteKit", "/docs/installation/using-svelte"], ["HTML + CSS", "/docs/installation/using-html-css"], ["PHP", "/docs/installation/using-php"], ["WordPress", "/docs/installation/using-wordpress"]] },
  { title: "Core concepts", items: [["Utility classes", "#utility-classes"], ["Custom utilities", "/docs/core/custom-utilities"], ["Custom variants", "/docs/core/custom-variants"], ["Plugin API", "/docs/core/plugin-api"], ["Compatibility", "/docs/core/compatibility"], ["Preflight", "/docs/core/preflight"], ["Logical properties", "/docs/core/logical-properties"], ["Modern color", "/docs/core/modern-color"], ["Responsive design", "/docs/core/responsive-design"], ["Attribute selectors", "/docs/variants/attribute-selectors"], ["Conditional variants", "/docs/variants/conditional-rules"], ["Theme variables", "/docs/core/theme-variables"]] },
  { title: "Core utilities", items: [["Utility registry", "/docs/utilities"], ["Layout", "/docs/utilities/layout"], ["Flexbox & Grid", "/docs/utilities/flex-grid"], ["Spacing", "/docs/utilities/spacing"], ["Sizing", "/docs/utilities/sizing"], ["Typography", "/docs/utilities/typography"], ["Backgrounds", "/docs/utilities/backgrounds"], ["Borders & Rings", "/docs/utilities/borders-rings"], ["Effects", "/docs/utilities/effects"], ["Tables & Columns", "/docs/utilities/tables-columns"], ["Transforms & 3D", "/docs/utilities/transforms"], ["Transitions & Animation", "/docs/utilities/transitions"], ["SVG", "/docs/utilities/svg"], ["Accessibility", "/docs/utilities/accessibility"], ["Interactivity", "/docs/utilities/interaction"], ["Arbitrary properties", "/docs/utilities/arbitrary-properties"]] },
  { title: "Icons", items: [["Browse all icons", "/icons"], ["Solar Linear guide", "/docs/icons/solar-linear"], ["Iconsax Line Oval guide", "/docs/icons/iconsax-line-oval"], ["Icon registry", "/icon-registry.json"]] },
  { title: "Components", items: [["Browse components", "/components"], ["Registry guide", "/docs/components"], ["AI component manifest", "/component-registry.json"], ["Coordiation catalog", "/r/registry.json"]] },
  { title: "Themes", items: [["Browse themes", "/themes"], ["Installation guide", "/docs/themes"], ["AI theme manifest", "/theme-registry.json"], ["Theme catalog", "/r/themes/registry.json"]] },
  { title: "Release & migration", items: [["1.0.0-rc.1 release notes", "/docs/releases/1.0.0-rc.1"], ["Migrate to 1.0 RC", "/docs/migration/1.0-rc"], ["Release Check", "/release-check"], ["Compatibility policy", "/docs/core/compatibility"], ["Upgrade codemods", "/docs/tooling/upgrade"]] },
  { title: "Tooling", items: [["AI agent context", "/docs/tooling/agent-context"], ["CSS toolchain", "/docs/tooling/css-toolchain"], ["Incremental cache", "/docs/tooling/incremental-cache"], ["Source maps", "/docs/tooling/source-maps"], ["IntelliSense & LSP", "/docs/tooling/language-server"], ["Class formatter", "/docs/tooling/formatter"], ["Upgrade & codemods", "/docs/tooling/upgrade"], ["Native scanner", "/docs/tooling/native-scanner"], ["Vite", "/docs/installation/using-vite"], ["PostCSS", "/docs/installation/using-postcss"], ["CLI", "/docs/installation/using-cli"], ["AI integration", "#ai-integration"]] },
] as const;

export default function DocsShell({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => navigation.flatMap((section) => section.items.map(([label, href]) => ({ label, href, section: section.title }))).filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6), [query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="reference-page">
      <header className="managed-header reference-header">
        <Link prefetch={false} className="brand" href="/" aria-label="Coordiation CSS home"><img src="/coordiation-logo.png" alt="" /><span>Coordiation</span><span className="brand-product">CSS</span></Link>
        <div className="docs-search"><SolarIcon name="magnifier" size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search documentation…" aria-label="Search documentation" /><kbd>⌘ K</kbd>{query && <div className="docs-search-results">{results.length ? results.map((item) => <Link prefetch={false} href={item.href} key={`${item.section}-${item.label}`} onClick={() => setQuery("")}><span>{item.label}</span><small>{item.section}</small></Link>) : <p>No matching documentation.</p>}</div>}</div>
        <nav aria-label="Documentation links"><Link prefetch={false} href="/cookbook">Cookbook</Link><Link prefetch={false} href="/blogs">Blogs</Link><Link prefetch={false} href="/discussions">Discuss</Link><Link prefetch={false} href="/themes">Themes</Link><Link prefetch={false} href="/components">Components</Link><Link prefetch={false} href="/icons">Icons</Link><Link prefetch={false} href="/release-check">Release Check</Link><a href="/api/capabilities">API</a><Link prefetch={false} className="docs-home-link" href="/">Home <SolarIcon name="arrow-to-top-right" size={14} /></Link></nav>
        <HeaderActions></HeaderActions></header>
      <div className="reference-layout">
        <aside className="reference-sidebar" aria-label="Documentation sections">
          <div className="docs-version"><span>Documentation</span><code>1.0.0-rc.1</code></div>
          {navigation.map((section) => <section key={section.title}><h2>{section.title}</h2><ul>{section.items.map(([label, href]) => <li key={label}><Link prefetch={false} href={href}>{label}</Link></li>)}</ul></section>)}
        </aside>
        <div className="reference-content">{children}</div>
      </div>
    </div>
  );
}
