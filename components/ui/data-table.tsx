import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:border-[rgb(var(--border))]">
      <table className="min-w-full whitespace-nowrap text-sm">{children}</table>
    </div>
  );
}

interface CellProps {
  numeric?: boolean;
  muted?: boolean;
  /** 좌측 row-header 셀: 가로 스크롤 시 좌측 고정 + 배경 + 우측 그림자. */
  sticky?: boolean;
  className?: string;
}

const STICKY_TH =
  "sticky left-0 z-20 bg-[rgb(var(--surface))] " +
  "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[rgb(var(--border))] " +
  "after:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.18)]";

const STICKY_TD =
  "sticky left-0 z-10 bg-[rgb(var(--background))] " +
  "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[rgb(var(--border))] " +
  "after:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.18)]";

export function Th({
  children,
  numeric,
  sticky,
  className = "",
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th
      scope="col"
      className={`bg-[rgb(var(--surface))] px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-[rgb(var(--muted))] ${
        numeric ? "text-right" : "text-left"
      } ${sticky ? STICKY_TH : ""} ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  numeric,
  muted,
  sticky,
  className = "",
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td
      className={`border-t border-[rgb(var(--border))] px-3 py-2 ${
        numeric ? "text-right tabular-nums" : ""
      } ${muted ? "text-[rgb(var(--muted))]" : ""} ${sticky ? STICKY_TD : ""} ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}
