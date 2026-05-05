import { Bar, Rectangle, type BarShapeProps, type TooltipContentProps } from "recharts";
import { mergeTailwindClasses } from "lib/utils";

const chipBase =
  "table-elevated-surface inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";
const chipActive =
  "!bg-muted-foreground/28 text-foreground ring-2 ring-inset ring-ring dark:!bg-muted-foreground/36";
const chipIdle = "text-muted-foreground hover:!bg-muted/45 hover:text-foreground";

const COMPARE_BAR_BASE_RADIUS: [number, number, number, number] = [0, 0, 0, 0];
const COMPARE_BAR_EXTRA_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

function stackedCompareBarShape(
  fillKey: "baseFill" | "extraFill",
  radius: [number, number, number, number],
) {
  return function StackedCompareBarRectangle(props: BarShapeProps) {
    const row = props.payload as { baseFill?: string; extraFill?: string } | undefined;
    const fill = row?.[fillKey] ?? props.fill;
    return <Rectangle {...props} fill={fill} radius={radius} />;
  };
}

const compareBaseBarShape = stackedCompareBarShape("baseFill", COMPARE_BAR_BASE_RADIUS);
const compareExtraBarShape = stackedCompareBarShape("extraFill", COMPARE_BAR_EXTRA_RADIUS);

export function TagChips({
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

export function CompareTooltip({ active, payload, label }: TooltipContentProps) {
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
}

export function CompareLegend() {
  return (
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
}

export function StackedCompareBars() {
  return (
    <>
      <Bar dataKey="baseAvg" name="Base" stackId="cmp" shape={compareBaseBarShape} />
      <Bar dataKey="extraAvg" name="Extra" stackId="cmp" shape={compareExtraBarShape} />
    </>
  );
}
