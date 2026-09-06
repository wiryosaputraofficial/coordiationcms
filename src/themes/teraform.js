import { icon } from "../shared/icons.js";
const f = (key, label, type = "text", value = "") => ({
  key,
  label,
  type,
  default: value,
});
const text = (key, label, value) => f(key, label, "text", value);
const area = (key, label, value) => f(key, label, "textarea", value);
const url = (key, label, value) => f(key, label, "url", value);
const img = (key, label, value = "") => f(key, label, "image", value);
const headingFields = (label, title, description) => [
  text("eyebrow", "Section label", label),
  text("title", "Heading", title),
  area("description", "Introduction", description),
];
const intro =
  '<div class="fx-section-intro"><div><p class="fx-eyebrow">{{eyebrow}}</p><h2>{{title}}</h2></div><p>{{description}}</p></div>';
const arrow = icon("external");
const action = (label, href, secondary = false) =>
  `<a class="button fx-button ${secondary ? "fx-outline" : ""}" href="{{${href}}}">{{${label}}} ${arrow}</a>`;
const sections = [
  {
    id: "header",
    label: "Header & navigation",
    fields: [
      text("brand", "Brand name", "Teraform"),
      img("logo", "Logo image", "/coordiation-logo.png"),
      text("button", "Button label", "Start a conversation"),
      url("buttonUrl", "Button link", "#contact"),
    ],
    itemFields: [text("label", "Link label", ""), url("url", "Link URL", "")],
    items: [
      { label: "Home", url: "#header" },
      { label: "Services", url: "#services" },
      { label: "Work", url: "#work" },
      { label: "Plans", url: "#pricing" },
      { label: "FAQ", url: "#faqs" },
    ],
    template: `<header class="fx-header" id="header"><a class="fx-brand" href="/">{{#if logo}}<img src="{{logo}}" alt="{{brand}}">{{/if}}<span>{{brand}}</span></a><nav aria-label="Primary navigation">{{#each items}}<a href="{{url}}">{{label}}</a>{{/each}}</nav>${action("button", "buttonUrl")}</header>`,
  },
  {
    id: "hero",
    label: "Hero & image gallery",
    fields: [
      text("availability", "Availability badge", "Open for new collaborations"),
      text("title", "Main heading", "Your next chapter."),
      text("highlight", "Highlighted heading", "Designed with intention."),
      area(
        "description",
        "Description",
        "An independent creative partner for teams with big ideas. Brand, digital, and product design in one flexible subscription.",
      ),
      text("primary", "Primary button label", "Meet your design partner"),
      url("primaryUrl", "Primary button link", "#contact"),
      text("secondary", "Secondary button label", "Explore the plans"),
      url("secondaryUrl", "Secondary button link", "#pricing"),
      text("trust", "Trust statement", "Made for ambitious teams"),
      text("trustNote", "Trust caption", "Small team. Big creative energy."),
      text("initials", "Avatar initials", "D / B / G"),
    ],
    itemFields: [
      img("image", "Image URL"),
      text("alt", "Image description"),
      text("label", "Image caption"),
      url("url", "Image link", "#work"),
    ],
    items: [
      {
        image: "/theme-assets/teraform/ember.svg",
        alt: "Original sculptural study in burnt orange",
        label: "Brand exploration",
        url: "#work",
      },
      {
        image: "/theme-assets/teraform/moss.svg",
        alt: "Original layered form in forest green",
        label: "Digital experiences",
        url: "#work",
      },
      {
        image: "/theme-assets/teraform/violet.svg",
        alt: "Original sculptural study in electric violet",
        label: "Product direction",
        url: "#work",
      },
    ],
    template: `<section class="fx-hero"><div class="fx-hero-copy"><span class="fx-availability"><i></i>{{availability}}</span><h1>{{title}} <span>{{highlight}}</span></h1><p>{{description}}</p><div class="fx-actions">${action("primary", "primaryUrl")}${action("secondary", "secondaryUrl", true)}</div><div class="fx-trust"><span class="fx-initials">{{initials}}</span><div><strong>{{trust}}</strong><p>{{trustNote}}</p></div></div></div><div class="fx-hero-gallery">{{#each items}}<a href="{{url}}"><img src="{{image}}" alt="{{alt}}"><span>{{label}} ${arrow}</span></a>{{/each}}</div></section>`,
  },
  {
    id: "about",
    label: "About & studio highlights",
    fields: [
      ...headingFields(
        "/ 001 / THE STUDIO",
        "One partner. More possibilities.",
        "Bring your ideas to a focused design team, with a clear process and space to do our best work.",
      ),
      text("cardLabel", "Studio card label", "A smaller, sharper studio"),
      text(
        "cardTitle",
        "Studio card heading",
        "Thoughtful design. Everyday momentum.",
      ),
      img("image", "Studio image", "/theme-assets/teraform/graphite.svg"),
      text(
        "imageAlt",
        "Studio image description",
        "Layered graphite sculpture",
      ),
      text("metricOne", "First metric value", "01"),
      text(
        "metricOneLabel",
        "First metric label",
        "Dedicated creative partner",
      ),
      text("metricTwo", "Second metric value", "∞"),
      text("metricTwoLabel", "Second metric label", "Ideas worth exploring"),
      text(
        "coverageTitle",
        "Coverage heading",
        "From your first idea to the next launch",
      ),
      area(
        "coverage",
        "Capabilities, one per line",
        "Brand direction\nVisual identity\nWeb design\nProduct interfaces\nCreative systems",
      ),
      text("availability", "Availability value", "Let’s talk"),
      text(
        "availabilityLabel",
        "Availability description",
        "Make room for your next project",
      ),
      text("turnaround", "Turnaround value", "2–3 days"),
      text(
        "turnaroundLabel",
        "Turnaround description",
        "Typical first concept, depending on scope",
      ),
    ],
    template: `<section class="fx-section" id="about">${intro}<div class="fx-about-grid"><article class="fx-about-visual"><img src="{{image}}" alt="{{imageAlt}}"><div><p>{{cardLabel}}</p><h3>{{cardTitle}}</h3><div class="fx-metrics"><span><strong>{{metricOne}}</strong>{{metricOneLabel}}</span><span><strong>{{metricTwo}}</strong>{{metricTwoLabel}}</span></div></div></article><article class="fx-card fx-coverage"><h3>{{coverageTitle}}</h3><div class="fx-orbit" aria-hidden="true">${icon("spark")}</div><p class="fx-lines">{{coverage}}</p></article><div class="fx-stack"><article class="fx-card"><span class="fx-eyebrow">{{availabilityLabel}}</span><h3 class="fx-number">{{availability}}</h3><div class="fx-dots" aria-hidden="true"></div></article><article class="fx-card"><strong class="fx-number">{{turnaround}}</strong><p>{{turnaroundLabel}}</p><div class="fx-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div></article></div></div></section>`,
  },
  {
    id: "services",
    label: "Services",
    fields: headingFields(
      "/ 002 / CAPABILITIES",
      "What can we make together?",
      "A connected set of creative skills, shaped around what your business needs next.",
    ),
    itemFields: [
      text("title", "Service name"),
      area("description", "Description"),
      area("tags", "Capabilities, one per line"),
      img("image", "Service image"),
      text("alt", "Image description"),
    ],
    items: [
      {
        title: "A brand with a point of view",
        description:
          "Define the story, identity, and visual language that make your business recognizable.",
        tags: "Positioning\nIdentity systems\nArt direction\nBrand guidelines",
        image: "/theme-assets/teraform/ember.svg",
        alt: "Warm orange brand concept",
      },
      {
        title: "Websites that feel like you",
        description:
          "Considered experiences that connect your story with the people you want to reach.",
        tags: "Marketing websites\nLanding pages\nResponsive systems",
        image: "/theme-assets/teraform/moss.svg",
        alt: "Forest green web concept",
      },
      {
        title: "Products people enjoy using",
        description:
          "Make complex ideas feel clear through purposeful interfaces and coherent design systems.",
        tags: "Product strategy\nInterface design\nDesign systems",
        image: "/theme-assets/teraform/violet.svg",
        alt: "Violet product concept",
      },
      {
        title: "Creative systems that keep moving",
        description:
          "Build a consistent visual toolkit for campaigns, launches, and everyday communication.",
        tags: "Campaigns\nSocial assets\nPresentations",
        image: "/theme-assets/teraform/graphite.svg",
        alt: "Graphite creative system",
      },
    ],
    template: `<section class="fx-section" id="services">${intro}<div class="fx-services">{{#each items}}<details class="fx-service"><summary><span>{{title}}</span>${icon("plus")}</summary><div class="fx-service-body"><div><p>{{description}}</p><p class="fx-lines">{{tags}}</p></div>{{#if image}}<img src="{{image}}" alt="{{alt}}">{{/if}}</div></details>{{/each}}</div></section>`,
  },
  {
    id: "process",
    label: "Process",
    fields: [
      ...headingFields(
        "/ 003 / HOW WE COLLABORATE",
        "Less friction. More making.",
        "A simple rhythm that keeps the work moving, from the first brief to the final delivery.",
      ),
      text("button", "Button label", "Find your plan"),
      url("buttonUrl", "Button link", "#pricing"),
    ],
    itemFields: [
      text("number", "Step number"),
      text("title", "Step title"),
      area("description", "Step description"),
    ],
    items: [
      {
        number: "01",
        title: "Choose your rhythm",
        description:
          "Find the plan that fits your team and tell us what you want to build.",
      },
      {
        number: "02",
        title: "Share the next challenge",
        description:
          "Bring a clear brief or an early idea. We help shape the right direction.",
      },
      {
        number: "03",
        title: "Make progress together",
        description:
          "Review, refine, and launch. Your source files stay with you.",
      },
    ],
    template: `<section class="fx-section" id="process"><div class="fx-process"><div><p class="fx-eyebrow">{{eyebrow}}</p><h2>{{title}}</h2><p>{{description}}</p>${action("button", "buttonUrl")}</div><div>{{#each items}}<article class="fx-step"><span>/{{number}}</span><div><h3>{{title}}</h3><p>{{description}}</p></div></article>{{/each}}</div></div></section>`,
  },
  {
    id: "work",
    label: "Portfolio projects",
    fields: headingFields(
      "/ 004 / SELECTED PROJECTS",
      "A few things we’ve imagined.",
      "Replace these concept studies with your own projects, images, and case-study links.",
    ),
    itemFields: [
      text("title", "Project title"),
      text("category", "Category / year"),
      img("image", "Project image"),
      text("alt", "Image description"),
      url("url", "Project link", "#contact"),
    ],
    items: [
      {
        title: "Ember",
        category: "Brand concept / 2026",
        image: "/theme-assets/teraform/ember.svg",
        alt: "Orange sculptural brand study",
        url: "#contact",
      },
      {
        title: "Verdant",
        category: "Digital concept / 2026",
        image: "/theme-assets/teraform/moss.svg",
        alt: "Green layered digital study",
        url: "#contact",
      },
      {
        title: "Frequency",
        category: "Product concept / 2026",
        image: "/theme-assets/teraform/violet.svg",
        alt: "Violet product study",
        url: "#contact",
      },
      {
        title: "Edition",
        category: "Identity concept / 2026",
        image: "/theme-assets/teraform/graphite.svg",
        alt: "Graphite identity study",
        url: "#contact",
      },
    ],
    template: `<section class="fx-section" id="work">${intro}<div class="fx-work-grid">{{#each items}}<a class="fx-project" href="{{url}}"><div><img src="{{image}}" alt="{{alt}}" loading="lazy"><span>${arrow}</span></div><h3>{{title}}</h3><p class="fx-eyebrow">{{category}}</p></a>{{/each}}</div></section>`,
  },
  {
    id: "benefits",
    label: "Benefits",
    fields: headingFields(
      "/ 005 / WHY THIS WORKS",
      "A better creative rhythm.",
      "More clarity in the process, more care in the details, and more room for your team to focus.",
    ),
    itemFields: [
      text("number", "Number"),
      text("title", "Benefit title"),
      area("description", "Description"),
    ],
    items: [
      {
        number: "01",
        title: "Clear commitments",
        description: "Know what is included and what the next step looks like.",
      },
      {
        number: "02",
        title: "Consistent momentum",
        description:
          "Keep your priorities moving with a dedicated creative partner.",
      },
      {
        number: "03",
        title: "A flexible queue",
        description: "Organize ideas and choose what we focus on next.",
      },
      {
        number: "04",
        title: "A shared workspace",
        description: "Keep briefs, feedback, and final files together.",
      },
      {
        number: "05",
        title: "Care in every detail",
        description:
          "Thoughtful work that respects your brand and your audience.",
      },
      {
        number: "06",
        title: "Built for your team",
        description: "A collaborative process that fits how you like to work.",
      },
    ],
    template: `<section class="fx-section" id="benefits">${intro}<div class="fx-benefits">{{#each items}}<article><span class="fx-eyebrow">/{{number}}</span><h3>{{title}}</h3><p>{{description}}</p></article>{{/each}}</div></section>`,
  },
  {
    id: "reviews",
    label: "Testimonials",
    fields: headingFields(
      "/ 006 / CLIENT PERSPECTIVES",
      "Your clients, in their words.",
      "Use this space for genuine feedback from the people you have worked with.",
    ),
    itemFields: [
      text("rating", "Rating label"),
      area("quote", "Client quote"),
      text("name", "Client name"),
      text("role", "Role / company"),
      img("image", "Portrait image"),
      text("alt", "Portrait description"),
      url("url", "Profile link", "#contact"),
    ],
    items: [
      {
        rating: "Client feedback",
        quote:
          "Add a real testimonial that describes the experience of working with your studio.",
        name: "Client name",
        role: "Role · Company",
        image: "",
        alt: "",
        url: "#contact",
      },
      {
        rating: "Client feedback",
        quote:
          "Share a specific result, a memorable moment, or a thoughtful note from a client.",
        name: "Client name",
        role: "Role · Company",
        image: "",
        alt: "",
        url: "#contact",
      },
      {
        rating: "Client feedback",
        quote: "Tell the story through the people who know your work best.",
        name: "Client name",
        role: "Role · Company",
        image: "",
        alt: "",
        url: "#contact",
      },
    ],
    template: `<section class="fx-section" id="reviews">${intro}<div class="fx-reviews">{{#each items}}<article class="fx-card"><p class="fx-eyebrow">${icon("spark")} {{rating}}</p><blockquote>{{quote}}</blockquote><div class="fx-review-person">{{#if image}}<img src="{{image}}" alt="{{alt}}">{{else}}${icon("person")}{{/if}}<div><strong>{{name}}</strong><p>{{role}}</p></div><a href="{{url}}" aria-label="Client profile">${arrow}</a></div></article>{{/each}}</div></section>`,
  },
  {
    id: "stats",
    label: "Results & statistics",
    fields: [],
    itemFields: [text("value", "Statistic"), text("label", "Description")],
    items: [
      { value: "—", label: "Projects completed" },
      { value: "—", label: "Client satisfaction" },
      { value: "—", label: "Long-term partners" },
      { value: "—", label: "Years of experience" },
    ],
    template:
      '<section class="fx-section fx-statistics">{{#each items}}<div><strong>{{value}}</strong><span>{{label}}</span></div>{{/each}}</section>',
  },
  {
    id: "pricing",
    label: "Pricing plans",
    fields: [
      ...headingFields(
        "/ 007 / MEMBERSHIP",
        "Choose your creative pace.",
        "Example plans for your studio. Set your own pricing, benefits, and booking links.",
      ),
      text(
        "note",
        "Pricing footer note",
        "Clear scope · Flexible collaboration · Source files included",
      ),
    ],
    itemFields: [
      text("name", "Plan name"),
      text("badge", "Badge (optional)"),
      area("description", "Description"),
      text("price", "Price"),
      text("period", "Billing period"),
      area("features", "Included features, one per line"),
      text("button", "Button label"),
      url("url", "Button link", "#contact"),
    ],
    items: [
      {
        name: "Essential",
        badge: "",
        description: "A focused creative partner for your next stage.",
        price: "$2,400",
        period: "/ month",
        features:
          "One active project\nA shared request queue\nBrand and digital design\nFeedback and refinements\nEditable source files",
        button: "Discuss Essential",
        url: "#contact",
      },
      {
        name: "Studio",
        badge: "For growing teams",
        description: "More creative capacity for a busier roadmap.",
        price: "$3,900",
        period: "/ month",
        features:
          "Two active projects\nEverything in Essential\nPriority project planning\nProduct and campaign design\nRegular creative check-ins",
        button: "Discuss Studio",
        url: "#contact",
      },
    ],
    template: `<section class="fx-section" id="pricing">${intro}<div class="fx-pricing">{{#each items}}<article class="fx-card">{{#if badge}}<span class="fx-plan-badge">{{badge}}</span>{{/if}}<h3>{{name}}</h3><p>{{description}}</p><div class="fx-price">{{price}}<small>{{period}}</small></div><p class="fx-lines fx-features">{{features}}</p><a class="button fx-button" href="{{url}}">{{button}} ${arrow}</a></article>{{/each}}</div><p class="fx-pricing-note">{{note}}</p></section>`,
  },
  {
    id: "faqs",
    label: "Frequently asked questions",
    fields: [
      ...headingFields(
        "/ 008 / GOOD TO KNOW",
        "Before we begin.",
        "A few useful details about how we work together.",
      ),
      text("button", "Button label", "Ask us anything"),
      url("buttonUrl", "Button link", "#contact"),
    ],
    itemFields: [text("question", "Question"), area("answer", "Answer")],
    items: [
      {
        question: "How do we get started?",
        answer:
          "Send a short introduction using the form below. We will discuss the work you have in mind and agree on a plan.",
      },
      {
        question: "What can I add to the project queue?",
        answer:
          "Add the brand, digital, or product requests covered by your chosen plan. We agree on priorities together.",
      },
      {
        question: "How is delivery scheduled?",
        answer:
          "Timing depends on the brief. We share a clear delivery estimate before work begins.",
      },
      {
        question: "Can the plan change as my team grows?",
        answer:
          "Yes. Talk with us about your upcoming priorities and we can adjust the collaboration.",
      },
      {
        question: "What happens to the final files?",
        answer:
          "You receive the agreed source files and deliverables at the end of each project.",
      },
    ],
    template: `<section class="fx-section" id="faqs"><div class="fx-faq-grid"><div><p class="fx-eyebrow">{{eyebrow}}</p><h2>{{title}}</h2><p>{{description}}</p>${action("button", "buttonUrl", true)}</div><div>{{#each items}}<details class="fx-faq"><summary>{{question}}${icon("plus")}</summary><p>{{answer}}</p></details>{{/each}}</div></div></section>`,
  },
  {
    id: "contact",
    label: "Contact form & details",
    fields: [
      ...headingFields(
        "/ 009 / LET’S TALK",
        "What are you working on?",
        "Tell us about the idea, the challenge, or the next thing you want to launch.",
      ),
      text(
        "promiseTitle",
        "Contact highlight title",
        "A thoughtful conversation",
      ),
      area(
        "promise",
        "Contact highlight text",
        "We will review your message and follow up to explore the right next step.",
      ),
      text("nameLabel", "Name field label", "Your name"),
      text("emailLabel", "Email field label", "Email address"),
      text("serviceLabel", "Service field label", "What do you need?"),
      area(
        "services",
        "Service choices, one per line",
        "Brand identity\nWebsite design\nProduct design\nCreative partnership",
      ),
      text("budgetLabel", "Budget field label", "Your project budget"),
      area(
        "budgets",
        "Budget choices, one per line",
        "Still exploring\nUnder $3,000\n$3,000–$5,000\n$5,000+",
      ),
      text("messageLabel", "Message field label", "Tell us a little more"),
      text("button", "Submit button label", "Send your brief"),
      text(
        "success",
        "Success message",
        "Thanks for reaching out. Your message has been received.",
      ),
      text(
        "privacy",
        "Form note",
        "Your details are used to respond to your inquiry.",
      ),
    ],
    itemFields: [
      text("label", "Contact detail label"),
      text("value", "Contact detail value"),
      area("description", "Detail description"),
      url("url", "Contact detail link"),
    ],
    items: [
      {
        label: "Email",
        value: "hello@yourstudio.com",
        description: "For ideas and introductions",
        url: "mailto:hello@yourstudio.com",
      },
      {
        label: "Location",
        value: "Working worldwide",
        description: "A studio without borders",
        url: "#contact",
      },
      {
        label: "Book a conversation",
        value: "Find a time",
        description: "Make space for a new idea",
        url: "#contact",
      },
    ],
    template: `<section class="fx-section" id="contact"><div class="fx-contact-grid"><div><p class="fx-eyebrow">{{eyebrow}}</p><h2>{{title}}</h2><p>{{description}}</p><div class="fx-contact-promise">${icon("comments")}<h3>{{promiseTitle}}</h3><p>{{promise}}</p></div></div><div>{{#if submitted}}<p class="notice">{{success}}</p>{{/if}}{{#if preview}}<p class="fx-preview-note">Contact form preview. Submissions are available when this theme is active.</p>{{/if}}<form class="fx-contact-form" method="post" action="/api/inquiries"><input type="hidden" name="kind" value="contact"><label><span>${icon("person")} {{nameLabel}}</span><input name="name" required maxlength="100" autocomplete="name"></label><label><span>${icon("email")} {{emailLabel}}</span><input name="email" type="email" required maxlength="254" autocomplete="email"></label><fieldset><legend>{{serviceLabel}}</legend><div class="fx-choices">{{#each serviceOptions}}<label><input type="checkbox" name="service" value="{{value}}"><span>{{value}}</span></label>{{/each}}</div></fieldset><fieldset><legend>{{budgetLabel}}</legend><div class="fx-choices">{{#each budgetOptions}}<label><input type="radio" name="budget" value="{{value}}"><span>{{value}}</span></label>{{/each}}</div></fieldset><label><span>${icon("edit")} {{messageLabel}}</span><textarea name="message" required maxlength="4000"></textarea></label><button class="fx-button" type="submit" {{#if preview}}disabled{{/if}}>{{button}} ${arrow}</button><p class="fx-form-note">{{privacy}}</p></form></div></div><div class="fx-contact-details">{{#each items}}<a href="{{url}}"><p>{{label}}</p><strong>{{value}} ${arrow}</strong><small>{{description}}</small></a>{{/each}}</div></section>`,
  },
  {
    id: "footer",
    label: "Footer & newsletter",
    fields: [
      text("newsletterTitle", "Newsletter heading", "Notes from the studio"),
      area(
        "newsletterText",
        "Newsletter description",
        "Occasional ideas, new work, and things worth sharing.",
      ),
      text("emailLabel", "Email field label", "Your email address"),
      text("subscribe", "Subscribe button label", "Keep me posted"),
      text(
        "success",
        "Subscription success message",
        "Thanks. Your subscription request has been saved.",
      ),
      text("wordmark", "Large brand wordmark", "TERAFORM"),
      text("copyright", "Copyright line", "© 2026 Your Studio"),
      text("credit", "Footer credit", "Made with Coordiation CMS"),
      text("linkHeading", "Footer links heading", "Explore"),
    ],
    itemFields: [text("label", "Link label"), url("url", "Link URL")],
    items: [
      { label: "Services", url: "#services" },
      { label: "Projects", url: "#work" },
      { label: "Plans", url: "#pricing" },
      { label: "Contact", url: "#contact" },
      { label: "Email", url: "mailto:hello@yourstudio.com" },
    ],
    template: `<footer class="fx-footer" id="footer"><div class="fx-footer-top"><div><h3>{{newsletterTitle}}</h3><p>{{newsletterText}}</p>{{#if subscribed}}<p class="notice">{{success}}</p>{{/if}}<form method="post" action="/api/inquiries" class="fx-newsletter"><input type="hidden" name="kind" value="newsletter"><input name="email" aria-label="{{emailLabel}}" placeholder="{{emailLabel}}" type="email" required maxlength="254"><button type="submit" {{#if preview}}disabled{{/if}}>{{subscribe}} ${icon("arrow")}</button></form></div><nav aria-label="Footer navigation"><p class="fx-eyebrow">{{linkHeading}}</p>{{#each items}}<a href="{{url}}">{{label}} ${arrow}</a>{{/each}}</nav></div><div class="fx-wordmark">{{wordmark}}</div><div class="fx-footer-bottom"><span>{{copyright}}</span><span>{{credit}}</span></div></footer>`,
  },
];
export const teraformHomepage = { version: 1, sections };
export function makeTeraformTheme(css) {
  return {
    id: "teraform",
    name: "Teraform",
    version: "1.0.0",
    author: "Coordiation Studio",
    description:
      "A design-subscription studio theme with a fully editable homepage and original demo artwork.",
    license: "MIT",
    cmsVersion: "1",
    accent: "#f45d32",
    background: "#f1f1ef",
    foreground: "#151515",
    font: "sans",
    homepage: teraformHomepage,
    home: '<div class="fx-site">{{{homepageContent}}}</div>',
    single: `<div class="fx-site">{{{homepageHeader}}}<main class="single fx-single"><p class="fx-eyebrow">{{post.category}} · {{post.date}}</p><h1>{{post.title}}</h1><p class="lead">{{post.excerpt}}</p>{{#if post.image}}<img class="cover" src="{{post.image}}" alt="{{post.imageAlt}}">{{/if}}<div class="article-body">{{{content}}}</div>{{{comments}}}<a class="button fx-button" href="/">${icon("back")} Back to home</a></main>{{{homepageFooter}}}</div>`,
    css,
  };
}
