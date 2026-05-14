import { Heart, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { mergeTailwindClasses } from "lib/utils";
import {
  deleteRatingViaApi,
  postRatingViaApi,
  type SearchMovieRow,
} from "lib/user-api";

const overlayButton =
  "absolute inset-0 cursor-pointer bg-background/55 backdrop-blur-md dark:bg-background/65";

type EditMovieRatingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  movie: SearchMovieRow & { rating: number; like: boolean };
  onSaved: () => void;
};

export function EditMovieRatingDialog({
  open,
  onOpenChange,
  userId,
  movie,
  onSaved,
}: EditMovieRatingDialogProps) {
  const [ratingInput, setRatingInput] = useState(() => String(movie.rating));
  const [like, setLike] = useState(() => movie.like);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const closeModal = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setRatingInput(String(movie.rating));
    setLike(movie.like);
    setSubmitError(null);
  }, [open, movie.rating, movie.like, movie.id]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const onSubmitRating = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const rating = Number(ratingInput);
      if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
        setSubmitError("Rating must be between 0 and 5.");
        return;
      }
      setSubmitError(null);
      setSubmitBusy(true);
      try {
        await postRatingViaApi({
          userId,
          movieId: movie.id,
          rating,
          like,
        });
        onSaved();
        closeModal();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Save failed.");
      } finally {
        setSubmitBusy(false);
      }
    },
    [closeModal, like, movie.id, onSaved, ratingInput, userId],
  );

  const onDeleteRating = useCallback(async () => {
    setSubmitError(null);
    setDeleteBusy(true);
    try {
      await deleteRatingViaApi({ userId, movieId: movie.id });
      onSaved();
      closeModal();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleteBusy(false);
    }
  }, [closeModal, movie.id, onSaved, userId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className={overlayButton}
        aria-label="Close edit rating dialog"
        onClick={closeModal}
      />
      <div
        className="table-elevated-surface relative z-10 flex w-[min(96vw,26rem)] flex-col overflow-hidden rounded-xl shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Edit rating for this title"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Edit rating</h2>
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex h-8 cursor-pointer items-center rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmitRating} className="flex flex-col gap-4 px-4 py-4">
          <div className="space-y-0.5">
            <p className="font-semibold leading-tight text-foreground">{movie.title}</p>
            <p className="text-xs text-muted-foreground">
              {movie.genres.length === 0 ? "No genres" : movie.genres.join(", ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="edit-rate-value" className="text-sm font-medium text-foreground">
              Rating
            </label>
            <input
              id="edit-rate-value"
              type="number"
              name="rating"
              min={0}
              max={5}
              step={0.1}
              value={ratingInput}
              onChange={(e) => setRatingInput(e.target.value)}
              className={mergeTailwindClasses(
                "table-elevated-surface h-9 w-20 cursor-text rounded-md px-2.5 text-sm tabular-nums text-foreground",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                (submitBusy || deleteBusy) && "cursor-not-allowed opacity-60",
              )}
              disabled={submitBusy || deleteBusy}
            />
            <button
              type="button"
              onClick={() => setLike((v) => !v)}
              disabled={submitBusy || deleteBusy}
              aria-label={like ? "Unlike" : "Like"}
              className={mergeTailwindClasses(
                "table-elevated-surface inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium",
                "outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                like ? "text-destructive" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart
                className="size-3.5 shrink-0"
                fill={like ? "currentColor" : "none"}
                aria-hidden
              />
              Like
            </button>
            <button
              type="button"
              onClick={() => void onDeleteRating()}
              disabled={submitBusy || deleteBusy}
              className={mergeTailwindClasses(
                "table-elevated-surface inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium",
                "text-destructive outline-none hover:bg-muted",
                "focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "ms-auto",
              )}
            >
              {deleteBusy ? (
                <span className="text-xs">...</span>
              ) : (
                <>
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  Remove
                </>
              )}
            </button>
          </div>

          {submitError != null ? (
            <p className="text-xs text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitBusy || deleteBusy}
            className={mergeTailwindClasses(
              "table-elevated-surface h-9 w-full cursor-pointer rounded-md text-sm font-semibold text-foreground",
              "outline-none hover:bg-muted",
              "focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {submitBusy ? "Saving..." : "Save rating"}
          </button>
        </form>
      </div>
    </div>
  );
}
