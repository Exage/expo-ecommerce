import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, saveTheme, THEMES } from "../lib/theme";

export const useAdminTheme = () => {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  };

  return {
    theme,
    isDark: theme === THEMES.DARK,
    toggleTheme,
  };
};
