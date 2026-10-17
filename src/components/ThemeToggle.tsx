import { useApp } from "../app/store";
import { ThemeMode } from "../domain/types";
import { AutoIcon, MoonIcon, SunIcon } from "./icons";

const ORDER: ThemeMode[] = ["system", "light", "dark"];

export function ThemeToggle() {
  const { data, setTheme } = useApp();
  const theme = data.settings.theme;
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = theme === "system" ? AutoIcon : theme === "light" ? SunIcon : MoonIcon;
  const label = `Theme: ${theme}`;
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={`${label} — switch to ${next}`}
      onClick={() => setTheme(next)}
    >
      <Icon />
    </button>
  );
}
