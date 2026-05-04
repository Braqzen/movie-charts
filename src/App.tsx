import { useCallback, useState } from "react";
import userData from "../user.json";
import moviesData from "../movies.json";
import { GithubIcon } from "components/icons/github-icon";
import { MoviesTable } from "components/movies/movies-table";
import { MoviesToolbar } from "components/movies/movies-toolbar";
import { TagGraphVisualizationButton } from "components/tag-graph/tag-graph-visualization-button";
import { ThemeToggle } from "components/theme-toggle";
import { mergeTailwindClasses } from "lib/utils";
import { useFilteredMovies, type CategoryTagMatchMode } from "lib/use-filtered-movies";
import type { Movie } from "types/movie";

type UserRow = { id: number; rating: number; like: boolean };
type MovieCatalogRow = { id: number; name: string; categories: string[] };

const catalogById = new Map(
  (moviesData as MovieCatalogRow[]).map((row) => [row.id, row] as const),
);

const movies: Movie[] = (userData as UserRow[]).map((userRow) => {
  const catalog = catalogById.get(userRow.id);
  if (catalog == null) throw new Error(`No catalog movie for id ${userRow.id}`);
  return {
    id: userRow.id,
    name: catalog.name,
    rating: userRow.rating,
    like: userRow.like,
    category: catalog.categories,
  };
});

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [categoryTagMatchMode, setCategoryTagMatchMode] = useState<CategoryTagMatchMode>("all");

  const { allCategories, filteredMovies } = useFilteredMovies(
    movies,
    query,
    selectedCategories,
    categoryTagMatchMode,
  );

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((previous) => {
      const next = new Set(previous);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-svh flex-col text-foreground">
      <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section aria-label="Search and filters" className="shrink-0 px-1 sm:px-0">
          <header className="mb-4 space-y-2 sm:mb-5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Movie Charts</h1>
          </header>
          <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
            <MoviesToolbar
              className="min-w-0 w-full sm:flex-1"
              query={query}
              onQueryChange={setQuery}
              allCategories={allCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              categoryTagMatchMode={categoryTagMatchMode}
              onCategoryTagMatchModeChange={setCategoryTagMatchMode}
            />
            <div className="flex shrink-0 max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-2 self-end">
              <TagGraphVisualizationButton
                filteredMovies={filteredMovies}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                categoryTagMatchMode={categoryTagMatchMode}
                onCategoryTagMatchModeChange={setCategoryTagMatchMode}
              />
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
        </section>
        <section
          aria-label="Movies"
          className="table-elevated-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl text-card-foreground"
        >
          <div className="hide-scrollbar min-h-0 flex-1 overflow-auto px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3">
            <MoviesTable
              movies={filteredMovies}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
