import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CompareLegend,
  CompareTooltip,
  StackedCompareBars,
  TagChips,
} from "components/charts/stacked-compare-chart-parts";
import { USER_BUNDLES } from "lib/app-data";
import {
  useAnchorTagChartRows,
  useGenreCounts,
  useHomeChartScope,
} from "lib/home-chart-queries";

type GenreBreakdownPageProps = {
  activeSlug: string;
};

export function GenreBreakdownPage({ activeSlug }: GenreBreakdownPageProps) {
  const [anchorTag, setAnchorTag] = useState<string | null>(null);
  const { allCategories, scopeWithUser } = useHomeChartScope();
  const tagAvgChartData = useAnchorTagChartRows(anchorTag, allCategories, scopeWithUser, activeSlug);
  const genreCounts = useGenreCounts();

  const tagAvgChartHeight = Math.min(520, Math.max(200, tagAvgChartData.length * 32));
  const genreBarHeight = Math.min(480, Math.max(200, genreCounts.length * 30));

  const onAnchorToggle = useCallback((tag: string) => {
    setAnchorTag((prev) => (prev === tag ? null : tag));
  }, []);

  const onPairToggle = useCallback(() => {}, []);
  const emptyPair = useMemo(() => [], []);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-8 px-3 py-5 text-foreground sm:gap-10 sm:px-6 sm:py-6">
      {USER_BUNDLES.length === 0 ? (
        <p className="text-muted-foreground">No user profiles found in users/*.json.</p>
      ) : null}

      <section aria-label="Genre Ratings">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Genre Ratings</h2>
          <div className="max-h-40 overflow-y-auto hide-scrollbar">
            <TagChips
              tags={allCategories}
              singleSelected={anchorTag}
              pairSelected={emptyPair}
              onAnchorToggle={onAnchorToggle}
              onPairToggle={onPairToggle}
              mode="anchor"
            />
          </div>
          <div className="w-full min-w-0 pt-0" style={{ height: tagAvgChartHeight }}>
            {anchorTag == null ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Select a tag to load the chart.
              </p>
            ) : tagAvgChartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No ratings in this scope for titles with that tag.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={tagAvgChartData}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-border"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={136}
                    tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <Tooltip content={CompareTooltip} cursor={false} />
                  <Legend content={() => <CompareLegend />} wrapperStyle={{ fontSize: "14px" }} />
                  <StackedCompareBars />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

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
