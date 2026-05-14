import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MoviesTable } from "components/movies/movies-table";
import { EditMovieRatingDialog } from "components/movies/edit-movie-rating-dialog";
import { MovieFiltersDialog } from "components/movies/movie-filters-dialog";
import { MoviesToolbar } from "components/movies/movies-toolbar";
import { RateMovieDialog } from "components/movies/rate-movie-dialog";
import { TagGraphVisualizationButton } from "components/tag-graph/tag-graph-visualization-button";
import { useUserSession } from "hooks/use-user-session";
import { ratingApiRowsToMovies } from "lib/map-api-ratings";
import { fetchUserRatings } from "lib/user-api";
import {
  useFilteredMovies,
  type CategoryTagMatchMode,
  type LikedFilter,
} from "lib/use-filtered-movies";
import { mergeTailwindClasses } from "lib/utils";
import type { Movie } from "types/movie";

export function ProfilePage() {
  const { userId, username } = useUserSession();
  const location = useLocation();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [categoryTagMatchMode, setCategoryTagMatchMode] = useState<CategoryTagMatchMode>("all");
  const [likedFilter, setLikedFilter] = useState<LikedFilter>("all");
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateDialogKey, setRateDialogKey] = useState(0);
  const [rateInitialMovie, setRateInitialMovie] = useState<Movie | null>(null);

  const reloadRatings = useCallback(async () => {
    if (userId == null) {
      setMovies([]);
      return;
    }
    try {
      const rows = await fetchUserRatings(userId);
      setMovies(ratingApiRowsToMovies(rows));
    } catch {
      setMovies([]);
    }
  }, [userId]);

  useEffect(() => {
    if (location.pathname !== "/catalogue") return;
    let cancelled = false;
    void (async () => {
      if (userId == null) {
        await Promise.resolve();
        if (cancelled) return;
        setMovies([]);
        return;
      }
      try {
        const rows = await fetchUserRatings(userId);
        if (cancelled) return;
        setMovies(ratingApiRowsToMovies(rows));
      } catch {
        if (cancelled) return;
        setMovies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, userId]);

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

  const catalogueHasNoRows = movies.length === 0;

  return (
    <>
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
      {userId != null && rateInitialMovie != null ? (
        <EditMovieRatingDialog
          key={`edit-${rateInitialMovie.id}-${rateDialogKey}`}
          open={rateDialogOpen}
          onOpenChange={(open) => {
            setRateDialogOpen(open);
            if (!open) setRateInitialMovie(null);
          }}
          userId={userId}
          movie={{
            id: rateInitialMovie.id,
            title: rateInitialMovie.name,
            genres: rateInitialMovie.category,
            rating: rateInitialMovie.rating,
            like: rateInitialMovie.like,
          }}
          onSaved={() => {
            void reloadRatings();
          }}
        />
      ) : null}
      {userId != null ? (
        <RateMovieDialog
          key={rateDialogKey}
          open={rateDialogOpen && rateInitialMovie == null}
          onOpenChange={setRateDialogOpen}
          userId={userId}
          onSaved={() => {
            void reloadRatings();
          }}
        />
      ) : null}
      <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section aria-label="Search and filters" className="shrink-0 px-1 sm:px-0">
          <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
            <MoviesToolbar
              className="min-w-0 w-full sm:flex-1"
              query={query}
              onQueryChange={setQuery}
              searchDisabled={catalogueHasNoRows}
              allCategories={allCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              onOpenFilters={() => {
                setFilterDialogOpen(true);
              }}
            />
            <div className="flex shrink-0 max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-2 self-end">
              <button
                type="button"
                disabled={userId == null}
                title={userId == null ? "Select a user first" : undefined}
                onClick={() => {
                  setRateInitialMovie(null);
                  setRateDialogKey((k) => k + 1);
                  setRateDialogOpen(true);
                }}
                className={mergeTailwindClasses(
                  "table-elevated-surface h-10 shrink-0 cursor-pointer rounded-md px-3 font-sans text-sm font-medium text-foreground",
                  "outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                Rate movie
              </button>
              <TagGraphVisualizationButton
                filteredMovies={filteredMovies}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                onOpenFilters={() => {
                  setFilterDialogOpen(true);
                }}
                filtersOverlayOpen={filterDialogOpen}
              />
            </div>
          </div>
        </section>
        <section
          aria-label="Movies"
          className="table-elevated-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl text-card-foreground"
        >
          <div className="hide-scrollbar min-h-0 flex-1 overflow-auto px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3">
            {username === "" ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground sm:px-0">
                Select a user to load your catalog.
              </p>
            ) : null}
            <MoviesTable
              movies={filteredMovies}
              bareEmpty={catalogueHasNoRows}
              emptyLabel="No movies match your filters."
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              onNameCellClick={(movie) => {
                setRateInitialMovie(movie);
                setRateDialogKey((k) => k + 1);
                setRateDialogOpen(true);
              }}
            />
          </div>
        </section>
      </div>
    </>
  );
}
