import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boxes } from "lucide-react";
import { CategoryFilter } from "components/movies/category-filter";
import { CategoryMatchModeToggle } from "components/movies/category-match-mode-toggle";
import { TagGraphScene, type PickPayload } from "components/tag-graph/tag-graph-scene";
import { buildTagGraphLayout, type TagGraphLayout } from "lib/tag-graph-layout";
import type { CategoryTagMatchMode } from "lib/use-filtered-movies";
import { mergeTailwindClasses } from "lib/utils";
import type { Movie } from "types/movie";

export type TagGraphVisualizationButtonProps = {
  className?: string;
  filteredMovies: readonly Movie[];
  allCategories: readonly string[];
  selectedCategories: ReadonlySet<string>;
  onToggleCategory: (category: string) => void;
  categoryTagMatchMode: CategoryTagMatchMode;
  onCategoryTagMatchModeChange: (mode: CategoryTagMatchMode) => void;
};

const categoryRowClass =
  "flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm leading-snug transition-colors";

const categoryRowHoverClass =
  "hover:border-muted-foreground/50 hover:bg-muted-foreground/12 dark:hover:border-muted-foreground/55 dark:hover:bg-muted-foreground/16 focus-visible:border-muted-foreground/50 focus-visible:bg-muted-foreground/12 dark:focus-visible:border-muted-foreground/55 dark:focus-visible:bg-muted-foreground/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function selectionStillInLayout(selection: Exclude<PickPayload, null>, layout: TagGraphLayout): boolean {
  if (selection.kind === "hub") {
    return layout.hubs.some((h) => h.tag === selection.tag);
  }
  return layout.movies.some((n) => n.id === selection.node.id);
}

function activePick(selection: PickPayload, layout: TagGraphLayout): PickPayload {
  if (!selection || !selectionStillInLayout(selection, layout)) return null;
  return selection;
}

function TagSidePanel({
  selection,
  layout,
  tagMovieCounts,
  pick,
  allCategories,
  selectedCategories,
  onToggleCategory,
  categoryTagMatchMode,
  onCategoryTagMatchModeChange,
}: {
  selection: PickPayload;
  layout: TagGraphLayout;
  tagMovieCounts: ReadonlyMap<string, number>;
  pick: (payload: PickPayload) => void;
  allCategories: readonly string[];
  selectedCategories: ReadonlySet<string>;
  onToggleCategory: (category: string) => void;
  categoryTagMatchMode: CategoryTagMatchMode;
  onCategoryTagMatchModeChange: (mode: CategoryTagMatchMode) => void;
}) {
  if (!selection) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 text-base leading-relaxed text-muted-foreground">
        <p>
          Drag to rotate, zoom with the wheel, click a label to inspect. Escape or click outside
          exits.
        </p>
        <div className="flex shrink-0 flex-wrap items-end gap-2 text-foreground">
          <CategoryFilter
            categories={allCategories}
            selected={selectedCategories}
            onToggle={onToggleCategory}
            className="min-w-0 flex-1 sm:min-w-[12rem]"
          />
          <CategoryMatchModeToggle
            value={categoryTagMatchMode}
            onChange={onCategoryTagMatchModeChange}
          />
        </div>
      </div>
    );
  }

  if (selection.kind === "hub") {
    const tag = selection.tag;
    const linkedMovies = [
      ...layout.movies.filter((n) => n.tagsUniqueSorted.includes(tag)),
    ].sort((a, b) => a.label.localeCompare(b.label));

    return (
      <div className="flex h-full min-h-0 flex-col gap-5">
        <h2 className="text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          {tag}
        </h2>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="shrink-0 text-base font-medium text-muted-foreground">
            Movies ({linkedMovies.length})
          </p>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-base leading-snug">
            {linkedMovies.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pick({ kind: "movie", node: m })}
                  className={mergeTailwindClasses(
                    categoryRowClass,
                    "w-full cursor-pointer text-left",
                    categoryRowHoverClass,
                  )}
                >
                  <span className="min-w-0 flex-1 font-medium text-foreground">{m.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const node = selection.node;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 text-base">
      <h2 className="shrink-0 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
        {node.label}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="shrink-0 text-base font-medium text-muted-foreground">Categories</p>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {node.tagsUniqueSorted.map((t) => {
            const c = tagMovieCounts.get(t) ?? 0;
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => pick({ kind: "hub", tag: t })}
                  className={mergeTailwindClasses(
                    categoryRowClass,
                    "w-full cursor-pointer text-left",
                    categoryRowHoverClass,
                  )}
                >
                  <span className="min-w-0 flex-1 font-medium text-foreground">{t}</span>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {c} movie{c === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function TagGraphVisualizationButton({
  className,
  filteredMovies,
  allCategories,
  selectedCategories,
  onToggleCategory,
  categoryTagMatchMode,
  onCategoryTagMatchModeChange,
}: TagGraphVisualizationButtonProps) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<PickPayload>(null);
  const sidePanelWrapRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => buildTagGraphLayout(filteredMovies), [filteredMovies]);

  const displaySelection = useMemo(() => activePick(selection, layout), [selection, layout]);

  const pick = useCallback(
    (payload: PickPayload) => {
      setSelection((prev) => {
        const prevActive = activePick(prev, layout);
        if (payload === null) return null;
        if (
          prevActive?.kind === "hub" &&
          payload.kind === "hub" &&
          prevActive.tag === payload.tag
        ) {
          return null;
        }
        if (
          prevActive?.kind === "movie" &&
          payload.kind === "movie" &&
          prevActive.node.id === payload.node.id
        ) {
          return null;
        }
        return payload;
      });
    },
    [layout],
  );

  const closeModal = useCallback(() => {
    setSelection(null);
    setOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setSelection(null);
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
    const timer = window.setTimeout(() => sidePanelWrapRef.current?.focus(), 10);
    return () => window.clearTimeout(timer);
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
        aria-label="Open tag map in 3D"
        title="Browse tags and clusters in 3D"
      >
        <Boxes className="size-5" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="flex h-[min(96dvh,calc(100vh-1.5rem))] w-full max-w-[min(120rem,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg lg:flex-row sm:h-[min(96dvh,calc(100vh-3rem))]"
            role="dialog"
            aria-modal="true"
            aria-label="Tag map"
          >
            <div className="relative flex min-h-[45vh] min-w-0 flex-1 touch-none flex-col border-b border-border lg:min-h-0 lg:flex-[2] lg:border-b-0 lg:border-r lg:border-border">
              <TagGraphScene layout={layout} selected={displaySelection} onPick={pick} />
            </div>
            <aside className="flex min-h-0 w-full flex-1 flex-col border-border bg-muted/35 lg:h-full lg:w-[22rem] lg:flex-none lg:shrink-0 xl:w-[24rem] lg:border-l lg:border-border">
              <div
                ref={sidePanelWrapRef}
                tabIndex={-1}
                className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
              >
                <TagSidePanel
                  selection={displaySelection}
                  layout={layout}
                  tagMovieCounts={layout.tagMovieCount}
                  pick={pick}
                  allCategories={allCategories}
                  selectedCategories={selectedCategories}
                  onToggleCategory={onToggleCategory}
                  categoryTagMatchMode={categoryTagMatchMode}
                  onCategoryTagMatchModeChange={onCategoryTagMatchModeChange}
                />
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
