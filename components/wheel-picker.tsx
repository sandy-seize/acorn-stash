"use client";

import { useEffect, useRef } from "react";

const ITEM_H = 34;

export interface WheelOption {
  value: number;
  label: string;
}

/** iOS 스타일 스크롤 휠 피커. 가운데 정렬된 항목이 선택값. */
export function WheelPicker({
  options,
  value,
  onChange,
  width = 64,
  ariaLabel,
}: {
  options: WheelOption[];
  value: number;
  onChange: (v: number) => void;
  width?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    const el = ref.current;
    if (el && Math.abs(el.scrollTop - idx * ITEM_H) > 2) el.scrollTop = idx * ITEM_H;
  }, [idx]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const i = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
      if (options[i] && options[i].value !== value) onChange(options[i].value);
    }, 110);
  }

  return (
    <div style={{ position: "relative", width, height: ITEM_H * 3 }} aria-label={ariaLabel}>
      <div
        style={{ position: "absolute", top: ITEM_H, height: ITEM_H, left: 0, right: 0, pointerEvents: "none" }}
        className="rounded-md border-y border-[rgb(var(--border-strong))] bg-[rgb(var(--accent)/0.06)]"
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar"
        style={{ height: ITEM_H * 3, overflowY: "scroll", scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: ITEM_H }} />
        {options.map((o, i) => (
          <div
            key={o.value}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            className={`flex items-center justify-center text-sm tabular-nums ${
              i === idx ? "font-bold text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"
            }`}
          >
            {o.label}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}
