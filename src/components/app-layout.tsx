import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { GithubIcon } from "components/icons/github-icon";
import { ThemeToggle } from "components/theme-toggle";
import { mergeTailwindClasses } from "lib/utils";

const segmentBase =
  "flex flex-1 items-center justify-center px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col text-foreground">
      <header className="shrink-0 border-b border-border bg-card/80 px-3 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[min(118rem,calc(100vw-1rem))] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-lg font-semibold tracking-tight sm:text-xl">Movie Charts</span>
            <nav
              className={mergeTailwindClasses(
                "table-elevated-surface flex h-10 shrink-0 divide-x divide-border overflow-hidden rounded-md",
              )}
              aria-label="Main pages"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  mergeTailwindClasses(
                    segmentBase,
                    isActive
                      ? "bg-muted-foreground/28 text-foreground dark:bg-muted-foreground/36"
                      : "text-muted-foreground hover:bg-muted/45 hover:text-foreground",
                  )
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  mergeTailwindClasses(
                    segmentBase,
                    isActive
                      ? "bg-muted-foreground/28 text-foreground dark:bg-muted-foreground/36"
                      : "text-muted-foreground hover:bg-muted/45 hover:text-foreground",
                  )
                }
              >
                Profile
              </NavLink>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com/Braqzen/movie-charts"
              target="_blank"
              rel="noreferrer noopener"
              className={mergeTailwindClasses(
                "table-elevated-surface inline-flex size-10 shrink-0 items-center justify-center rounded-md",
                "text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Movie Charts on GitHub"
              title="View source repository on GitHub"
            >
              <GithubIcon className="size-5" aria-hidden />
            </a>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
