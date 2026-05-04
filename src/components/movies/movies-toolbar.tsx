import type { ComponentProps } from "react";
import { CategoryFilter } from "components/movies/category-filter";
import { CategoryMatchModeToggle } from "components/movies/category-match-mode-toggle";
import { MovieSearchField } from "components/movies/movie-search-field";
import type { CategoryTagMatchMode } from "lib/use-filtered-movies";
import { mergeTailwindClasses } from "lib/utils";

type MoviesToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  allCategories: readonly string[];
  selectedCategories: ReadonlySet<string>;
  onToggleCategory: (category: string) => void;
  categoryTagMatchMode: CategoryTagMatchMode;
  onCategoryTagMatchModeChange: (mode: CategoryTagMatchMode) => void;
} & Pick<ComponentProps<"div">, "className">;

export function MoviesToolbar({
  query,
  onQueryChange,
  allCategories,
  selectedCategories,
  onToggleCategory,
  categoryTagMatchMode,
  onCategoryTagMatchModeChange,
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
        <MovieSearchField value={query} onChange={onQueryChange} />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <CategoryFilter
          categories={allCategories}
          selected={selectedCategories}
          onToggle={onToggleCategory}
        />
        <CategoryMatchModeToggle
          value={categoryTagMatchMode}
          onChange={onCategoryTagMatchModeChange}
        />
      </div>
    </div>
  );
}
