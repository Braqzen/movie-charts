import type { Movie } from "types/movie";

export type UserRow = { id: number; rating: number; like: boolean };
export type MovieCatalogRow = { id: number; name: string; categories: string[] };

export function buildCatalogById(catalog: readonly MovieCatalogRow[]): Map<number, MovieCatalogRow> {
  return new Map(catalog.map((row) => [row.id, row] as const));
}

export function userRowsToMovies(
  rows: readonly UserRow[],
  catalogById: ReadonlyMap<number, MovieCatalogRow>,
): Movie[] {
  return rows.map((userRow) => {
    const catalog = catalogById.get(userRow.id);
    if (catalog == null) throw new Error(`No catalog movie for id ${userRow.id}`);
    return {
      id: userRow.id,
      name: catalog.name,
      rating: userRow.rating,
      like: userRow.like,
      category: catalog.categories,
    };
  });
}
