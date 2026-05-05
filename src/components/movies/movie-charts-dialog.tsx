import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { normalizeRatingStep, RATING_STEPS, ratingLabel } from "lib/rating-buckets";
import { mergeTailwindClasses } from "lib/utils";
import type { Movie } from "types/movie";

type RatingBinRow = { rating: number; label: string; count: number };

function buildRatingHistogram(movies: readonly Movie[]): RatingBinRow[] {
  const counts = new Map<number, number>();
  for (const step of RATING_STEPS) counts.set(step, 0);
  for (const m of movies) {
    const k = normalizeRatingStep(m.rating);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return RATING_STEPS.map((rating) => ({
    rating,
    label: ratingLabel(rating),
    count: counts.get(rating) ?? 0,
  }));
}

type GenreRatingAgg = {
  genre: string;
  ratingRows: number;
  avgRating: number;
};

function buildGenreRatingAggs(movies: readonly Movie[]): GenreRatingAgg[] {
  const sum = new Map<string, number>();
  const count = new Map<string, number>();
  for (const m of movies) {
    for (const g of m.category) {
      sum.set(g, (sum.get(g) ?? 0) + m.rating);
      count.set(g, (count.get(g) ?? 0) + 1);
    }
  }
  const genres = [...count.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  return genres.map((genre) => {
    const c = count.get(genre) ?? 0;
    const s = sum.get(genre) ?? 0;
    return {
      genre,
      ratingRows: c,
      avgRating: c > 0 ? Math.round((s / c) * 10) / 10 : 0,
    };
  });
}

type GenreLikeSplit = { genre: string; liked: number; notLiked: number };

function buildGenreLikeSplit(movies: readonly Movie[]): GenreLikeSplit[] {
  const genres = new Set<string>();
  for (const m of movies) {
    for (const g of m.category) genres.add(g);
  }
  const sorted = [...genres].toSorted((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  return sorted.map((genre) => {
    let liked = 0;
    let notLiked = 0;
    for (const m of movies) {
      if (!m.category.includes(genre)) continue;
      if (m.like) liked += 1;
      else notLiked += 1;
    }
    return { genre, liked, notLiked };
  });
}

export type MovieChartsButtonProps = {
  movies: readonly Movie[];
  className?: string;
};

export function MovieChartsButton({ movies, className }: MovieChartsButtonProps) {
  const [open, setOpen] = useState(false);

  const genreAggs = useMemo(() => buildGenreRatingAggs(movies), [movies]);
  const overallHist = useMemo(() => buildRatingHistogram(movies), [movies]);
  const likeSplitByGenre = useMemo(() => buildGenreLikeSplit(movies), [movies]);
  const likeSplitChartHeight = Math.min(
    520,
    Math.max(220, likeSplitByGenre.length * 36),
  );
  const likeSplitYAxisWidth = useMemo(() => {
    if (likeSplitByGenre.length === 0) return 48;
    let maxChars = 0;
    for (const row of likeSplitByGenre) {
      if (row.genre.length > maxChars) maxChars = row.genre.length;
    }
    return Math.min(160, Math.max(44, Math.ceil(maxChars * 5.4 + 4)));
  }, [likeSplitByGenre]);

  const genreNames = useMemo(() => genreAggs.map((r) => r.genre), [genreAggs]);
  const [userGenrePick, setUserGenrePick] = useState<string | null>(null);

  const genreForHist = useMemo(() => {
    if (genreNames.length === 0) return "";
    if (userGenrePick != null && genreNames.includes(userGenrePick)) return userGenrePick;
    return genreNames[0] ?? "";
  }, [genreNames, userGenrePick]);

  const categoryHist = useMemo(() => {
    if (!genreForHist) return buildRatingHistogram([]);
    const inGenre = movies.filter((m) => m.category.includes(genreForHist));
    return buildRatingHistogram(inGenre);
  }, [movies, genreForHist]);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setOpen(true);
  }, []);

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

  return (
    <>
      <button
        type="button"
        className={mergeTailwindClasses(
          "table-elevated-surface inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md",
          "text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        onClick={openModal}
        aria-label="Open rating charts"
        title="Rating and category charts"
      >
        <BarChart3 className="size-5" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/55 backdrop-blur-md dark:bg-background/65"
            aria-label="Close charts"
            onClick={closeModal}
          />
          <div
            className="table-elevated-surface relative z-10 flex max-h-[min(92dvh,calc(100vh-1.5rem))] w-full max-w-5xl flex-col overflow-hidden rounded-xl shadow-lg sm:max-h-[min(92dvh,calc(100vh-3rem))]"
            role="dialog"
            aria-modal="true"
            aria-label="Rating charts"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Charts
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Close
              </button>
            </div>
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-col gap-10">
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">All Ratings</h3>
                  <div className="h-64 w-full min-w-0 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overallHist}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          width={36}
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
                        <Bar
                          dataKey="count"
                          name="Titles"
                          fill="var(--chart-bar-fill)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">Ratings per category</h3>
                  {genreAggs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories in the list.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[20rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-3 py-2 font-medium text-foreground">Category</th>
                            <th className="px-3 py-2 font-medium text-foreground tabular-nums">
                              Rating rows
                            </th>
                            <th className="px-3 py-2 font-medium text-foreground tabular-nums">
                              Avg rating
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {genreAggs.map((row) => (
                            <tr
                              key={row.genre}
                              className="border-b border-border last:border-b-0 odd:bg-muted/25"
                            >
                              <td className="px-3 py-2 text-foreground">{row.genre}</td>
                              <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                {row.ratingRows}
                              </td>
                              <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                {row.avgRating.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Rating spread for one category
                  </h3>
                  {genreNames.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories to chart.</p>
                  ) : (
                    <>
                      <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Category
                        <select
                          className="table-elevated-surface h-10 max-w-full rounded-md border border-border px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
                          value={genreForHist}
                          onChange={(e) => {
                            setUserGenrePick(e.target.value);
                          }}
                        >
                          {genreNames.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="h-64 w-full min-w-0 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={categoryHist}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              width={36}
                              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
                            <Bar
                              dataKey="count"
                              name={`Titles in ${genreForHist}`}
                              fill="var(--chart-bar-fill)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">Likes by genre</h3>
                  {movies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No titles in this list.</p>
                  ) : likeSplitByGenre.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No genres on these titles.</p>
                  ) : (
                    <div
                      className="w-full min-w-0"
                      style={{ height: likeSplitChartHeight }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={likeSplitByGenre}
                          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            className="stroke-border"
                          />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="genre"
                            width={likeSplitYAxisWidth}
                            tickMargin={2}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
                          <Bar
                            dataKey="liked"
                            stackId="split"
                            name="Liked"
                            fill="var(--chart-stack-second)"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="notLiked"
                            stackId="split"
                            name="Not liked"
                            fill="var(--chart-stack-first)"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
