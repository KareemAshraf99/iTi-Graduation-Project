function initializeThemeToggle() {
  const themeToggle = document.querySelector(".theme-toggle");

  const currentTheme = localStorage.getItem("theme") || "light";

  applyTheme(currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const newTheme =
        document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeIcon(newTheme);
      document.body.dispatchEvent(new Event("themeChange"));
    });
  }
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
}

function updateThemeIcon(theme) {
  const themeToggleIcon = document.querySelector(".theme-toggle i");

  const themeToggleButton = document.querySelector(".theme-toggle");

  if (themeToggleIcon && themeToggleButton) {
    themeToggleIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";

    if (
      typeof translations !== "undefined" &&
      typeof currentLanguage !== "undefined" &&
      currentLanguage === "en" &&
      translations.en
    ) {
      themeToggleButton.title =
        theme === "dark"
          ? translations.en.acc_light_mode
          : translations.en.acc_dark_mode;
    } else {
      themeToggleButton.title = theme === "dark" ? "وضع فاتح" : "وضع داكن";
    }
  }
}

document.addEventListener("DOMContentLoaded", initializeThemeToggle);
