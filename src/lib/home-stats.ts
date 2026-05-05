import { movieMatchesCategorySelection } from "lib/category-match";
import { normalizeRatingStep, RATING_STEPS, ratingLabel } from "lib/rating-buckets";
import type { UserBundle } from "lib/user-json-bundles";
import type { MovieCatalogRow, UserRow } from "lib/user-movie-data";
import type { CategoryTagMatchMode } from "lib/use-filtered-movies";

export type RatingBinRow = { rating: number; label: string; count: number };

export function catalogIdsInHomeScope(
  catalog: readonly MovieCatalogRow[],
  selectedCategories: ReadonlySet<string>,
  categoryTagMatchMode: CategoryTagMatchMode,
): Set<number> {
  const ids = new Set<number>();
  for (const row of catalog) {
    if (
      movieMatchesCategorySelection(
        row.categories,
        selectedCategories,
        categoryTagMatchMode,
      )
    ) {
      ids.add(row.id);
    }
  }
  return ids;
}

export function flattenUserRowsInScope(
  bundles: readonly UserBundle[],
  scopeIds: ReadonlySet<number>,
): UserRow[] {
  const out: UserRow[] = [];
  for (const bundle of bundles) {
    for (const row of bundle.rows) {
      if (scopeIds.has(row.id)) out.push(row);
    }
  }
  return out;
}

export type ScopedUserRow = { slug: string; row: UserRow };

export function flattenUserRowsInScopeWithUser(
  bundles: readonly UserBundle[],
  scopeIds: ReadonlySet<number>,
): ScopedUserRow[] {
  const out: ScopedUserRow[] = [];
  for (const bundle of bundles) {
    for (const row of bundle.rows) {
      if (scopeIds.has(row.id)) out.push({ slug: bundle.slug, row });
    }
  }
  return out;
}

export function profileRowsInScope(
  rows: readonly UserRow[],
  scopeIds: ReadonlySet<number>,
): UserRow[] {
  return rows.filter((r) => scopeIds.has(r.id));
}

