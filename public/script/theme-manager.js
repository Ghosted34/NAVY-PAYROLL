/**
 * THEME MANAGER
 * Handles light/dark theme switching with localStorage persistence
 * Usage: themeManager.toggle() or themeManager.set('light' | 'dark' | 'auto')
 */

const themeManager = {
  STORAGE_KEY: "navy-payroll-theme",
  MEDIA_QUERY: "(prefers-color-scheme: dark)",

  /**
   * Initialize theme from localStorage or system preference
   */
  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersLight = savedTheme === "light";
    const prefersDark = savedTheme === "dark";
    const prefersAuto = !savedTheme || savedTheme === "auto";

    if (prefersLight) {
      this.set("light");
    } else if (prefersDark) {
      this.set("dark");
    } else {
      this.setAuto();
    }

    // Listen for system theme changes
    this.watchSystemTheme();
  },

  /**
   * Set theme to light or dark
   */
  set(theme) {
    if (theme !== "light" && theme !== "dark") {
      console.warn(`Invalid theme: ${theme}. Using 'light'.`);
      theme = "light";
    }

    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    localStorage.setItem(this.STORAGE_KEY, theme);

    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));

    console.log(`Theme set to: ${theme}`);
  },

  /**
   * Set theme based on system preference
   */
  setAuto() {
    const prefersDark = window.matchMedia(this.MEDIA_QUERY).matches;
    const theme = prefersDark ? "dark" : "light";

    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    localStorage.setItem(this.STORAGE_KEY, "auto");

    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  },

  /**
   * Toggle between light and dark
   */
  toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    this.set(next);
  },

  /**
   * Get current theme
   */
  get() {
    return document.documentElement.getAttribute("data-theme") || "light";
  },

  /**
   * Watch system theme changes
   */
  watchSystemTheme() {
    const mediaQuery = window.matchMedia(this.MEDIA_QUERY);
    mediaQuery.addEventListener("change", (e) => {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === "auto" || !saved) {
        this.setAuto();
      }
    });
  },
};

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => themeManager.init());
} else {
  themeManager.init();
}
