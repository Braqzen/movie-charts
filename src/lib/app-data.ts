/** Shared catalog and user bundles (Vite glob). */
import moviesData from "../../movies.json";
import { buildRatingsByMovieId } from "lib/all-users-ratings-by-movie";
import { buildCatalogById, type MovieCatalogRow } from "lib/user-movie-data";
import { listUserBundles } from "lib/user-json-bundles";

export const USER_BUNDLES = listUserBundles();
export const MOVIES_CATALOG = moviesData as MovieCatalogRow[];
export const catalogById = buildCatalogById(MOVIES_CATALOG);
export const RATINGS_BY_MOVIE_ID = buildRatingsByMovieId(USER_BUNDLES);

export function allCatalogCategories(): string[] {
  const unique = new Set<string>();
  for (const row of MOVIES_CATALOG) {
    for (const category of row.categories) unique.add(category);
  }
  return [...unique].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
