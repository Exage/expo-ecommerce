import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAdminTheme } from "../hooks/useAdminTheme";
import { ADMIN_THEME_STORAGE_KEY, THEMES } from "../lib/theme";

describe("useAdminTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("loads stored theme and exposes dark mode state", () => {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, THEMES.DARK);

    const { result } = renderHook(() => useAdminTheme());

    expect(result.current.theme).toBe(THEMES.DARK);
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement).toHaveAttribute("data-theme", THEMES.DARK);
  });

  it("toggles theme and persists change", () => {
    const { result } = renderHook(() => useAdminTheme());

    expect(result.current.theme).toBe(THEMES.LIGHT);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe(THEMES.DARK);
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement).toHaveAttribute("data-theme", THEMES.DARK);
    expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe(THEMES.DARK);
  });
});
