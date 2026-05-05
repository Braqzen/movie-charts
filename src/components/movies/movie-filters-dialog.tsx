import { useEffect, useId } from "react";
import { CategoryMatchModeToggle } from "components/movies/category-match-mode-toggle";
import { LikedRatingFilters } from "components/movies/liked-rating-filters";
import type { CategoryTagMatchMode, LikedFilter } from "lib/use-filtered-movies";
import { mergeTailwindClasses } from "lib/utils";

export type MovieFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryTagMatchMode: CategoryTagMatchMode;
  onCategoryTagMatchModeChange: (mode: CategoryTagMatchMode) => void;
  likedFilter: LikedFilter;
  onLikedFilterChange: (value: LikedFilter) => void;
  minRating: number;
  maxRating: number;
  onMinRatingChange: (value: number) => void;
  onMaxRatingChange: (value: number) => void;
};

export function MovieFiltersDialog({
  open,
  onOpenChange,
  categoryTagMatchMode,
  onCategoryTagMatchModeChange,
  likedFilter,
  onLikedFilterChange,
  minRating,
  maxRating,
  onMinRatingChange,
  onMaxRatingChange,
}: MovieFiltersDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/55 backdrop-blur-md dark:bg-background/65"
        aria-label="Close filters"
        onClick={() => {
          onOpenChange(false);
        }}
      />
      <div
        className={mergeTailwindClasses(
          "relative z-10 flex max-h-[min(90dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            Filters
          </h2>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Done
          </button>
        </div>
        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-8">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Categories</h3>
              <p className="text-sm text-muted-foreground">
                When several categories are selected, match titles with:
              </p>
              <CategoryMatchModeToggle
                value={categoryTagMatchMode}
                onChange={onCategoryTagMatchModeChange}
              />
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Liked and rating</h3>
              <LikedRatingFilters
                likedFilter={likedFilter}
                onLikedFilterChange={onLikedFilterChange}
                minRating={minRating}
                maxRating={maxRating}
                onMinRatingChange={onMinRatingChange}
                onMaxRatingChange={onMaxRatingChange}
                className="flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
