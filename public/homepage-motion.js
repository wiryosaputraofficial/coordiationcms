/* Trusted CMS enhancement. Theme packages cannot supply executable scripts. */
(() => {
  const site = document.querySelector(".fx-site");
  if (!site || !Element.prototype.animate || !window.IntersectionObserver)
    return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let dispose = () => {};
  function start() {
    dispose();
    if (reduced.matches) return;
    const animations = new Set();
    const observers = [];
    const cleanup = [];
    let frame = 0;
    dispose = () => {
      cancelAnimationFrame(frame);
      observers.forEach((observer) => observer.disconnect());
      animations.forEach((animation) => animation.cancel());
      cleanup.forEach((fn) => fn());
    };
    if (document.body.dataset.animation === "on") {
      const selector =
        ".fx-hero-copy > *, .fx-section-intro, .fx-about-grid > *, .fx-service, .fx-process > *, .fx-project, .fx-benefits > *, .fx-reviews > *, .fx-statistics > *, .fx-pricing > *, .fx-faq-grid > *, .fx-contact-grid > *, .fx-contact-details > *, .fx-footer-top > *, .fx-wordmark, .fx-blog-hero > *, .fx-blog-card, .fx-article-header > *";
      const reveal = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal.unobserve(entry.target);
            if (entry.target.contains(document.activeElement)) return;
            const siblings = [...entry.target.parentElement.children];
            const delay = Math.min(siblings.indexOf(entry.target) % 4, 3) * 65;
            const animation = entry.target.animate(
              [
                { opacity: 0, transform: "translateY(24px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 700,
                delay,
                easing: "cubic-bezier(.22,1,.36,1)",
                fill: "backwards",
              },
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
          });
        },
        { threshold: 0.08 },
      );
      observers.push(reveal);
      site.querySelectorAll(selector).forEach((node) => reveal.observe(node));
      const focus = (event) =>
        animations.forEach((animation) => {
          if (animation.effect?.target?.contains(event.target))
            animation.cancel();
        });
      site.addEventListener("focusin", focus);
      cleanup.push(() => site.removeEventListener("focusin", focus));
    }
    const mode = document.body.dataset.parallax;
    if (mode !== "off") {
      const moving = new Map();
      const visible = new Set();
      const images = site.querySelectorAll(
        ".fx-hero-gallery > a > img, .fx-about-visual > img, .fx-project > div > img, .fx-blog-image > img, .fx-cover > img",
      );
      const update = () => {
        frame = 0;
        const height = innerHeight;
        const strength =
          (mode === "standard" ? 36 : 20) * (innerWidth <= 700 ? 0.45 : 1);
        visible.forEach((image) => {
          const rect = image.parentElement.getBoundingClientRect();
          const progress = Math.max(
            0,
            Math.min(1, (height - rect.top) / (height + rect.height)),
          );
          let animation = moving.get(image);
          if (!animation) {
            animation = image.animate(
              [
                { transform: `translateY(${-strength}px) scale(1.18)` },
                { transform: `translateY(${strength}px) scale(1.18)` },
              ],
              { duration: 1000, fill: "both" },
            );
            animation.pause();
            moving.set(image, animation);
            animations.add(animation);
          }
          animation.currentTime = progress * 1000;
        });
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      const observe = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          });
          schedule();
        },
        { rootMargin: "80px" },
      );
      observers.push(observe);
      images.forEach((image) => observe.observe(image));
      document.addEventListener("scroll", schedule, {
        passive: true,
        capture: true,
      });
      const resize = () => {
        moving.forEach((animation) => {
          animation.cancel();
          animations.delete(animation);
        });
        moving.clear();
        schedule();
      };
      window.addEventListener("resize", resize, { passive: true });
      cleanup.push(() =>
        document.removeEventListener("scroll", schedule, true),
      );
      cleanup.push(() => window.removeEventListener("resize", resize));
    }
  }
  reduced.addEventListener("change", start);
  window.addEventListener("pagehide", () => dispose());
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) start();
  });
  start();
})();
