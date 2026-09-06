import type { Metadata } from "next";
import Link from "../_components/SiteLink";
import HeaderActions from "../_components/HeaderActions";
import SolarIcon from "../_components/SolarIcon";
import { createSeoMetadata } from "../seo";
import styles from "./showcase.module.css";

export const metadata: Metadata = createSeoMetadata({
  path: "/cms",
  title: "Coordiation CMS — Your content. Your themes. Your space.",
  description: "Explore Coordiation CMS: a self-hosted publishing workspace with a block editor, SEO controls, OpenAI writing assistance, and editable native themes. See real admin screenshots and the live public preview.",
});

const screens = [
  { id: "dashboard", image: "admin-dashboard", label: "01 / YOUR WORKSPACE", title: "Everything starts here.", copy: "An overview of your posts, pages, media, comments, and active theme. One sidebar connects the whole publishing workflow.", alt: "Coordiation CMS dashboard with content counts, recent content, and sidebar navigation" },
  { id: "editor", image: "admin-editor", label: "02 / WRITE & PUBLISH", title: "Make room for your next story.", copy: "Compose posts and pages with structured blocks. Review the SEO meter, edit search metadata, and use OpenAI for drafts and suggestions when connected.", alt: "Post editor with paragraph and heading blocks, AI writing button, and live SEO meter" },
  { id: "homepage", image: "admin-homepage", label: "03 / MAKE IT YOURS", title: "Your homepage, in your hands.", copy: "Edit Teraform’s 13 homepage sections, from headlines and images to contact details. Set colors, typography, entrance animations, and image parallax.", alt: "Teraform homepage editor with section navigation and editable hero content" },
  { id: "themes", image: "admin-themes", label: "04 / A NATIVE THEME SYSTEM", title: "One CMS. Different expressions.", copy: "Preview and switch themes, edit their source, and import or export native theme packages. Create your own variants for clients or distribution.", alt: "Coordiation CMS theme management screen with included theme previews and installation controls" },
];

export default function CMSShowcase() {
  return <main className={styles.page}>
    <header className="managed-header site-header">
      <Link className="brand" href="/" aria-label="Coordiation home"><img src="/coordiation-logo.png" alt="" /><span>Coordiation</span><span className="brand-product">CMS</span></Link>
      <nav aria-label="Main navigation"><Link href="/">Home</Link><a href="#inside">Inside the CMS</a><a href="#teraform">Teraform</a><Link href="/docs/installation/using-fullstack">Fullstack</Link></nav>
      <HeaderActions><a className="header-cta" href="https://app.coordiation.com/" target="_blank" rel="noopener noreferrer">Live preview <SolarIcon name="arrow-to-top-right" size={15} /></a></HeaderActions>
    </header>
    <section className={styles.hero}>
      <p className={styles.eyebrow}><span className={styles.dot} /> INTRODUCING COORDIATION CMS · EARLY PREVIEW</p>
      <h1>Your content.<br />Your themes.<br /><em>Your space.</em></h1>
      <div className={styles.heroBottom}><p>A publishing home built with Coordiation Fullstack. Write stories, shape your website, and make your next theme your own.</p><div className={styles.actions}><a className="button button-dark" href="https://app.coordiation.com/" target="_blank" rel="noopener noreferrer">Open live preview <SolarIcon name="arrow-to-top-right" size={17} /></a><a className="button button-light" href="#inside">Explore the admin <SolarIcon name="arrow-down" size={17} /></a></div></div>
      <div className={styles.tags}><span>Self-hosted</span><span>Posts & pages</span><span>Native themes</span><span>SEO + AI writing</span></div>
    </section>
    <section id="inside" className={styles.inside}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>A LOOK INSIDE</p><h2>From the first draft<br />to your next launch.</h2></div><p>Real screenshots of the current CMS, using sample content. Take a closer look at the tools behind your website.</p></div>
      <nav className={styles.screenNav} aria-label="Screenshot gallery">{screens.map(s=><a key={s.id} href={`#${s.id}`}>{s.id === "homepage" ? "Homepage editor" : s.id === "editor" ? "Post editor & SEO" : s.title === "Everything starts here." ? "Dashboard" : "Themes"}<SolarIcon name="arrow-down" size={14} /></a>)}</nav>
      <div className={styles.screenGrid}>{screens.map(s=><article id={s.id} className={styles.screen} key={s.id}><div className={styles.screenCopy}><p className={styles.eyebrow}>{s.label}</p><h3>{s.title}</h3><p>{s.copy}</p></div><a className={styles.imageLink} href={`/cms/${s.image}.jpg`} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size screenshot: ${s.alt}`}><img src={`/cms/${s.image}.jpg`} width="1265" height="712" alt={s.alt} loading="lazy" /><span>View full size <SolarIcon name="arrow-to-top-right" size={15} /></span></a></article>)}</div>
    </section>
    <section id="teraform" className={styles.theme}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>MEET TERAFORM</p><h2>Designed to be<br />made your own.</h2></div><p>A creative studio theme with an editable homepage, matching blog and article layouts, and configurable motion. Teraform is one of the included native CMS themes.</p></div>
      <a className={styles.themeImage} href="/cms/teraform-homepage.jpg" target="_blank" rel="noopener noreferrer" aria-label="Open full-size Teraform homepage screenshot"><img src="/cms/teraform-homepage.jpg" width="1265" height="712" alt="Teraform homepage with editorial typography and orange and green sculptural artwork" loading="lazy" /></a>
      <p className={styles.caption}>Teraform theme shown with sample content. The live site may use a different active theme.</p>
    </section>
    <section className={styles.closing}><p className={styles.eyebrow}>EXPLORE THE CURRENT BUILD</p><h2>See it in action.</h2><p>The public website is ready to explore. Browse the source and follow development on GitHub.</p><div className={styles.actions}><a className="button button-dark" href="https://app.coordiation.com/" target="_blank" rel="noopener noreferrer">Visit live preview <SolarIcon name="arrow-to-top-right" size={17} /></a><a className="button button-light" href="https://github.com/wiryosaputraofficial/coordiationcms" target="_blank" rel="noopener noreferrer">View on GitHub <SolarIcon name="arrow-to-top-right" size={17} /></a></div><p className={styles.note}>Version 0.1 preview. Built on Coordiation Fullstack alpha. Uses native Coordiation CMS themes; WordPress PHP themes and plugins are not compatible. OpenAI writing requires your own API key.</p></section>
    <footer className={styles.footer}><Link className="brand" href="/"><img src="/coordiation-logo.png" alt="" /><span>Coordiation</span></Link><span>Made for stories. Built with Coordiation.</span><Link href="/docs/installation/using-fullstack">Explore Fullstack <SolarIcon name="arrow-right" size={16} /></Link></footer>
  </main>;
}
