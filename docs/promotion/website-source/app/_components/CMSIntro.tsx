import Link from "./SiteLink";
import SolarIcon from "./SolarIcon";
import styles from "./CMSIntro.module.css";

export default function CMSIntro() {
  return <section className={styles.section} aria-labelledby="cms-heading"><div className={styles.copy}><p className={styles.eyebrow}>BUILT WITH COORDIATION · CMS PREVIEW</p><h2 id="cms-heading">A home for<br />your next story.</h2><p>Meet Coordiation CMS. Write posts, shape pages, and customize native themes in one publishing workspace.</p><div className={styles.links}><Link className="button button-dark" href="/cms">Explore the CMS <SolarIcon name="arrow-right" size={16} /></Link><a href="https://app.coordiation.com/" target="_blank" rel="noopener noreferrer">Live preview <SolarIcon name="arrow-to-top-right" size={16} /></a></div><p className={styles.note}>Early preview · Real admin screenshots · Self-hosted</p></div><Link className={styles.image} href="/cms#inside" aria-label="Explore screenshots inside Coordiation CMS"><img src="/cms/admin-dashboard.jpg" alt="Coordiation CMS dashboard with its content management sidebar and publishing overview" width="1265" height="712" loading="lazy" /><span>STEP INSIDE THE CMS <SolarIcon name="arrow-to-top-right" size={16} /></span></Link></section>;
}
