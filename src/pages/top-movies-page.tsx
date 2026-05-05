import { useCallback, useState } from "react";
import {
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
import { useHomeChartScope, useTopFilmsBarRows } from "lib/home-chart-queries";

type TopMoviesPageProps = {
  activeSlug: string;
};

export function TopMoviesPage({ activeSlug }: TopMoviesPageProps) {
  const [pairTags, setPairTags] = useState<string[]>([]);
  const { allCategories, scopeWithUser } = useHomeChartScope();
  const topFilmsBarData = useTopFilmsBarRows(pairTags, scopeWithUser, activeSlug);

  const onAnchorToggle = useCallback(() => {}, []);

  const onPairToggle = useCallback((tag: string) => {
    setPairTags((prev) => {
      const i = prev.indexOf(tag);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      if (prev.length < 2) return [...prev, tag];
      return [prev[0]!, tag];
    });
  }, []);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-8 px-3 py-5 text-foreground sm:gap-10 sm:px-6 sm:py-6">
      {USER_BUNDLES.length === 0 ? (
        <p className="text-muted-foreground">No user profiles found in users/*.json.</p>
      ) : null}

      <section aria-label="Movie ratings by genre">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Movie ratings by genre</h2>
          <div className="max-h-40 overflow-y-auto hide-scrollbar">
            <TagChips
              tags={allCategories}
              singleSelected={null}
              pairSelected={pairTags}
              onAnchorToggle={onAnchorToggle}
              onPairToggle={onPairToggle}
              mode="pair"
            />
          </div>
          <div className="h-[min(52dvh,22rem)] w-full min-w-0 sm:h-[min(56dvh,26rem)]">
            {pairTags.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Select at least one tag.
              </p>
            ) : topFilmsBarData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No rated titles in this scope with those tags together.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topFilmsBarData}
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
                    width={164}
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
    </div>
  );
}
