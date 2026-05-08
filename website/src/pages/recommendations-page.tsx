import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { MoviesTable } from "components/movies/movies-table";
import { MovieFiltersDialog } from "components/movies/movie-filters-dialog";
import { MoviesToolbar } from "components/movies/movies-toolbar";
import { TagGraphVisualizationButton } from "components/tag-graph/tag-graph-visualization-button";
import { useUserSession } from "hooks/use-user-session";
import {
  fetchRecommendationsViaApi,
  type RecommendationApiRow,
} from "lib/user-api";
import {
  useFilteredMovies,
  type CategoryTagMatchMode,
  type LikedFilter,
} from "lib/use-filtered-movies";
import { mergeTailwindClasses } from "lib/utils";
import type { Movie } from "types/movie";

const PAGE_SIZE = 50;

function recToMovie(r: RecommendationApiRow): Movie {
  return {
    id: r.id,
    name: r.title,
    category: r.genres,
    rating: 0,
    like: false,
  };
}

export function RecommendationsPage() {
  const { userId, username } = useUserSession();
  const location = useLocation();
  const [recRows, setRecRows] = useState<RecommendationApiRow[]>([]);
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [categoryTagMatchMode, setCategoryTagMatchMode] = useState<CategoryTagMatchMode>("all");
  const [likedFilter] = useState<LikedFilter>("all");
  const [minRating] = useState(0);
  const [maxRating] = useState(5);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [matchLevel, setMatchLevel] = useState<"all" | number>("all");
  const [page, setPage] = useState(1);

  const reload = useCallback(async () => {
    if (userId == null) {
      setRecRows([]);
      return;
    }
    setLoadBusy(true);
    setLoadError(null);
    try {
      const rows = await fetchRecommendationsViaApi(userId);
      setRecRows(rows);
    } catch (e: unknown) {
      setRecRows([]);
      setLoadError(e instanceof Error ? e.message : "Could not load recommendations.");
    } finally {
      setLoadBusy(false);
    }
  }, [userId]);

  useEffect(() => {
    if (location.pathname !== "/recommendations") return;
    void reload();
  }, [location.pathname, reload]);

  const matchLevels = useMemo(() => {
    const s = new Set(recRows.map((r) => r.match_count));
    return [...s].sort((a, b) => b - a);
  }, [recRows]);

  const matchCountByMovieId = useMemo(
    () => new Map(recRows.map((r) => [r.id, r.match_count] as const)),
    [recRows],
  );

  const bucketRows = useMemo(() => {
    const sorted = [...recRows].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
    if (matchLevel === "all") return sorted;
    return sorted.filter((r) => r.match_count === matchLevel);
  }, [recRows, matchLevel]);

  const moviesFromRecs = useMemo(() => bucketRows.map(recToMovie), [bucketRows]);

  const moviesAllLevels = useMemo(() => {
    return [...recRows]
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
      .map(recToMovie);
  }, [recRows]);

  const filterOpts = { skipLikedAndRatingFilters: true } as const;

  const { allCategories, filteredMovies: graphFilteredMovies } = useFilteredMovies(
    moviesAllLevels,
    query,
    selectedCategories,
    categoryTagMatchMode,
    likedFilter,
    minRating,
    maxRating,
    filterOpts,
  );

  const { filteredMovies } = useFilteredMovies(
    moviesFromRecs,
    query,
    selectedCategories,
    categoryTagMatchMode,
    likedFilter,
    minRating,
    maxRating,
    filterOpts,
  );

  useEffect(() => {
    setPage(1);
  }, [matchLevel, query, selectedCategories, categoryTagMatchMode]);

  const totalFiltered = filteredMovies.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (pageClamped - 1) * PAGE_SIZE;
  const pageSlice = filteredMovies.slice(pageOffset, pageOffset + PAGE_SIZE);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((previous) => {
      const next = new Set(previous);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const bareEmpty = recRows.length === 0 && !loadBusy && loadError == null;

  return (
    <>
      <MovieFiltersDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        categoryTagMatchMode={categoryTagMatchMode}
        onCategoryTagMatchModeChange={setCategoryTagMatchMode}
        likedFilter={likedFilter}
        onLikedFilterChange={() => {}}
        minRating={minRating}
        maxRating={maxRating}
        onMinRatingChange={() => {}}
        onMaxRatingChange={() => {}}
        categoriesOnly
      />
      <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section aria-label="Recommendations controls" className="shrink-0 px-1 sm:px-0">
          <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-end">
            <MoviesToolbar
              className="min-w-0 w-full sm:flex-1"
              query={query}
              onQueryChange={setQuery}
              searchDisabled={bareEmpty}
              allCategories={allCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              onOpenFilters={() => {
                setFilterDialogOpen(true);
              }}
            />
            <div className="flex max-w-full shrink-0 flex-nowrap items-center justify-end gap-2 self-end">
              <select
                aria-label="Match level"
                value={matchLevel === "all" ? "all" : String(matchLevel)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMatchLevel(v === "all" ? "all" : Number(v));
                }}
                disabled={userId == null || recRows.length === 0}
                className={mergeTailwindClasses(
                  "h-10 w-[9.5rem] shrink-0 rounded-md border border-border bg-background px-2 text-sm text-foreground",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <option value="all">All levels</option>
                {matchLevels.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} {n === 1 ? "genre" : "genres"}
                  </option>
                ))}
              </select>
              <TagGraphVisualizationButton
                filteredMovies={graphFilteredMovies}
                allCategories={allCategories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                onOpenFilters={() => {
                  setFilterDialogOpen(true);
                }}
                filtersOverlayOpen={filterDialogOpen}
                filterSimplified
                recommendationMatchLevel={{
                  value: matchLevel,
                  onChange: setMatchLevel,
                  levels: matchLevels,
                  matchCountByMovieId,
                }}
              />
            </div>
          </div>
          {!loadBusy && loadError == null && recRows.length > 0 ? (
            <p className="mt-3 px-1 text-sm tabular-nums text-muted-foreground sm:px-0">
              {recRows.length} recommendations
            </p>
          ) : null}
        </section>
        <section
          aria-label="Recommended movies"
          className="table-elevated-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl text-card-foreground"
        >
          <div className="hide-scrollbar min-h-0 flex-1 overflow-auto px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3">
            {loadBusy ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">Loading...</p>
            ) : null}
            {loadError != null ? (
              <p className="px-1 py-6 text-center text-sm text-destructive" role="alert">
                {loadError}
              </p>
            ) : null}
            {username === "" ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground sm:px-0">
                Select a user to load recommendations.
              </p>
            ) : null}
            {!loadBusy && username !== "" && userId != null ? (
              <MoviesTable
                movies={pageSlice}
                bareEmpty={bareEmpty}
                emptyLabel="No recommendations match your filters."
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                variant="recommendations"
                rankOffset={pageOffset}
              />
            ) : null}
          </div>
          {!loadBusy && totalFiltered > PAGE_SIZE ? (
            <div className="flex shrink-0 flex-col items-center gap-2 border-t border-border px-3 py-3 sm:px-5">
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  disabled={pageClamped <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className={mergeTailwindClasses(
                    "table-elevated-surface w-28 rounded-md px-3 py-1.5 text-sm font-medium",
                    "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pageClamped >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={mergeTailwindClasses(
                    "table-elevated-surface w-28 rounded-md px-3 py-1.5 text-sm font-medium",
                    "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  Next
                </button>
              </div>
              <p className="w-full text-center text-sm tabular-nums text-muted-foreground">
                Page {pageClamped} of {totalPages}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
