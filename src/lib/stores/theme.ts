import { persistentAtom } from "@nanostores/persistent";

export const THEME_MAP = {
  light: "light",
  dark: "dark",
  system: undefined,
} as const;

export type ThemeValue = (typeof THEME_MAP)[keyof typeof THEME_MAP];

export const $theme = persistentAtom<ThemeValue>("theme", THEME_MAP.system, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

function applyTheme(theme: ThemeValue): void {
  const isDark =
    theme === "dark" ||
    (theme === undefined && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
}

export function initThemeStore(): void {
  if (typeof window === "undefined") return;

  applyTheme($theme.get());
  $theme.listen(applyTheme);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ($theme.get() === undefined) {
      applyTheme($theme.get());
    }
  });
}
