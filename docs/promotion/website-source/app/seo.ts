import type { Metadata } from "next";

export const SITE_URL = "https://coordiation.com";
export const SITE_NAME = "Coordiation CSS";
export const DEFAULT_DESCRIPTION =
  "A complete utility-first CSS compiler with CSS-first themes, composable variants, zero browser runtime, and AI-readable tooling.";
export const DEFAULT_SOCIAL_IMAGE = "/og.png";

type SeoMetadataInput = Omit<Metadata, "alternates" | "openGraph" | "twitter"> & {
  path: string;
  alternates?: Metadata["alternates"];
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
};

function textTitle(title: Metadata["title"]): string {
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title && title.absolute) return title.absolute;
  return SITE_NAME;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function createSeoMetadata({ path, ...metadata }: SeoMetadataInput): Metadata {
  const title = textTitle(metadata.title);
  const description = metadata.description ?? DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(path);
  const openGraph = metadata.openGraph ?? {};
  const twitter = metadata.twitter ?? {};
  const requestedOpenGraphImages = "images" in openGraph ? openGraph.images : undefined;
  const requestedTwitterImages = "images" in twitter ? twitter.images : undefined;
  const openGraphImages = Array.isArray(requestedOpenGraphImages)
    ? requestedOpenGraphImages.length > 0
      ? requestedOpenGraphImages
      : [DEFAULT_SOCIAL_IMAGE]
    : requestedOpenGraphImages ?? [DEFAULT_SOCIAL_IMAGE];
  const twitterImages = Array.isArray(requestedTwitterImages)
    ? requestedTwitterImages.length > 0
      ? requestedTwitterImages
      : [DEFAULT_SOCIAL_IMAGE]
    : requestedTwitterImages ?? [DEFAULT_SOCIAL_IMAGE];

  return {
    ...metadata,
    title: { absolute: title },
    description,
    alternates: {
      ...metadata.alternates,
      canonical,
    },
    robots: metadata.robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      ...openGraph,
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...twitter,
      images: twitterImages,
    },
  };
}

export const STATIC_INDEXABLE_ROUTES = [
  "/cms",
  "/",
  "/blogs",
  "/blogs/why-ai-agents-need-product-contracts",
  "/blogs/from-specification-to-production",
  "/blogs/zero-browser-runtime-design-constraint",
  "/blogs/open-code-components-are-easier-to-audit",
  "/blogs/a-registry-is-a-promise-not-a-catalog",
  "/blogs/what-coordination-stable-one-needs",
  "/blogs/questions-that-turn-requests-into-requirements",
  "/blogs/accessibility-belongs-in-the-product-contract",
  "/blogs/prototype-the-risk-not-every-screen",
  "/blogs/qa-evidence-should-map-to-product-decisions",
  "/blogs/ai-readable-frontends-use-fewer-guesses",
  "/blogs/design-tokens-are-product-decisions",
  "/blogs/what-makes-a-theme-truly-installable",
  "/blogs/versioned-artifacts-prevent-invisible-drift",
  "/blogs/a-green-build-is-not-production-readiness",
  "/blogs/native-semantics-make-components-more-durable",
  "/cookbook",
  "/components",
  "/discussions",
  "/discussions/guidelines",
  "/docs",
  "/docs/components",
  "/docs/core/compatibility",
  "/docs/core/custom-utilities",
  "/docs/core/custom-variants",
  "/docs/core/logical-properties",
  "/docs/core/modern-color",
  "/docs/core/plugin-api",
  "/docs/core/preflight",
  "/docs/core/responsive-design",
  "/docs/core/theme-variables",
  "/docs/icons/iconsax-line-oval",
  "/docs/icons/solar-linear",
  "/docs/installation/using-astro",
  "/docs/installation/using-cli",
  "/docs/installation/using-fullstack",
  "/docs/installation/using-html-css",
  "/docs/installation/using-laravel",
  "/docs/installation/using-nextjs",
  "/docs/installation/using-npm",
  "/docs/installation/using-php",
  "/docs/installation/using-postcss",
  "/docs/installation/using-react",
  "/docs/installation/using-svelte",
  "/docs/installation/using-vite",
  "/docs/installation/using-wordpress",
  "/docs/migration/1.0-rc",
  "/docs/releases/1.0.0-rc.1",
  "/docs/themes",
  "/docs/tooling/agent-context",
  "/docs/tooling/css-toolchain",
  "/docs/tooling/formatter",
  "/docs/tooling/incremental-cache",
  "/docs/tooling/language-server",
  "/docs/tooling/native-scanner",
  "/docs/tooling/source-maps",
  "/docs/tooling/upgrade",
  "/docs/utilities",
  "/docs/variants/attribute-selectors",
  "/docs/variants/conditional-rules",
  "/icons",
  "/release-check",
  "/themes",
  "/themes/editorial-advisor",
  "/themes/editorial-advisor/preview",
  "/themes/finance-dashboard",
  "/themes/finance-dashboard/preview",
  "/themes/industrial-forge",
  "/themes/industrial-forge/preview",
  "/themes/mono-portfolio",
  "/themes/mono-portfolio/preview",
  "/themes/noir-habitat",
  "/themes/noir-habitat/preview",
  "/themes/studio-index",
  "/themes/studio-index/preview",
  "/themes/studio-index/preview/work/root-table",
  "/themes/studio-index/preview/work/playroom",
  "/themes/studio-index/preview/work/aperture",
  "/themes/studio-index/preview/work/homebase",
  "/themes/studio-index/preview/work/signal",
  "/themes/studio-index/preview/work/sidecar",
  "/themes/quiet-journal",
  "/themes/quiet-journal/preview",
  "/themes/serein-journal",
  "/themes/serein-journal/preview",
  "/themes/spectrum-studio",
  "/themes/spectrum-studio/preview",
  "/themes/spectrum-studio/preview/work/chromatic-ritual",
  "/themes/spectrum-studio/preview/work/motion-engineered",
  "/themes/spectrum-studio/preview/work/nothing-static",
  "/themes/spectrum-studio/preview/work/form-after-dark",
  "/themes/spectrum-studio/preview/work/human-interface",
  "/themes/spectrum-studio/preview/work/secret-language",
  "/themes/spectrum-studio/preview/studio/arka-wijaya",
  "/themes/spectrum-studio/preview/studio/maya-adelia",
  "/themes/spectrum-studio/preview/studio/keiko-tan",
  "/themes/spectrum-studio/preview/start-project",
  "/themes/indonica",
  "/themes/indonica/preview",
  "/themes/indonica/preview/studio",
  "/themes/indonica/preview/projects",
  "/themes/indonica/preview/contact",
  "/themes/indonica/preview/work/ramu",
  "/themes/indonica/preview/work/ruang",
  "/themes/indonica/preview/work/forma",
  "/themes/indonica/preview/journal",
  "/themes/indonica/preview/journal/a-brand-beyond-the-logo",
  "/themes/indonica/preview/journal/make-room-for-the-story",
  "/themes/indonica/preview/journal/design-that-feels-real",
] as const;
