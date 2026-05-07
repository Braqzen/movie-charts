/** Shared catalog and temp ratings snapshot. */
import moviesData from "../../movies.json";
import ratingsData from "../../ratings.json";
import { buildCatalogById, type MovieCatalogRow, type UserRow } from "lib/user-movie-data";

export const TEMP_RATINGS_ROWS = ratingsData as UserRow[];
export const MOVIES_CATALOG = moviesData as MovieCatalogRow[];
export const catalogById = buildCatalogById(MOVIES_CATALOG);

export function allCatalogCategories(): string[] {
  const unique = new Set<string>();
  for (const row of MOVIES_CATALOG) {
    for (const category of row.categories) unique.add(category);
  }
  return [...unique].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
