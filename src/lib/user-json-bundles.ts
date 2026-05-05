import type { UserRow } from "lib/user-movie-data";

type UserJsonModule = { default: UserRow[] };

const modules = import.meta.glob<UserJsonModule>("../../users/*.json", { eager: true });

export type UserBundle = { slug: string; rows: UserRow[] };

function slugFromGlobPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.json$/i, "");
}

export function listUserBundles(): UserBundle[] {
  const out: UserBundle[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    out.push({ slug: slugFromGlobPath(path), rows: mod.default });
  }
  return out.slice().sort((a, b) =>
    a.slug.localeCompare(b.slug, undefined, { sensitivity: "base" }),
  );
}
