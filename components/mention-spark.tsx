"use client";

/**
 * 종목별 시간버킷 mention count 스파크라인. recharts LineChart.
 * stroke 는 rgb(var(--accent)) → 핑크.
 */
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  hourBucket: string; // ISO
  count: number;
}

export function MentionSpark({ data, height = 60 }: { data: Point[]; height?: number }) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-[rgb(var(--muted))]">데이터 없음</div>;
  }
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="hourBucket" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize: 11, padding: "4px 8px" }}
            labelFormatter={(v) => new Date(v as string).toLocaleString("ko-KR", { hour12: false })}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="rgb(236 72 153)"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
