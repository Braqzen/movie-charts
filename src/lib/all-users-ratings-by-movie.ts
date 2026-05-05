import type { UserBundle } from "lib/user-json-bundles";
import type { UserRow } from "lib/user-movie-data";

/** For each catalog id, every rating from every user file that lists this title. */
export function buildRatingsByMovieId(
  bundles: readonly UserBundle[],
): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const bundle of bundles) {
    for (const row of bundle.rows) {
      appendRating(map, row);
    }
  }
  return map;
}

function appendRating(map: Map<number, number[]>, row: UserRow) {
  const list = map.get(row.id);
  if (list) list.push(row.rating);
  else map.set(row.id, [row.rating]);
}
