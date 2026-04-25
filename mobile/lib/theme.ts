import * as SecureStore from "expo-secure-store";

export type AppTheme = "light" | "dark";

export const APP_THEME_STORAGE_KEY = "app_theme_preference";

export async function getStoredTheme(): Promise<AppTheme | null> {
  try {
    const value = await SecureStore.getItemAsync(APP_THEME_STORAGE_KEY);
    if (value === "light" || value === "dark") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setStoredTheme(theme: AppTheme): Promise<void> {
  try {
    await SecureStore.setItemAsync(APP_THEME_STORAGE_KEY, theme);
  } catch {
    // no-op: theme persistence should not block app usage
  }
}
