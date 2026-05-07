import { Heart } from "lucide-react";
import type { Movie } from "types/movie";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { CategoryBadge } from "components/movies/category-badge";
import { mergeTailwindClasses } from "lib/utils";

type MoviesTableProps = {
  movies: readonly Movie[];
  emptyLabel?: string;
  /** When true and there are no rows, render header only with an empty body. */
  bareEmpty?: boolean;
  selectedCategories: ReadonlySet<string>;
  onToggleCategory: (category: string) => void;
  onNameCellClick?: (movie: Movie) => void;
};

export function MoviesTable({
  movies,
  emptyLabel = "No movies match your filters.",
  bareEmpty = false,
  selectedCategories,
  onToggleCategory,
  onNameCellClick,
}: MoviesTableProps) {
  return (
    <Table className="min-w-full table-fixed">
      <colgroup>
        <col style={{ width: "3%" }} />
        <col style={{ width: "56%" }} />
        <col style={{ width: "5%" }} />
        <col style={{ width: "4%" }} />
        <col style={{ width: "32%" }} />
      </colgroup>
      <TableHeader className="sticky top-0 z-[1] [&_th]:bg-card [&_th]:h-auto [&_th]:min-h-10 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
        <TableRow className="border-b-2 border-foreground/16 hover:bg-transparent dark:border-foreground/22 [&_th:not(:first-child)]:border-l [&_th:not(:first-child)]:border-foreground/14 dark:[&_th:not(:first-child)]:border-foreground/20">
          <TableHead className="ps-3 pe-2.5 text-center tabular-nums">#</TableHead>
          <TableHead className="min-w-0 ps-4 pe-2">Name</TableHead>
          <TableHead className="px-2 !text-center tabular-nums">Rating</TableHead>
          <TableHead className="px-2 text-center">Like</TableHead>
          <TableHead className="min-w-0 ps-4 pe-2">Genre</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movies.length === 0 ? (
          bareEmpty ? null : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )
        ) : (
          movies.map((movie, index) => (
            <TableRow
              key={movie.id}
              className="[&_td:not(:first-child)]:border-l [&_td:not(:first-child)]:border-foreground/14 dark:[&_td:not(:first-child)]:border-foreground/20 transition-colors"
            >
              <TableCell className="ps-3 pe-2.5 py-2.5 text-center align-middle tabular-nums font-medium">
                {index + 1}
              </TableCell>
              <TableCell className="min-w-0 ps-4 pe-2 py-2.5 align-middle whitespace-normal">
                {onNameCellClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      onNameCellClick(movie);
                    }}
                    className={mergeTailwindClasses(
                      "max-w-full cursor-pointer rounded-sm text-left font-medium text-foreground",
                      "hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {movie.name}
                  </button>
                ) : (
                  <span className="font-medium">{movie.name}</span>
                )}
              </TableCell>
              <TableCell className="px-2 py-2.5 !text-center align-middle tabular-nums">
                {movie.rating}
              </TableCell>
              <TableCell className="px-2 py-2.5 text-center align-middle">
                {movie.like ? (
                  <Heart
                    className="mx-auto size-5 text-destructive"
                    fill="currentColor"
                    aria-label="Liked"
                  />
                ) : null}
              </TableCell>
              <TableCell className="min-w-0 ps-4 pe-2 py-2.5 align-middle">
                <div className="flex flex-wrap items-center gap-2">
                  {[...movie.category]
                    .sort((a, b) => a.localeCompare(b))
                    .map((category) => (
                      <CategoryBadge
                        key={category}
                        label={category}
                        selected={selectedCategories.has(category)}
                        onToggle={() => {
                          onToggleCategory(category);
                        }}
                      />
                    ))}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
