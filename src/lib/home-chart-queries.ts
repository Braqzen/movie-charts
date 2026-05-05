import { useMemo } from "react";
import { MOVIES_CATALOG, USER_BUNDLES, allCatalogCategories, catalogById } from "lib/app-data";
import {
  catalogIdsInHomeScope,
  flattenUserRowsInScopeWithUser,
  genreMovieCountsForScopeTitles,
  tagAvgStackRowsForAnchorPlusTag,
  topMoviesByAvgRatingForTagsWithStack,
} from "lib/home-stats";

export const HOME_CATEGORY_MATCH = "all" as const;
export const ALL_TITLES_CATEGORY_FILTER = new Set<string>();

export function averageDeltaBar(
  myAvg: number | null,
  allUsersAvg: number,
): {
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

export function useHomeChartScope() {
  const allCategories = useMemo(() => allCatalogCategories(), []);

  const scopeIds = useMemo(
    () => catalogIdsInHomeScope(MOVIES_CATALOG, ALL_TITLES_CATEGORY_FILTER, HOME_CATEGORY_MATCH),
    [],
  );

  const scopeWithUser = useMemo(
    () => flattenUserRowsInScopeWithUser(USER_BUNDLES, scopeIds),
    [scopeIds],
  );

  return { allCategories, scopeWithUser };
}

export function useAnchorTagChartRows(
  anchorTag: string | null,
  allCategories: readonly string[],
  scopeWithUser: ReturnType<typeof flattenUserRowsInScopeWithUser>,
  activeSlug: string,
) {
  return useMemo(() => {
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
}

export function useTopFilmsBarRows(
  pairTags: readonly string[],
  scopeWithUser: ReturnType<typeof flattenUserRowsInScopeWithUser>,
  activeSlug: string,
) {
  const topFilmsForPair = useMemo(
    () =>
      topMoviesByAvgRatingForTagsWithStack(catalogById, scopeWithUser, pairTags, activeSlug, 12),
    [scopeWithUser, pairTags, activeSlug],
  );

  return useMemo(
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
}

export function useGenreCounts() {
  return useMemo(
    () =>
      genreMovieCountsForScopeTitles(
        MOVIES_CATALOG,
        ALL_TITLES_CATEGORY_FILTER,
        HOME_CATEGORY_MATCH,
      ),
    [],
  );
}
