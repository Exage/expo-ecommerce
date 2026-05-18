import { beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_THEME_STORAGE_KEY,
  THEMES,
  applyTheme,
  getStoredTheme,
  isValidTheme,
  saveTheme,
} from "../lib/theme";

describe("theme helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("validates known themes", () => {
    expect(isValidTheme(THEMES.LIGHT)).toBe(true);
    expect(isValidTheme(THEMES.DARK)).toBe(true);
    expect(isValidTheme("unknown")).toBe(false);
  });

  it("reads stored theme and falls back to light", () => {
    expect(getStoredTheme()).toBe(THEMES.LIGHT);

    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, THEMES.DARK);
    expect(getStoredTheme()).toBe(THEMES.DARK);

    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, "bad-value");
    expect(getStoredTheme()).toBe(THEMES.LIGHT);
  });

  it("applies theme to html element", () => {
    applyTheme(THEMES.DARK);

    expect(document.documentElement).toHaveAttribute("data-theme", THEMES.DARK);
  });

  it("saves theme in localStorage", () => {
    saveTheme(THEMES.DARK);

    expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe(THEMES.DARK);
  });
});
