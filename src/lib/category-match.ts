import type { CategoryTagMatchMode } from "lib/use-filtered-movies";

/** Movie tags match the current category chip selection (empty = all). */
export function movieMatchesCategorySelection(
  tagsOnMovie: readonly string[],
  selectedCategories: ReadonlySet<string>,
  categoryTagMatchMode: CategoryTagMatchMode,
): boolean {
  if (selectedCategories.size === 0) return true;

  if (categoryTagMatchMode === "all") {
    for (const category of selectedCategories) {
      if (!tagsOnMovie.includes(category)) return false;
    }
    return true;
  }

  return [...selectedCategories].some((category) => tagsOnMovie.includes(category));
}
