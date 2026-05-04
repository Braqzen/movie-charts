import { mergeTailwindClasses } from "lib/utils";

type MovieSearchFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export function MovieSearchField({
  id = "movie-search",
  value,
  onChange,
  label,
  placeholder = "Search by name",
}: MovieSearchFieldProps) {
  const inputClassName = mergeTailwindClasses(
    "table-elevated-surface h-10 w-full min-w-0 rounded-md px-3 text-sm",
    "placeholder:text-muted-foreground outline-none",
    "selection:bg-muted-foreground/20 selection:text-foreground dark:selection:bg-muted-foreground/15",
    "focus-visible:border-muted-foreground/62 focus-visible:ring-2 focus-visible:ring-muted-foreground/30 dark:focus-visible:border-muted-foreground/52 dark:focus-visible:ring-muted-foreground/25",
  );

  return (
    <div
      className={mergeTailwindClasses(
        "flex min-w-0 flex-1 flex-col",
        label != null && label !== "" && "gap-2",
      )}
    >
      {label != null && label !== "" ? (
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={id}>
          {label}
          <input
            id={id}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClassName}
          />
        </label>
      ) : (
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search movies"
          className={inputClassName}
        />
      )}
    </div>
  );
}
