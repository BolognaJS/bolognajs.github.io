const btn = document.querySelector(".btn-toggle-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)") ? "dark" : "light";

let currentTheme = localStorage.getItem("theme") || preferredTheme;

function setTheme(theme) {
  localStorage.setItem("theme", theme);
  document.body.classList.toggle("light-theme", theme === "light");
  document.body.classList.toggle("dark-theme", theme === "dark");
  currentTheme = theme;
}
setTheme(currentTheme);

btn.addEventListener("click", function () {
  setTheme(currentTheme === "light" ? "dark" : "light");
});
