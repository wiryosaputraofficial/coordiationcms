import { randomUUID } from "node:crypto";
import { services } from "./database.js";
import { fail, text, editors } from "./security.js";
import { validateBlocks } from "./content.js";
export function validateLayout(value = "theme") {
  if (!["theme", "wide", "canvas"].includes(value))
    fail(400, "Invalid page layout.");
  return value;
}
export function listTemplates() {
  return services()
    .db.prepare(
      "SELECT * FROM content_templates ORDER BY updated_at DESC LIMIT 200",
    )
    .all()
    .map((r) => ({ ...r, blocks: JSON.parse(r.blocks) }));
}
function editable(id, user, version) {
  const row = services()
    .db.prepare("SELECT * FROM content_templates WHERE id=?")
    .get(id);
  if (!row) fail(404, "Template not found.");
  if (!editors.includes(user.role) && row.author_id !== user.id)
    fail(403, "You cannot change this template.");
  if (row.version !== version)
    fail(409, "Template changed. Reopen the library before trying again.");
  return row;
}
export function saveTemplate(b, user) {
  const { db } = services();
  if (b.id) editable(b.id, user, b.version);
  else if (
    db.prepare("SELECT count(*) AS n FROM content_templates").get().n >= 200
  )
    fail(400, "The template library is full (200 templates).");
  const name = text(b.name, 100, true),
    layout = validateLayout(b.layout),
    blocks = JSON.stringify(validateBlocks(b.blocks));
  if (blocks.length > 300000) fail(400, "Template is too large.");
  const id = b.id || randomUUID(),
    now = new Date().toISOString();
  if (b.id)
    db.prepare(
      "UPDATE content_templates SET name=?,layout=?,blocks=?,version=version+1,updated_at=? WHERE id=?",
    ).run(name, layout, blocks, now, id);
  else
    db.prepare("INSERT INTO content_templates VALUES (?,?,?,?,?,1,?)").run(
      id,
      name,
      layout,
      blocks,
      user.id,
      now,
    );
  return { id };
}
export function deleteTemplate(b, user) {
  editable(b.id, user, b.version);
  services().db.prepare("DELETE FROM content_templates WHERE id=?").run(b.id);
  return { ok: true };
}
