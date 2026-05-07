import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MOVIES_CATALOG } from "lib/app-data";
import { genreMovieCountsForScopeTitles } from "lib/catalog-stats";

const ALL_TITLES_FILTER = new Set<string>();

export function GenreBreakdownPage() {
  const genreCounts = useMemo(
    () => genreMovieCountsForScopeTitles(MOVIES_CATALOG, ALL_TITLES_FILTER, "all"),
    [],
  );

  const genreBarHeight = Math.min(480, Math.max(200, genreCounts.length * 30));

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-8 px-3 py-5 text-foreground sm:gap-10 sm:px-6 sm:py-6">
      <section aria-label="Genre distribution">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Genre distribution</h2>
          <div className="w-full min-w-0 pt-0" style={{ height: genreBarHeight }}>
            {genreCounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No titles in this scope.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={genreCounts}
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
                    tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={136}
                    tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Bar
                    dataKey="movieCount"
                    name="Titles"
                    fill="var(--chart-bar-fill)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
