import { useCallback, useMemo, useState } from "react";
import { MoviesTable } from "components/movies/movies-table";
import { MovieFiltersDialog } from "components/movies/movie-filters-dialog";
import { MoviesToolbar } from "components/movies/movies-toolbar";
import { TagGraphVisualizationButton } from "components/tag-graph/tag-graph-visualization-button";
import { TEMP_RATINGS_ROWS, catalogById } from "lib/app-data";
import { userRowsToMovies } from "lib/user-movie-data";
import {
  useFilteredMovies,
  type CategoryTagMatchMode,
  type LikedFilter,
} from "lib/use-filtered-movies";

export function ProfilePage() {
  const movies = useMemo(
    () => userRowsToMovies(TEMP_RATINGS_ROWS, catalogById),
    [],
  );

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [categoryTagMatchMode, setCategoryTagMatchMode] = useState<CategoryTagMatchMode>("all");
  const [likedFilter, setLikedFilter] = useState<LikedFilter>("all");
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

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
      <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section aria-label="Search and filters" className="shrink-0 px-1 sm:px-0">
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
            <MoviesTable
              movies={filteredMovies}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
            />
          </div>
        </section>
      </div>
    </>
  );
}