export function ratingHistogramFromRows(rows: readonly UserRow[]): RatingBinRow[] {
  const counts = new Map<number, number>();
  for (const step of RATING_STEPS) counts.set(step, 0);
  for (const r of rows) {
    const k = normalizeRatingStep(r.rating);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return RATING_STEPS.map((rating) => ({
    rating,
    label: ratingLabel(rating),
    count: counts.get(rating) ?? 0,
  }));
}

export type AggStats = {
  count: number;
  avgRating: number | null;
  likePct: number | null;
};

export function aggregateRatingStats(rows: readonly UserRow[]): AggStats {
  if (rows.length === 0) return { count: 0, avgRating: null, likePct: null };
  const sum = rows.reduce((s, r) => s + r.rating, 0);
  const likes = rows.filter((r) => r.like).length;
  return {
    count: rows.length,
    avgRating: Math.round((sum / rows.length) * 10) / 10,
    likePct: Math.round((likes / rows.length) * 1000) / 10,
  };
}

export type TopMovieRow = {
  id: number;
  name: string;
  avgRating: number;
  ratingCount: number;
};

export function topMoviesByAvgRating(
  catalogById: ReadonlyMap<number, MovieCatalogRow>,
  scopedFlatRows: readonly UserRow[],
  limit: number,
): TopMovieRow[] {
  const byId = new Map<number, { sum: number; count: number }>();
  for (const r of scopedFlatRows) {
    const cur = byId.get(r.id);
    if (cur) {
      cur.sum += r.rating;
      cur.count += 1;
    } else {
      byId.set(r.id, { sum: r.rating, count: 1 });
    }
  }
  const list: TopMovieRow[] = [];
  for (const [id, { sum, count }] of byId) {
    const cat = catalogById.get(id);
    if (cat == null) continue;
    list.push({
      id,
      name: cat.name,
      avgRating: Math.round((sum / count) * 10) / 10,
      ratingCount: count,
    });
  }
  return list
    .toSorted(
      (a, b) =>
        b.avgRating - a.avgRating || b.ratingCount - a.ratingCount || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

export type CategoryMovieCount = { category: string; movieCount: number };

/** Per tag: mean rating across all scoped user rows for titles that include anchorTag and that tag. */
export type TagAvgRatingRow = {
  tag: string;
  avgRating: number;
  ratingCount: number;
};

export function avgRatingRowsForAnchorPlusTag(
  anchorTag: string,
  catalog: readonly MovieCatalogRow[],
  allTagsSorted: readonly string[],
  scopeFlatRows: readonly UserRow[],
): TagAvgRatingRow[] {
  const ratingsByMovie = new Map<number, number[]>();
  for (const r of scopeFlatRows) {
    const list = ratingsByMovie.get(r.id);
    if (list) list.push(r.rating);
    else ratingsByMovie.set(r.id, [r.rating]);
  }

  const out: TagAvgRatingRow[] = [];
  for (const t of allTagsSorted) {
    let sum = 0;
    let ratingCount = 0;
    for (const row of catalog) {
      if (!row.categories.includes(anchorTag) || !row.categories.includes(t)) continue;
      const rs = ratingsByMovie.get(row.id);
      if (rs == null) continue;
      for (const val of rs) {
        sum += val;
        ratingCount += 1;
      }
    }
    if (ratingCount === 0) continue;
    out.push({
      tag: t,
      avgRating: Math.round((sum / ratingCount) * 10) / 10,
      ratingCount,
    });
  }
  return out.toSorted((a, b) =>
    b.avgRating - a.avgRating !== 0
      ? b.avgRating - a.avgRating
      : a.tag.localeCompare(b.tag, undefined, { sensitivity: "base" }),
  );
}

/** Per co-tag: pooled mean, your mean, and everyone else's mean over rating rows. */
export type TagAvgStackRow = {
  tag: string;
  pooledAvg: number;
  myAvg: number | null;
  restAvg: number | null;
  ratingCount: number;
  userRatingCount: number;
  otherRatingCount: number;
};

export function tagAvgStackRowsForAnchorPlusTag(
  anchorTag: string,
  catalog: readonly MovieCatalogRow[],
  allTagsSorted: readonly string[],
  scopedWithUser: readonly ScopedUserRow[],
  activeSlug: string,
): TagAvgStackRow[] {
  const perMovie = new Map<number, { sumU: number; nU: number; sumO: number; nO: number }>();
  for (const { slug, row } of scopedWithUser) {
    const isYou = slug === activeSlug;
    let cur = perMovie.get(row.id);
    if (cur == null) {
      cur = { sumU: 0, nU: 0, sumO: 0, nO: 0 };
      perMovie.set(row.id, cur);
    }
    if (isYou) {
      cur.sumU += row.rating;
      cur.nU += 1;
    } else {
      cur.sumO += row.rating;
      cur.nO += 1;
    }
  }

  const out: TagAvgStackRow[] = [];
  for (const t of allTagsSorted) {
    let sumU = 0;
    let sumO = 0;
    let nU = 0;
    let nO = 0;
    for (const row of catalog) {
      if (!row.categories.includes(anchorTag) || !row.categories.includes(t)) continue;
      const agg = perMovie.get(row.id);
      if (agg == null) continue;
      sumU += agg.sumU;
      sumO += agg.sumO;
      nU += agg.nU;
      nO += agg.nO;
    }
    const n = nU + nO;
    if (n === 0) continue;
    const pooled = (sumU + sumO) / n;
    const pooledAvg = Math.round(pooled * 10) / 10;
    const myAvg = nU > 0 ? Math.round((sumU / nU) * 10) / 10 : null;
    const restAvg = nO > 0 ? Math.round((sumO / nO) * 10) / 10 : null;
    out.push({
      tag: t,
      pooledAvg,
      myAvg,
      restAvg,
      ratingCount: n,
      userRatingCount: nU,
      otherRatingCount: nO,
    });
  }
  return out.toSorted((a, b) =>
    b.pooledAvg - a.pooledAvg !== 0
      ? b.pooledAvg - a.pooledAvg
      : a.tag.localeCompare(b.tag, undefined, { sensitivity: "base" }),
  );
}

export type TopMovieStackRow = TopMovieRow & {
  myAvg: number | null;
  restAvg: number | null;
  userRatingCount: number;
  otherRatingCount: number;
};

export function topMoviesByAvgRatingForTagsWithStack(
  catalogById: ReadonlyMap<number, MovieCatalogRow>,
  scopedWithUser: readonly ScopedUserRow[],
  requiredTags: readonly string[],
  activeSlug: string,
  limit: number,
): TopMovieStackRow[] {
  if (requiredTags.length === 0) return [];

  const idMatches = (id: number): boolean => {
    const row = catalogById.get(id);
    if (row == null) return false;
    return requiredTags.every((t) => row.categories.includes(t));
  };

  const byId = new Map<number, { sumU: number; nU: number; sumO: number; nO: number }>();
  for (const { slug, row } of scopedWithUser) {
    if (!idMatches(row.id)) continue;
    const isYou = slug === activeSlug;
    let cur = byId.get(row.id);
    if (cur == null) {
      cur = { sumU: 0, nU: 0, sumO: 0, nO: 0 };
      byId.set(row.id, cur);
    }
    if (isYou) {
      cur.sumU += row.rating;
      cur.nU += 1;
    } else {
      cur.sumO += row.rating;
      cur.nO += 1;
    }
  }

  const list: TopMovieStackRow[] = [];
  for (const [id, { sumU, nU, sumO, nO }] of byId) {
    const cat = catalogById.get(id);
    if (cat == null) continue;
    const count = nU + nO;
    if (count === 0) continue;
    const pooled = (sumU + sumO) / count;
    const avgRating = Math.round(pooled * 10) / 10;
    const myAvg = nU > 0 ? Math.round((sumU / nU) * 10) / 10 : null;
    const restAvg = nO > 0 ? Math.round((sumO / nO) * 10) / 10 : null;
    list.push({
      id,
      name: cat.name,
      avgRating,
      ratingCount: count,
      myAvg,
      restAvg,
      userRatingCount: nU,
      otherRatingCount: nO,
    });
  }
  return list
    .toSorted(
      (a, b) =>
        b.avgRating - a.avgRating ||
        b.ratingCount - a.ratingCount ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

export function topMoviesByAvgRatingForTags(
  catalogById: ReadonlyMap<number, MovieCatalogRow>,
  scopedFlatRows: readonly UserRow[],
  requiredTags: readonly string[],
  limit: number,
): TopMovieRow[] {
  if (requiredTags.length === 0) return [];

  const idMatches = (id: number): boolean => {
    const row = catalogById.get(id);
    if (row == null) return false;
    return requiredTags.every((t) => row.categories.includes(t));
  };

  const byId = new Map<number, { sum: number; count: number }>();
  for (const r of scopedFlatRows) {
    if (!idMatches(r.id)) continue;
    const cur = byId.get(r.id);
    if (cur) {
      cur.sum += r.rating;
      cur.count += 1;
    } else {
      byId.set(r.id, { sum: r.rating, count: 1 });
    }
  }

  const list: TopMovieRow[] = [];
  for (const [id, { sum, count }] of byId) {
    const cat = catalogById.get(id);
    if (cat == null) continue;
    list.push({
      id,
      name: cat.name,
      avgRating: Math.round((sum / count) * 10) / 10,
      ratingCount: count,
    });
  }
  return list
    .toSorted(
      (a, b) =>
        b.avgRating - a.avgRating || b.ratingCount - a.ratingCount || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

/** Each catalog title in scope contributes once per genre tag it has. */
export function genreMovieCountsForScopeTitles(
  catalog: readonly MovieCatalogRow[],
  selectedCategories: ReadonlySet<string>,
  categoryTagMatchMode: CategoryTagMatchMode,
): CategoryMovieCount[] {
  const counts = new Map<string, number>();
  for (const row of catalog) {
    if (
      !movieMatchesCategorySelection(
        row.categories,
        selectedCategories,
        categoryTagMatchMode,
      )
    ) {
      continue;
    }
    for (const g of row.categories) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([category, movieCount]) => ({ category, movieCount }))
    .toSorted((a, b) =>
      a.category.localeCompare(b.category, undefined, { sensitivity: "base" }),
    );
}
