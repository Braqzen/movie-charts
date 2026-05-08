import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchCatalogGenreCounts } from "lib/user-api";

export function DatabasePage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const c = await fetchCatalogGenreCounts();
        if (cancelled) return;
        setCounts(c);
      } catch (e: unknown) {
        if (cancelled) return;
        setCounts({});
        setError(e instanceof Error ? e.message : "Could not load catalog.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const genreCounts = useMemo(() => {
    return Object.entries(counts)
      .filter(([, movieCount]) => movieCount > 0)
      .map(([category, movieCount]) => ({ category, movieCount }))
      .sort((a, b) => a.category.localeCompare(b.category, undefined, { sensitivity: "base" }));
  }, [counts]);

  const genreYTicks = useMemo(() => genreCounts.map((row) => row.category), [genreCounts]);

  const genreBarHeight = Math.min(3200, Math.max(200, genreCounts.length * 28));

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-8 px-3 py-5 text-foreground sm:gap-10 sm:px-6 sm:py-6">
      <section aria-label="Database genre counts">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Genre breakdown</h2>
          {busy ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : null}
          {error != null ? (
            <p className="py-8 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {!busy && error == null ? (
            <div
              className="hide-scrollbar w-full min-w-0 max-h-[min(80vh,48rem)] overflow-y-auto pt-0"
              style={{ height: genreBarHeight }}
            >
              {genreCounts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No genre data in the database.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={genreBarHeight}>
                  <BarChart
                    layout="vertical"
                    data={genreCounts}
                    margin={{ top: 8, right: 12, left: 20, bottom: 8 }}
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
                      width={168}
                      interval={0}
                      minTickGap={0}
                      ticks={genreYTicks}
                      fontSize={12}
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
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
          ) : null}
        </div>
      </section>
    </div>
  );
}
