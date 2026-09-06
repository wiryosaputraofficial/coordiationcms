import { initializeComponents } from "./components.js";
initializeComponents();
const form = document.querySelector("#auth-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button"),
    error = document.querySelector("#auth-error");
  button.disabled = true;
  error.hidden = true;
  const data = Object.fromEntries(new FormData(form));
  data.demo = form.elements.demo?.checked || false;
  try {
    const res = await fetch(
      "/api/auth/" + (form.dataset.setup === "true" ? "setup" : "login"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    location.href = "/admin";
  } catch (e) {
    error.textContent = e.message;
    error.hidden = false;
    button.disabled = false;
  }
});
