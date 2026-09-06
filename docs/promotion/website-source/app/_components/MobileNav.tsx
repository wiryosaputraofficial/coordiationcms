"use client";

import Link from "@/app/_components/SiteLink";
import SolarIcon from "./SolarIcon";
import { authClient } from "@/app/lib/auth-client";

const links = [
  ["Home", "/"],
  ["Docs", "/docs"],
  ["Cookbook", "/cookbook"],
  ["Blogs", "/blogs"],
  ["Discussions", "/discussions"],
  ["Components", "/components"],
  ["Themes", "/themes"],
  ["CMS", "/cms"],
  ["Shop", "https://shop.coordiation.com/"],
  ["Icons", "/icons"],
  ["Release Check", "/release-check"],
  ["Capabilities API", "/api/capabilities"],
  ["1.0 RC notes", "/docs/releases/1.0.0-rc.1"],
  ["Migration guide", "/docs/migration/1.0-rc"],
  ["Get started", "/docs/installation/using-vite"],
] as const;

export default function MobileNav() {
  const { data: session, isPending } = authClient.useSession();
  const accountLink = session ? [session.user.name || "Profile", "/profile"] as const : [isPending ? "Account" : "Sign in", isPending ? "/profile" : "/login"] as const;
  return (
    <details className="mobile-nav">
      <summary aria-label="Open main navigation">
        <SolarIcon name="hamburger-menu" size={19} />
        <span>Menu</span>
      </summary>
      <nav aria-label="Mobile navigation">
        {links.map(([label, href]) => (
          <Link className={label === "Get started" ? "mobile-nav-cta" : undefined} href={href} prefetch={false} key={href}>
            <span>{label}</span>
            <SolarIcon name={label === "Shop" ? "shop" : "arrow-right"} size={label === "Shop" ? 20 : 14} />
          </Link>
        ))}
        <Link href={accountLink[1]} prefetch={false}>
          <span>{accountLink[0]}</span>
          <SolarIcon name={session ? "user-circle" : "arrow-right"} size={14} />
        </Link>
      </nav>
    </details>
  );
}
