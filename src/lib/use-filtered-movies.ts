import { useMemo } from "react";
import type { Movie } from "types/movie";

/** all: AND every selected category. any: OR at least one selected category. */
export type CategoryTagMatchMode = "all" | "any";

export function useFilteredMovies(
  movies: readonly Movie[],
  searchQuery: string,
  selectedCategories: ReadonlySet<string>,
  categoryTagMatchMode: CategoryTagMatchMode,
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
    const matching = movies.filter((movie) => {
      if (searchQueryLowercase) {
        if (!movie.name.toLowerCase().includes(searchQueryLowercase)) return false;
      }
      if (selectedCategories.size === 0) return true;

      const tagsOnMovie = movie.category;
      if (categoryTagMatchMode === "all") {
        for (const category of selectedCategories) {
          if (!tagsOnMovie.includes(category)) return false;
        }
      } else {
        const anyHit = [...selectedCategories].some((category) =>
          tagsOnMovie.includes(category),
        );
        if (!anyHit) return false;
      }

      return true;
    });
    return [...matching].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      }),
    );
  }, [movies, searchQuery, selectedCategories, categoryTagMatchMode]);

  return { allCategories, filteredMovies };
}
