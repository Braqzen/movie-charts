import { useEffect, useId } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { normalizeRatingStep, RATING_STEPS, ratingLabel } from "lib/rating-buckets";
import { mergeTailwindClasses } from "lib/utils";

type BinRow = { rating: number; label: string; count: number };

function histogramFromRatings(ratings: readonly number[]): BinRow[] {
  const counts = new Map<number, number>();
  for (const step of RATING_STEPS) counts.set(step, 0);
  for (const r of ratings) {
    const k = normalizeRatingStep(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return RATING_STEPS.map((rating) => ({
    rating,
    label: ratingLabel(rating),
    count: counts.get(rating) ?? 0,
  }));
}

export type MovieAllUsersRatingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieName: string;
  ratings: readonly number[];
};

export function MovieAllUsersRatingDialog({
  open,
  onOpenChange,
  movieName,
  ratings,
}: MovieAllUsersRatingDialogProps) {
  const titleId = useId();
  const chartData = histogramFromRatings(ratings);

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
        aria-label="Close"
        onClick={() => {
          onOpenChange(false);
        }}
      />
      <div
        className={mergeTailwindClasses(
          "relative z-10 flex max-h-[min(88dvh,calc(100vh-2rem))] w-full max-w-[min(56rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:max-h-[min(88dvh,calc(100vh-3rem))]",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              All user ratings
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground sm:text-base">
              {movieName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </div>
        <div className="flex min-h-0 w-full min-w-0 flex-1 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="h-[min(58dvh,28rem)] w-full min-h-[14rem] sm:h-[min(62dvh,32rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 12, left: 6, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={40}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.375rem",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Bar dataKey="count" name="Count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
