import type { ComponentProps } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CategoryFilter } from "components/movies/category-filter";
import { MovieSearchField } from "components/movies/movie-search-field";
import { mergeTailwindClasses } from "lib/utils";

type MoviesToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchDisabled?: boolean;
  searchDisabledTitle?: string;
  allCategories: readonly string[];
  selectedCategories: ReadonlySet<string>;
  onToggleCategory: (category: string) => void;
  onOpenFilters: () => void;
} & Pick<ComponentProps<"div">, "className">;

export function MoviesToolbar({
  query,
  onQueryChange,
  searchDisabled = false,
  searchDisabledTitle = "No titles to search yet",
  allCategories,
  selectedCategories,
  onToggleCategory,
  onOpenFilters,
  className,
}: MoviesToolbarProps) {
  return (
    <div
      className={mergeTailwindClasses(
        "flex flex-col gap-4 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0 max-w-5xl flex-1">
        <MovieSearchField
          value={query}
          onChange={onQueryChange}
          disabled={searchDisabled}
          title={searchDisabled ? searchDisabledTitle : undefined}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <CategoryFilter
          categories={allCategories}
          selected={selectedCategories}
          onToggle={onToggleCategory}
        />
        <button
          type="button"
          onClick={onOpenFilters}
          className={mergeTailwindClasses(
            "table-elevated-surface inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3",
            "text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Open filters"
          title="Match mode, liked titles, rating range"
        >
          <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
          Filters
        </button>
      </div>
    </div>
  );
}
