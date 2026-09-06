import { card, field } from "./ui.js";
import { icon } from "./icons.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function renderAISettings({ api, toast }) {
  const config = await api("ai-settings");
  document.querySelector("#workspace").innerHTML =
    `<div class="page-heading"><div><h1>AI writing</h1><p>Connect OpenAI for drafting and editing assistance.</p></div><a class="button" href="#settings">${icon("back")} Settings</a></div>${card("OpenAI connection", config.configured ? "An API key is saved." : "Connect your API account to enable writing assistance.", `<form id="ai-settings-form" class="ui-form">${field("ai-model", "Model ID", `<input id="ai-model" name="model" value="${esc(config.model)}" required maxlength="100">`)}${field("ai-key", "API key", `<input id="ai-key" name="apiKey" type="password" autocomplete="new-password" maxlength="500" placeholder="${config.configured ? "Leave blank to keep your saved key" : "Enter your OpenAI API key"}">`, "Stored encrypted on the server. The saved key is never returned to the browser.")}<label class="check-label"><input name="removeKey" type="checkbox">Remove the saved API key</label><p class="field-hint">Requests use your OpenAI API billing. Your brief and editor text are sent only when you choose Generate. Generated content is reviewed before applying and is never published automatically.</p><button class="button primary" type="submit">${icon("check")} Save connection</button></form>`, icon("spark"))}`;
  document.querySelector("#ai-settings-form").onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      button = form.querySelector("button");
    button.disabled = true;
    try {
      await api("ai-settings", "POST", {
        model: form.elements.model.value,
        apiKey: form.elements.apiKey.value,
        removeKey: form.elements.removeKey.checked,
      });
      form.elements.apiKey.value = "";
      toast("AI connection saved.");
      await renderAISettings({ api, toast });
    } catch (e) {
      toast(e.message, true);
    } finally {
      button.disabled = false;
    }
  };
}
export function writingBlocks(value) {
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", content: paragraph.join("\n") });
      paragraph = [];
    }
  };
  for (const line of value.split("\n")) {
    if (/^#{1,3}\s/.test(line)) {
      flush();
      blocks.push({
        type: "heading",
        level: line.startsWith("### ") ? 3 : 2,
        content: line.replace(/^#+\s/, ""),
      });
    } else if (!line.trim()) flush();
    else paragraph.push(line);
  }
  flush();
  return blocks;
}
export async function openWritingAssistant({
  api,
  toast,
  openModal,
  readEditor,
  apply,
  isAdmin,
}) {
  const config = await api("ai-status"),
    source = readEditor(),
    snapshot = JSON.stringify(source.blocks);
  const dialog = openModal(
    "AI writing",
    `<div class="ui-form">${!config.configured ? `<div class="inline-alert">Connect OpenAI to use writing assistance. ${isAdmin ? '<a href="#ai-settings" id="open-ai-settings">Open AI settings</a>' : "Ask an administrator to connect the provider."}</div>` : ""}${field("ai-task", "Task", '<select id="ai-task"><option value="outline">Create an outline</option><option value="draft">Write a draft</option><option value="improve">Improve the current body</option><option value="title">Suggest an SEO title</option><option value="description">Write a meta description</option></select>')}${field("ai-language", "Output language", '<input id="ai-language" value="English" maxlength="80">')}${field("ai-brief", "Brief or source notes", '<textarea id="ai-brief" rows="4" maxlength="4000" placeholder="Describe your audience, goal, and facts or sources to use."></textarea>')}<p class="field-hint">Generate sends your brief and current editor text to OpenAI. Review facts, sources, and wording before using the result.</p><button type="button" class="button primary" id="ai-generate" ${!config.configured ? "disabled" : ""}>${icon("spark")} Generate</button><p id="ai-progress" class="field-hint" role="status"></p><div id="ai-result" hidden>${field("ai-output", "Review and edit the result", '<textarea id="ai-output" rows="12" maxlength="30000"></textarea>')}<button type="button" class="button primary" id="ai-apply">Apply to editor</button></div></div>`,
  );
  dialog
    .querySelector("#open-ai-settings")
    ?.addEventListener("click", () => dialog.close());
  let resultTask = "";
  dialog.querySelector("#ai-generate").onclick = async () => {
    const button = dialog.querySelector("#ai-generate");
    button.disabled = true;
    dialog.querySelector("#ai-progress").textContent = "Writing a suggestion…";
    dialog.querySelector("#ai-result").hidden = true;
    try {
      const task = dialog.querySelector("#ai-task").value;
      const result = await api("ai-write", "POST", {
        task,
        title: source.title,
        source: (source.blocks || [])
          .filter((b) => b.type !== "image")
          .map((b) => b.content || "")
          .join("\n\n")
          .slice(0, 20000),
        brief: dialog.querySelector("#ai-brief").value,
        language: dialog.querySelector("#ai-language").value,
      });
      if (!dialog.open) return;
      resultTask = task;
      dialog.querySelector("#ai-output").value = result.text;
      dialog.querySelector("#ai-result").hidden = false;
      dialog.querySelector("#ai-apply").textContent =
        task === "title"
          ? "Apply SEO title"
          : task === "description"
            ? "Apply meta description"
            : task === "improve"
              ? "Replace body with reviewed result"
              : "Append reviewed blocks";
      dialog.querySelector("#ai-progress").textContent =
        "Ready for your review. Nothing has been saved or published.";
    } catch (e) {
      dialog.querySelector("#ai-progress").textContent = e.message;
    } finally {
      button.disabled = false;
    }
  };
  dialog.querySelector("#ai-apply").onclick = () => {
    const value = dialog.querySelector("#ai-output").value.trim();
    if (!value) return;
    if (
      resultTask === "improve" &&
      JSON.stringify(readEditor()?.blocks) !== snapshot
    ) {
      toast("The body changed. Reopen AI writing before replacing it.", true);
      return;
    }
    const max =
      resultTask === "title" ? 120 : resultTask === "description" ? 320 : 30000;
    if (value.length > max) {
      toast(`Shorten the result to ${max} characters before applying.`, true);
      return;
    }
    const blocks = writingBlocks(value);
    if (blocks.some((block) => block.content.length > 20000)) {
      toast(
        "Split long sections into smaller paragraphs before applying.",
        true,
      );
      return;
    }
    if (
      blocks.length +
        (resultTask === "improve" ? 0 : readEditor()?.blocks.length || 0) >
      200
    ) {
      toast("This would exceed 200 blocks. Shorten the result.", true);
      return;
    }
    apply(resultTask, value, blocks);
    dialog.close();
    toast("Applied to the editor. Review and save when ready.");
  };
}
