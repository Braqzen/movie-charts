import type { CategoryTagMatchMode } from "lib/use-filtered-movies";
import { mergeTailwindClasses } from "lib/utils";

type CategoryMatchModeToggleProps = {
  value: CategoryTagMatchMode;
  onChange: (mode: CategoryTagMatchMode) => void;
};

const segmentBase =
  "cursor-pointer flex size-full items-center justify-center px-3 outline-none transition-colors rounded-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

const segmentInactive =
  "bg-transparent text-muted-foreground hover:bg-muted/45 hover:text-foreground";

const segmentActive = "bg-muted-foreground/28 text-foreground dark:bg-muted-foreground/36";

export function CategoryMatchModeToggle({ value, onChange }: CategoryMatchModeToggleProps) {
  return (
    <div
      className={mergeTailwindClasses(
        "table-elevated-surface grid h-10 min-w-[5.5rem] shrink-0 grid-cols-2 divide-x divide-border overflow-hidden rounded-md text-xs font-semibold tabular-nums tracking-wide",
      )}
      role="radiogroup"
      aria-label="How checked categories combine"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "all"}
        aria-label="AND: movie must include every checked category"
        title="Movie has all checked categories"
        className={mergeTailwindClasses(
          segmentBase,
          value === "all" ? segmentActive : segmentInactive,
        )}
        onClick={() => onChange("all")}
      >
        AND
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "any"}
        aria-label="OR: movie needs at least one checked category"
        title="Movie has at least one checked category"
        className={mergeTailwindClasses(
          segmentBase,
          value === "any" ? segmentActive : segmentInactive,
        )}
        onClick={() => onChange("any")}
      >
        OR
      </button>
    </div>
  );
}
