import type { ComponentProps } from "react";
import type { LikedFilter } from "lib/use-filtered-movies";
import { RATING_STEPS, ratingLabel } from "lib/rating-buckets";
import { mergeTailwindClasses } from "lib/utils";

const selectClass =
  "table-elevated-surface h-10 min-w-[4.5rem] rounded-md px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

type LikedRatingFiltersProps = {
  likedFilter: LikedFilter;
  onLikedFilterChange: (value: LikedFilter) => void;
  minRating: number;
  maxRating: number;
  onMinRatingChange: (value: number) => void;
  onMaxRatingChange: (value: number) => void;
} & Pick<ComponentProps<"div">, "className">;

export function LikedRatingFilters({
  likedFilter,
  onLikedFilterChange,
  minRating,
  maxRating,
  onMinRatingChange,
  onMaxRatingChange,
  className,
}: LikedRatingFiltersProps) {
  return (
    <div className={mergeTailwindClasses("flex flex-wrap items-center gap-2", className)}>
      <div
        className="table-elevated-surface flex h-10 shrink-0 overflow-hidden rounded-md"
        role="group"
        aria-label="Filter by liked"
      >
        <button
          type="button"
          onClick={() => {
            onLikedFilterChange("all");
          }}
          className={mergeTailwindClasses(
            "px-3 text-sm font-medium transition-colors",
            likedFilter === "all"
              ? "bg-muted-foreground/20 text-foreground"
              : "text-muted-foreground hover:bg-muted/50",
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            onLikedFilterChange("liked");
          }}
          className={mergeTailwindClasses(
            "border-l border-border px-3 text-sm font-medium transition-colors",
            likedFilter === "liked"
              ? "bg-muted-foreground/20 text-foreground"
              : "text-muted-foreground hover:bg-muted/50",
          )}
        >
          Liked
        </button>
      </div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        Min
        <select
          className={selectClass}
          value={minRating}
          onChange={(e) => {
            const v = Number(e.target.value);
            onMinRatingChange(v);
            if (v > maxRating) onMaxRatingChange(v);
          }}
          aria-label="Minimum rating"
        >
          {RATING_STEPS.map((s) => (
            <option key={s} value={s}>
              {ratingLabel(s)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        Max
        <select
          className={selectClass}
          value={maxRating}
          onChange={(e) => {
            const v = Number(e.target.value);
            onMaxRatingChange(v);
            if (v < minRating) onMinRatingChange(v);
          }}
          aria-label="Maximum rating"
        >
          {RATING_STEPS.map((s) => (
            <option key={s} value={s}>
              {ratingLabel(s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
