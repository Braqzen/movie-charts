import { useMemo } from "react";
import type { Movie } from "types/movie";
import { movieMatchesCategorySelection } from "lib/category-match";

/** all: AND every selected category. any: OR at least one selected category. */
export type CategoryTagMatchMode = "all" | "any";

export type LikedFilter = "all" | "liked";

export function useFilteredMovies(
  movies: readonly Movie[],
  searchQuery: string,
  selectedCategories: ReadonlySet<string>,
  categoryTagMatchMode: CategoryTagMatchMode,
  likedFilter: LikedFilter,
  minRating: number,
  maxRating: number,
) {
  const allCategories = useMemo(() => {
    const unique = new Set<string>();
    for (const movie of movies) {
      for (const category of movie.category) unique.add(category);
    }
    return [...unique].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const searchQueryLowercase = searchQuery.trim().toLowerCase();
    const lo = Math.min(minRating, maxRating);
    const hi = Math.max(minRating, maxRating);

    const matching = movies.filter((movie) => {
      if (searchQueryLowercase) {
        if (!movie.name.toLowerCase().includes(searchQueryLowercase)) return false;
      }
      if (likedFilter === "liked" && !movie.like) return false;
      if (movie.rating < lo || movie.rating > hi) return false;

      if (selectedCategories.size === 0) return true;

      return movieMatchesCategorySelection(
        movie.category,
        selectedCategories,
        categoryTagMatchMode,
      );
    });
    return [...matching].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      }),
    );
  }, [
    movies,
    searchQuery,
    selectedCategories,
    categoryTagMatchMode,
    likedFilter,
    minRating,
    maxRating,
  ]);

  return { allCategories, filteredMovies };
}
