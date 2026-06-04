import { Card } from "./card";

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
}

export function Tile({ label, value, sub, trend }: TileProps) {
  const trendClass =
    trend === "up"
      ? "text-[rgb(var(--up))]"
      : trend === "down"
        ? "text-[rgb(var(--down))]"
        : "text-[rgb(var(--muted))]";

  return (
    <Card padding="md">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </div>
      {sub && <div className={`mt-1 text-[11px] ${trendClass}`}>{sub}</div>}
    </Card>
  );
}
