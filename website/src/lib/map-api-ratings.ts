import type { RatingApiRow } from "lib/user-api";
import type { Movie } from "types/movie";

export function ratingApiRowsToMovies(rows: readonly RatingApiRow[]): Movie[] {
  return rows.map((r) => ({
    id: r.movie_id,
    name: r.title,
    rating: Number(r.rating),
    like: r.like,
    category: [...r.genres],
  }));
}
