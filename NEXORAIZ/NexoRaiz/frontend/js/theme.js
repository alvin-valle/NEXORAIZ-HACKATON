/* ==========================================================
   NEXORAIZ — Tema claro / oscuro + utilidades de UI
   ========================================================== */

const NexoTema = (() => {
  const CLAVE = "nexoraiz_tema";

  function aplicar(tema) {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem(CLAVE, tema);
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = tema === "oscuro" ? "☀️" : "🌙";
    });
    document.querySelectorAll("[data-theme-label]").forEach((el) => {
      el.textContent = tema === "oscuro" ? "Modo claro" : "Modo oscuro";
    });
  }

  function inicial() {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return guardado;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  }

  function alternar() {
    const actual = document.documentElement.getAttribute("data-theme") || "claro";
    aplicar(actual === "oscuro" ? "claro" : "oscuro");
  }

  function init() {
    aplicar(inicial());
    document.querySelectorAll("[data-toggle-theme]").forEach((btn) => {
      btn.addEventListener("click", alternar);
    });
  }

  return { init, aplicar, alternar };
})();

document.addEventListener("DOMContentLoaded", NexoTema.init);

/* ---------- Toast de notificaciones ---------- */
function mostrarToast(mensaje, tipo = "info") {
  let toast = document.getElementById("nexo-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "nexo-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.className = "toast visible" + (tipo === "error" ? " error" : "");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("visible"), 3200);
}
