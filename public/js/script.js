const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const menuButton = document.getElementById("menuButton");
const closeMenuButton = document.getElementById("closeMenu");

function setMenu(open) {
  if (!drawer || !backdrop || !menuButton) return;
  drawer.classList.toggle("open", open);
  backdrop.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  drawer.inert = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);

  if (open) closeMenuButton?.focus();
  else menuButton.focus();
}

menuButton?.addEventListener("click", () => setMenu(true));
closeMenuButton?.addEventListener("click", () => setMenu(false));
backdrop?.addEventListener("click", () => setMenu(false));
document.querySelectorAll("[data-close-menu]").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawer?.classList.contains("open")) setMenu(false);
});

const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
document.querySelectorAll(".desktop-nav a, .drawer nav a").forEach((link) => {
  const linkPath = new URL(link.href).pathname.replace(/\/$/, "") || "/";
  if (linkPath === currentPath) link.setAttribute("aria-current", "page");
});

const year = document.getElementById("currentYear");
if (year) year.textContent = String(new Date().getFullYear());
