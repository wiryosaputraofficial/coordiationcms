import { randomUUID } from "node:crypto";
import { services, settings } from "./database.js";
import { getHomepage } from "./homepage-store.js";
import { endpoint, sameOrigin, text, fail, rateLimit } from "./security.js";
export function inquiryPOST(request) {
  return endpoint(async () => {
    sameOrigin(request);
    const { db } = services(),
      site = settings(),
      form = await request.formData();
    const row = db
      .prepare("SELECT manifest FROM themes WHERE id=?")
      .get(site.activeTheme);
    const theme = JSON.parse(row.manifest),
      kind = String(form.get("kind") || "");
    if (!theme.homepage || !["contact", "newsletter"].includes(kind))
      fail(400, "This form is unavailable.");
    const { data } = getHomepage(theme),
      section = data.sections[kind === "contact" ? "contact" : "footer"];
    if (!section?.enabled) fail(403, "This form is currently closed.");
    const email = text(
      String(form.get("email") || ""),
      254,
      true,
    ).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Enter a valid email address.");
    const name =
      kind === "contact" ? text(String(form.get("name") || ""), 100, true) : "";
    const message =
      kind === "contact"
        ? text(String(form.get("message") || ""), 4000, true)
        : "";
    const service = form.getAll("service").map(String),
      budget = String(form.get("budget") || "");
    const allowed = (section.values.services || "")
      .split("\n")
      .map((s) => s.trim());
    const budgets = (section.values.budgets || "")
      .split("\n")
      .map((s) => s.trim());
    if (
      kind === "contact" &&
      (service.length > 16 ||
        service.some((v) => !allowed.includes(v)) ||
        (budget && !budgets.includes(budget)))
    )
      fail(400, "Choose one of the available options.");
    rateLimit("inquiry:global", 60);
    rateLimit("inquiry:" + email, 4);
    if (
      kind !== "newsletter" ||
      !db
        .prepare(
          "SELECT id FROM inquiries WHERE kind='newsletter' AND email=? AND theme_id=?",
        )
        .get(email, theme.id)
    )
      db.prepare("INSERT INTO inquiries VALUES (?,?,?,?,?,?,?,?,?)").run(
        randomUUID(),
        theme.id,
        kind,
        name,
        email,
        message,
        JSON.stringify(service),
        budget,
        new Date().toISOString(),
      );
    return new Response(null, {
      status: 303,
      headers: {
        Location:
          "/?inquiry=" +
          (kind === "contact" ? "received#contact" : "subscribed#footer"),
      },
    });
  });
}
