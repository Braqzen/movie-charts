/** Shared catalog for genre pages (legacy movies list). */
import moviesData from "../../movies.json";
import { type MovieCatalogRow } from "lib/user-movie-data";

export const MOVIES_CATALOG = moviesData as MovieCatalogRow[];

export function allCatalogCategories(): string[] {
  const unique = new Set<string>();
  for (const row of MOVIES_CATALOG) {
    for (const category of row.categories) unique.add(category);
  }
  return [...unique].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
