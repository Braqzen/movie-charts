import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { MOVIES_CATALOG, USER_BUNDLES, allCatalogCategories, catalogById } from "lib/app-data";
import {
  catalogIdsInHomeScope,
  flattenUserRowsInScopeWithUser,
  genreMovieCountsForScopeTitles,
  tagAvgStackRowsForAnchorPlusTag,
  topMoviesByAvgRatingForTagsWithStack,
} from "lib/home-stats";
import { mergeTailwindClasses } from "lib/utils";

const HOME_CATEGORY_MATCH = "all" as const;

const chipBase =
  "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const chipActive =
  "border-muted-foreground/72 bg-muted-foreground/20 text-foreground dark:border-muted-foreground/76 dark:bg-muted-foreground/26 hover:bg-muted-foreground/26 dark:hover:bg-muted-foreground/32";
const chipIdle =
  "border-muted-foreground/48 bg-muted text-muted-foreground dark:border-muted-foreground/52 dark:bg-muted hover:border-muted-foreground/58 hover:bg-muted-foreground/12 dark:hover:border-muted-foreground/62 dark:hover:bg-muted-foreground/16 hover:text-foreground";

function TagChips({
  tags,
  singleSelected,
  pairSelected,
  onAnchorToggle,
  onPairToggle,
  mode,
}: {
  tags: readonly string[];
  singleSelected: string | null;
  pairSelected: readonly string[];
  onAnchorToggle: (tag: string) => void;
  onPairToggle: (tag: string) => void;
  mode: "anchor" | "pair";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isAnchor = mode === "anchor" && singleSelected === tag;
        const inPair = pairSelected.includes(tag);
        const active = mode === "anchor" ? isAnchor : inPair;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => {
              if (mode === "anchor") onAnchorToggle(tag);
              else onPairToggle(tag);
            }}
            className={mergeTailwindClasses(chipBase, active ? chipActive : chipIdle)}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

type HomePageProps = {
  activeSlug: string;
};

const ALL_TITLES_CATEGORY_FILTER = new Set<string>();

function averageDeltaBar(myAvg: number | null, allUsersAvg: number): {
  baseAvg: number;
  extraAvg: number;
  baseFill: string;
  extraFill: string;
} {
  const meFill = "var(--chart-stack-first)";
  const allUsersFill = "var(--chart-stack-second)";
  if (myAvg == null) {
    return { baseAvg: allUsersAvg, extraAvg: 0, baseFill: allUsersFill, extraFill: meFill };
  }
  if (myAvg <= allUsersAvg) {
    return {
      baseAvg: myAvg,
      extraAvg: allUsersAvg - myAvg,
      baseFill: meFill,
      extraFill: allUsersFill,
    };
  }
  return {
    baseAvg: allUsersAvg,
    extraAvg: myAvg - allUsersAvg,
    baseFill: allUsersFill,
    extraFill: meFill,
  };
}

export function HomePage({ activeSlug }: HomePageProps) {
  const [anchorTag, setAnchorTag] = useState<string | null>(null);
  const [pairTags, setPairTags] = useState<string[]>([]);

  const allCategories = useMemo(() => allCatalogCategories(), []);

  const scopeIds = useMemo(
    () => catalogIdsInHomeScope(MOVIES_CATALOG, ALL_TITLES_CATEGORY_FILTER, HOME_CATEGORY_MATCH),
    [],
  );

  const scopeWithUser = useMemo(
    () => flattenUserRowsInScopeWithUser(USER_BUNDLES, scopeIds),
    [scopeIds],
  );

  const tagAvgChartData = useMemo(() => {
    if (anchorTag == null) return [];
    return tagAvgStackRowsForAnchorPlusTag(
      anchorTag,
      MOVIES_CATALOG,
      allCategories,
      scopeWithUser,
      activeSlug,
    ).map((r) => {
      const bar = averageDeltaBar(r.myAvg, r.pooledAvg);
      return {
        name: r.tag,
        ...bar,
        allUsersAvgRaw: r.pooledAvg,
        ratingCount: r.ratingCount,
        userRatingCount: r.userRatingCount,
        myAvgRaw: r.myAvg,
      };
    });
  }, [anchorTag, allCategories, scopeWithUser, activeSlug]);

  const tagAvgChartHeight = Math.min(520, Math.max(200, tagAvgChartData.length * 32));

  const topFilmsForPair = useMemo(
    () =>
      topMoviesByAvgRatingForTagsWithStack(catalogById, scopeWithUser, pairTags, activeSlug, 12),
    [scopeWithUser, pairTags, activeSlug],
  );

  const topFilmsBarData = useMemo(
    () =>
      topFilmsForPair.map((m) => {
        const bar = averageDeltaBar(m.myAvg, m.avgRating);
        return {
          name: m.name.length > 42 ? `${m.name.slice(0, 40)}…` : m.name,
          ...bar,
          allUsersAvgRaw: m.avgRating,
          ratingCount: m.ratingCount,
          userRatingCount: m.userRatingCount,
          myAvgRaw: m.myAvg,
        };
      }),
    [topFilmsForPair],
  );

  const genreCounts = useMemo(
    () =>
      genreMovieCountsForScopeTitles(
        MOVIES_CATALOG,
        ALL_TITLES_CATEGORY_FILTER,
        HOME_CATEGORY_MATCH,
      ),
    [],
  );

  const genreBarHeight = Math.min(480, Math.max(200, genreCounts.length * 30));

  const onAnchorToggle = useCallback((tag: string) => {
    setAnchorTag((prev) => (prev === tag ? null : tag));
  }, []);

  const onPairToggle = useCallback((tag: string) => {
    setPairTags((prev) => {
      const i = prev.indexOf(tag);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      if (prev.length < 2) return [...prev, tag];
      return [prev[0]!, tag];
    });
  }, []);

  const compareTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || payload == null || payload.length === 0) return null;
    const row = payload[0]?.payload as
      | {
          allUsersAvgRaw: number;
          ratingCount: number;
          myAvgRaw: number | null;
          userRatingCount: number;
        }
      | undefined;
    if (row == null) return null;
    const title = label == null ? "" : String(label);
    const youLine =
      row.myAvgRaw == null
        ? "You: no rating here"
        : `You: ${row.myAvgRaw} (${row.userRatingCount} rating${row.userRatingCount === 1 ? "" : "s"})`;
    return (
      <div className="rounded-md border border-border bg-card px-2.5 py-2 text-sm shadow-sm">
        <div className="font-medium text-foreground">{title}</div>
        <div className="mt-1 text-muted-foreground">
          Everyone: {row.allUsersAvgRaw} ({row.ratingCount} rating
          {row.ratingCount === 1 ? "" : "s"})
        </div>
        <div className="text-muted-foreground">{youLine}</div>
      </div>
    );
  };

  const compareLegend = () => (
    <div className="flex justify-center gap-4 text-sm">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-[var(--chart-stack-first)]" />
        You
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-[var(--chart-stack-second)]" />
        Everyone
      </span>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[min(118rem,calc(100vw-1rem))] flex-1 flex-col gap-8 px-3 py-5 text-foreground sm:gap-10 sm:px-6 sm:py-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Home</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Tag charts below use every title in the library.
        </p>
      </div>

      {USER_BUNDLES.length === 0 ? (
        <p className="text-muted-foreground">No user profiles found in users/*.json.</p>
      ) : null}

      <section aria-label="Rating by Genre">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Rating by Genre</h2>
          <p className="text-sm text-muted-foreground">Click a genre to see the average ratings.</p>
          <div className="max-h-40 overflow-y-auto hide-scrollbar">
            <TagChips
              tags={allCategories}
              singleSelected={anchorTag}
              pairSelected={pairTags}
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
                  <Tooltip content={compareTooltip} cursor={false} />
                  <Legend content={compareLegend} wrapperStyle={{ fontSize: "14px" }} />
                  <Bar
                    dataKey="baseAvg"
                    name="Base"
                    stackId="cmp"
                    radius={[0, 0, 0, 0]}
                  >
                    {tagAvgChartData.map((entry) => (
                      <Cell key={`tag-base-${entry.name}`} fill={entry.baseFill} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="extraAvg"
                    name="Extra"
                    stackId="cmp"
                    radius={[0, 4, 4, 0]}
                  >
                    {tagAvgChartData.map((entry) => (
                      <Cell key={`tag-extra-${entry.name}`} fill={entry.extraFill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Top films by tag">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">
            Top average rated films by tag
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick up to two tags. Every selected tag must appear on the title, together. After two
            picks, choosing another tag drops the second. Click a selected tag again to remove it.
          </p>
          {pairTags.length > 0 ? (
            <p className="text-xs text-muted-foreground">Selected: {pairTags.join(" + ")}</p>
          ) : null}
          <div className="max-h-40 overflow-y-auto hide-scrollbar">
            <TagChips
              tags={allCategories}
              singleSelected={anchorTag}
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
                  <Tooltip content={compareTooltip} cursor={false} />
                  <Legend content={compareLegend} wrapperStyle={{ fontSize: "14px" }} />
                  <Bar
                    dataKey="baseAvg"
                    name="Base"
                    stackId="cmp"
                    radius={[0, 0, 0, 0]}
                  >
                    {topFilmsBarData.map((entry) => (
                      <Cell key={`film-base-${entry.name}`} fill={entry.baseFill} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="extraAvg"
                    name="Extra"
                    stackId="cmp"
                    radius={[0, 4, 4, 0]}
                  >
                    {topFilmsBarData.map((entry) => (
                      <Cell key={`film-extra-${entry.name}`} fill={entry.extraFill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Genre tag counts">
        <div className="table-elevated-surface space-y-4 rounded-xl p-3 text-card-foreground sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Genre tag counts</h2>
          <p className="text-sm text-muted-foreground">
            For each tag, how many titles list it. Titles with several tags count toward every tag
            they carry.
          </p>
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
