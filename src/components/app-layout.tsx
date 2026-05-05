import type { ReactNode } from "react";
import { BarChart3, Clapperboard, Library } from "lucide-react";
import { NavLink } from "react-router-dom";
import { GithubIcon } from "components/icons/github-icon";
import { ThemeToggle } from "components/theme-toggle";
import { USER_BUNDLES } from "lib/app-data";
import { mergeTailwindClasses } from "lib/utils";

const navTextLink = (isActive: boolean) =>
  mergeTailwindClasses(
    "table-elevated-surface inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3",
    "font-sans text-sm font-medium text-foreground hover:bg-muted",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive ? "bg-muted-foreground/28 dark:bg-muted-foreground/36" : "",
  );

const headerIconButton =
  "table-elevated-surface inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md font-sans text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type AppLayoutProps = {
  children: ReactNode;
  activeSlug: string;
  onActiveSlugChange: (slug: string) => void;
};

export function AppLayout({ children, activeSlug, onActiveSlugChange }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col text-foreground">
      <header className="shrink-0 border-b border-border bg-card/80 px-3 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto grid w-full max-w-[min(118rem,calc(100vw-1rem))] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3">
          <div className="flex min-w-0 justify-self-start">
            <NavLink
              to="/top-movies"
              className={mergeTailwindClasses(
                "min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl",
                "text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
              )}
            >
              Movie Charts
            </NavLink>
          </div>
          <nav
            className="flex shrink-0 flex-wrap items-center justify-center gap-2 justify-self-center"
            aria-label="Main pages"
          >
            <NavLink to="/top-movies" className={({ isActive }) => navTextLink(isActive)}>
              <Clapperboard className="size-4 shrink-0" aria-hidden />
              Top Movies
            </NavLink>
            <NavLink to="/genre-breakdown" className={({ isActive }) => navTextLink(isActive)}>
              <BarChart3 className="size-4 shrink-0" aria-hidden />
              Genre Breakdown
            </NavLink>
            <NavLink to="/catalogue" className={({ isActive }) => navTextLink(isActive)}>
              <Library className="size-4 shrink-0" aria-hidden />
              Catalogue
            </NavLink>
          </nav>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 justify-self-end">
            {USER_BUNDLES.length > 0 ? (
              <select
                className={mergeTailwindClasses(
                  "table-elevated-surface h-10 min-w-[8rem] cursor-pointer rounded-md px-3 font-sans text-sm font-medium text-foreground",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                value={activeSlug}
                onChange={(e) => {
                  onActiveSlugChange(e.target.value);
                }}
                aria-label="Active user"
              >
                {USER_BUNDLES.map((u) => (
                  <option key={u.slug} value={u.slug}>
                    {u.slug}
                  </option>
                ))}
              </select>
            ) : null}
            <ThemeToggle className={headerIconButton} />
            <a
              href="https://github.com/Braqzen/movie-charts"
              target="_blank"
              rel="noreferrer noopener"
              className={headerIconButton}
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
