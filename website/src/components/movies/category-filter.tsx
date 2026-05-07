import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { mergeTailwindClasses } from "lib/utils";

type CategoryFilterProps = {
  categories: readonly string[];
  selected: ReadonlySet<string>;
  onToggle: (category: string) => void;
} & Pick<ComponentProps<"div">, "className">;

export function CategoryFilter({ categories, selected, onToggle, className }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (categories.length === 0) {
    return (
      <div
        className={mergeTailwindClasses(
          "table-elevated-surface flex h-10 list-none items-center rounded-md px-3 text-sm text-muted-foreground",
          "pointer-events-none opacity-60 sm:w-64",
          className,
        )}
        aria-label="Filter by category"
        title="No categories yet"
      >
        Filter by category
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={mergeTailwindClasses("flex flex-col sm:w-64", className)}
    >
      <details
        className="relative"
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary
          className={mergeTailwindClasses(
            "table-elevated-surface flex h-10 cursor-pointer list-none items-center rounded-md px-3 text-sm",
            "marker:hidden [&::-webkit-details-marker]:hidden",
          )}
          aria-label="Filter by category"
        >
          <span className="text-muted-foreground">
            {selected.size === 0 ? "Filter by category" : `${selected.size} selected`}
          </span>
        </summary>
        <div
          className={mergeTailwindClasses(
            "table-elevated-surface absolute right-0 z-10 mt-1 max-h-64 min-w-full hide-scrollbar overflow-auto rounded-md p-2 text-foreground",
          )}
        >
          {categories.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.has(category)}
                onChange={() => onToggle(category)}
                className="rounded border border-muted-foreground/48 dark:border-muted-foreground/52"
              />
              {category}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
