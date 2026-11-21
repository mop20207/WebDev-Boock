document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("mobileMenu");
  const backdrop = document.getElementById("sidebarBackdrop");
  menu?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  backdrop?.addEventListener("click", () => document.body.classList.remove("menu-open"));

  const page = document.body.dataset.page || "";
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href") || "";
    if ((page === "home" && href.endsWith("index.html")) || href.endsWith("/" + page + ".html")) {
      link.classList.add("active");
    }
  });

  // Mantener las tres herramientas visibles y marcar la sección actual en todas las páginas.
  const params = new URLSearchParams(window.location.search);
  const toolId = params.get("tool");
  if (toolId) {
    document.querySelectorAll("[data-tool-link]").forEach(link => {
      const isCurrent = link.dataset.toolLink === toolId;
      link.classList.toggle("active", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  // Cerrar el menú después de navegar desde un dispositivo táctil.
  document.querySelectorAll(".sidebar .nav-link").forEach(link => {
    link.addEventListener("click", () => document.body.classList.remove("menu-open"));
  });
});