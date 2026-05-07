import { mergeTailwindClasses } from "lib/utils";

type CategoryBadgeProps = {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
};

export function CategoryBadge({ label, selected = false, onToggle }: CategoryBadgeProps) {
  const className = mergeTailwindClasses(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-normal leading-none",
    "text-foreground transition-colors",
    !selected &&
      "border-muted-foreground/48 bg-muted dark:border-muted-foreground/52 dark:bg-muted",
    selected &&
      "border-muted-foreground/72 bg-muted-foreground/20 dark:border-muted-foreground/76 dark:bg-muted-foreground/26",
    onToggle &&
      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    onToggle &&
      !selected &&
      "hover:border-muted-foreground/58 hover:bg-muted-foreground/12 dark:hover:border-muted-foreground/62 dark:hover:bg-muted-foreground/16",
    onToggle &&
      selected &&
      "hover:bg-muted-foreground/26 dark:hover:bg-muted-foreground/32",
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={
          selected
            ? `Remove genre filter ${label}`
            : `Add genre filter ${label}`
        }
        className={className}
      >
        {label}
      </button>
    );
  }

  return <span className={className}>{label}</span>;
}
