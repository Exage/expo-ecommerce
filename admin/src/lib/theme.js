export const ADMIN_THEME_STORAGE_KEY = "admin_theme";

export const THEMES = {
  LIGHT: "light",
  DARK: "forest",
};

export const isValidTheme = (value) => value === THEMES.LIGHT || value === THEMES.DARK;

export const getStoredTheme = () => {
  if (typeof window === "undefined") return THEMES.LIGHT;

  const storedTheme = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return isValidTheme(storedTheme) ? storedTheme : THEMES.LIGHT;
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
};

export const saveTheme = (theme) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
};
