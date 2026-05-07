import { movieMatchesCategorySelection } from "lib/category-match";
import type { MovieCatalogRow } from "lib/user-movie-data";
import type { CategoryTagMatchMode } from "lib/use-filtered-movies";

export type CategoryMovieCount = { category: string; movieCount: number };

/** Each catalog title in scope contributes once per genre tag it has. */
export function genreMovieCountsForScopeTitles(
  catalog: readonly MovieCatalogRow[],
  selectedCategories: ReadonlySet<string>,
  categoryTagMatchMode: CategoryTagMatchMode,
): CategoryMovieCount[] {
  const counts = new Map<string, number>();
  for (const row of catalog) {
    if (
      !movieMatchesCategorySelection(
        row.categories,
        selectedCategories,
        categoryTagMatchMode,
      )
    ) {
      continue;
    }
    for (const g of row.categories) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([category, movieCount]) => ({ category, movieCount }))
    .toSorted((a, b) =>
      a.category.localeCompare(b.category, undefined, { sensitivity: "base" }),
    );
}
