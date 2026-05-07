import { type FormEvent, useCallback, useEffect, useState } from "react";
import { mergeTailwindClasses } from "lib/utils";
import { postRatingViaApi, searchMoviesViaApi, type SearchMovieRow } from "lib/user-api";
import { MovieSearchField } from "components/movies/movie-search-field";

const overlayButton = "absolute inset-0 bg-background/55 backdrop-blur-md dark:bg-background/65";

type RateMovieDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onSaved: () => void;
  initialMovie?: SearchMovieRow & { rating: number; like: boolean };
};

export function RateMovieDialog({
  open,
  onOpenChange,
  userId,
  onSaved,
  initialMovie,
}: RateMovieDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchMovieRow[]>([]);
  const [loadedForQuery, setLoadedForQuery] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchMovieRow | null>(() => initialMovie ?? null);
  const [ratingInput, setRatingInput] = useState(() =>
    initialMovie == null ? "3" : String(initialMovie.rating),
  );
  const [like, setLike] = useState(() => initialMovie?.like ?? false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || debouncedQuery === "") return;

    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setSearchBusy(true);
      setSearchError(null);
      try {
        const rows = await searchMoviesViaApi(debouncedQuery);
        if (cancelled) return;
        setResults(rows);
        setLoadedForQuery(debouncedQuery);
      } catch (e: unknown) {
        if (cancelled) return;
        setSearchError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const displayRows =
    debouncedQuery === "" || debouncedQuery !== loadedForQuery ? [] : results;
  const showNoResults =
    debouncedQuery !== "" &&
    loadedForQuery === debouncedQuery &&
    results.length === 0 &&
    !searchBusy &&
    searchError == null;

  const onSubmitRating = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (selected == null) return;
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
          movieId: selected.id,
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
    [closeModal, like, onSaved, ratingInput, selected, userId],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className={overlayButton}
        aria-label="Close rate movie dialog"
        onClick={closeModal}
      />
      <div
        className={mergeTailwindClasses(
          "table-elevated-surface relative z-10 flex w-[min(98vw,72rem)] flex-col overflow-hidden rounded-xl shadow-lg",
          "h-[min(88dvh,52rem)] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Rate a movie"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Rate movie
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </div>
        <div className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {selected == null ? (
            <div className="flex min-h-0 flex-1 flex-col gap-6">
              <section className="shrink-0 space-y-3" aria-label="Find a movie">
                <h3 className="text-sm font-semibold text-foreground">Find a movie</h3>
                <MovieSearchField
                  id="rate-movie-search"
                  value={query}
                  onChange={setQuery}
                  placeholder="Search movies in database"
                />
                {searchBusy ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : null}
                {searchError != null ? (
                  <p className="text-sm text-destructive" role="alert">
                    {searchError}
                  </p>
                ) : null}
              </section>
              <ul className="hide-scrollbar min-h-0 flex-1 list-none divide-y divide-border overflow-y-auto py-1">
                {showNoResults ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">No results.</li>
                ) : null}
                {displayRows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(row);
                        setRatingInput("3");
                        setLike(false);
                        setSubmitError(null);
                      }}
                      className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="font-medium text-foreground">{row.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {row.genres.length === 0 ? "No genres" : row.genres.join(", ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <form
              onSubmit={onSubmitRating}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-tight text-foreground">
                    {selected.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.genres.length === 0 ? "No genres" : selected.genres.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setSubmitError(null);
                  }}
                  className="shrink-0 self-start rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Change movie
                </button>
              </div>
              <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-end">
                <label className="text-sm text-muted-foreground">
                  Rating (0 to 5)
                  <input
                    type="number"
                    name="rating"
                    min={0}
                    max={5}
                    step={0.1}
                    value={ratingInput}
                    onChange={(e) => setRatingInput(e.target.value)}
                    className={mergeTailwindClasses(
                      "mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground sm:w-48",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    disabled={submitBusy}
                  />
                </label>
                <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={like}
                    onChange={(e) => setLike(e.target.checked)}
                    disabled={submitBusy}
                  />
                  Like
                </label>
              </div>
              {submitError != null ? (
                <p className="text-sm text-destructive" role="alert">
                  {submitError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitBusy}
                className={mergeTailwindClasses(
                  "mt-auto shrink-0 table-elevated-surface h-10 w-full rounded-md text-sm font-medium text-foreground sm:max-w-xs",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {submitBusy ? "Saving..." : "Save rating"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
