import { useCallback, useMemo, useState } from "react";
import moviesData from "../movies.json";
import { GithubIcon } from "components/icons/github-icon";
import { MovieAllUsersRatingDialog } from "components/movies/movie-all-users-rating-dialog";
import { MoviesTable } from "components/movies/movies-table";
import { MovieFiltersDialog } from "components/movies/movie-filters-dialog";
import { MoviesToolbar } from "components/movies/movies-toolbar";
import { MovieChartsButton } from "components/movies/movie-charts-dialog";
import { TagGraphVisualizationButton } from "components/tag-graph/tag-graph-visualization-button";
import { ThemeToggle } from "components/theme-toggle";
import { buildRatingsByMovieId } from "lib/all-users-ratings-by-movie";
import { buildCatalogById, type MovieCatalogRow, userRowsToMovies } from "lib/user-movie-data";
import { listUserBundles } from "lib/user-json-bundles";
import { mergeTailwindClasses } from "lib/utils";
import {
  useFilteredMovies,
  type CategoryTagMatchMode,
  type LikedFilter,
} from "lib/use-filtered-movies";
import type { Movie } from "types/movie";

const USER_BUNDLES = listUserBundles();
const catalogById = buildCatalogById(moviesData as MovieCatalogRow[]);
const RATINGS_BY_MOVIE_ID = buildRatingsByMovieId(USER_BUNDLES);

function moviesForSlug(slug: string): Movie[] {
  const bundle = USER_BUNDLES.find((u) => u.slug === slug);
  if (bundle == null) return [];
  return userRowsToMovies(bundle.rows, catalogById);
}

export default function App() {
  const [activeSlug, setActiveSlug] = useState(
    () => USER_BUNDLES[0]?.slug ?? "",
  );

  const movies = useMemo(() => moviesForSlug(activeSlug), [activeSlug]);

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [categoryTagMatchMode, setCategoryTagMatchMode] = useState<CategoryTagMatchMode>("all");
  const [likedFilter, setLikedFilter] = useState<LikedFilter>("all");
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [allUsersRatingMovie, setAllUsersRatingMovie] = useState<Movie | null>(
    null,
  );

  const { allCategories, filteredMovies } = useFilteredMovies(
    movies,
    query,
    selectedCategories,
    categoryTagMatchMode,
    likedFilter,
    minRating,
    maxRating,
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
      <MovieFiltersDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        categoryTagMatchMode={categoryTagMatchMode}
        onCategoryTagMatchModeChange={setCategoryTagMatchMode}
        likedFilter={likedFilter}
        onLikedFilterChange={setLikedFilter}
        minRating={minRating}
        maxRating={maxRating}
        onMinRatingChange={setMinRating}
        onMaxRatingChange={setMaxRating}
      />
      <MovieAllUsersRatingDialog
        open={allUsersRatingMovie != null}
        onOpenChange={(open) => {
          if (!open) setAllUsersRatingMovie(null);
        }}
        movieName={allUsersRatingMovie?.name ?? ""}
        ratings={
          allUsersRatingMovie != null
            ? (RATINGS_BY_MOVIE_ID.get(allUsersRatingMovie.id) ?? [])
            : []
        }
      />
      <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section aria-label="Search and filters" className="shrink-0 px-1 sm:px-0">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Movie Charts</h1>
            {USER_BUNDLES.length > 0 ? (
              <label className="flex shrink-0 items-center gap-2 text-sm">
                <span className="text-muted-foreground">User</span>
                <select
                  className={mergeTailwindClasses(
                    "table-elevated-surface h-10 min-w-[8rem] rounded-md px-3 text-sm text-foreground outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  value={activeSlug}
                  onChange={(e) => {
                    setActiveSlug(e.target.value);
                  }}
                  aria-label="Active user"
                >
                  {USER_BUNDLES.map((u) => (
                    <option key={u.slug} value={u.slug}>
                      {u.slug}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </header>
          <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
            <MoviesToolbar
              className="min-w-0 w-full sm:flex-1"
              query={query}
              onQueryChange={setQuery}
              allCategories={allCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              onOpenFilters={() => {
                setFilterDialogOpen(true);
              }}
            />
            <div className="flex shrink-0 max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-2 self-end">
              <MovieChartsButton movies={movies} />
              <TagGraphVisualizationButton
                filteredMovies={filteredMovies}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                onOpenFilters={() => {
                  setFilterDialogOpen(true);
                }}
                filtersOverlayOpen={filterDialogOpen || allUsersRatingMovie != null}
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
              onNameCellClick={(m) => {
                setAllUsersRatingMovie(m);
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
