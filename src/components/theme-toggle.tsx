import type { ComponentProps } from "react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  applyThemeToDocument,
  readStoredTheme,
  writeStoredTheme,
  type UiTheme,
} from "lib/theme-storage";
import { mergeTailwindClasses } from "lib/utils";

export function ThemeToggle({ className, ...props }: ComponentProps<"button">) {
  const [theme, setTheme] = useState<UiTheme>(readStoredTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    writeStoredTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      className={mergeTailwindClasses(
        "table-elevated-surface inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md",
        "text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      {...props}
    >
      {theme === "dark" ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
}
