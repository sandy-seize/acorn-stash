"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WheelPicker, type WheelOption } from "./wheel-picker";
import { describeSchedule, WEEKDAY_KO, type ScheduleKind } from "@/lib/schedule";

interface PaperAccount {
  shares: string;
  avgCost: string;
  cash: string;
  asOf: string;
}
interface ScheduleRow {
  id: number;
  kind: string;
  spec: { weekday?: number; hour?: number; minute?: number; datetimeIso?: string } | null;
  nextRunAt: string | null;
  active: boolean;
}

const HOURS: WheelOption[] = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, "0") }));
const MINUTES: WheelOption[] = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, "0") }));
const WEEKDAYS: WheelOption[] = WEEKDAY_KO.map((w, i) => ({ value: i, label: w }));

export function AutoControls({
  strategyId,
  paper,
  schedules,
}: {
  strategyId: number;
  paper: PaperAccount | null;
  schedules: ScheduleRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 모의계좌 폼
  const [shares, setShares] = useState(paper ? String(Math.round(Number(paper.shares) * 10000) / 10000) : "0");
  const [avgPrice, setAvgPrice] = useState(
    paper && Number(paper.shares) > 0 ? String(Math.round((Number(paper.avgCost) / Number(paper.shares)) * 100) / 100) : "0",
  );
  const [cash, setCash] = useState(paper ? String(Math.round(Number(paper.cash))) : "0");

  // 예약 폼
  const [kind, setKind] = useState<ScheduleKind>("weekly");
  const [weekday, setWeekday] = useState(1);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(30);
  const [onceDt, setOnceDt] = useState("");

  async function savePosition() {
    setBusy(true);
    await fetch("/api/toss/position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyId, shares: Number(shares), avgPrice: Number(avgPrice), cash: Number(cash) }),
    });
    setBusy(false);
    router.refresh();
  }

  async function addSchedule() {
    setBusy(true);
    const spec =
      kind === "once"
        ? { datetimeIso: onceDt ? new Date(onceDt).toISOString() : undefined }
        : kind === "daily"
          ? { hour, minute }
          : { weekday, hour, minute };
    await fetch("/api/toss/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyId, kind, spec }),
    });
    setBusy(false);
    router.refresh();
  }

  async function delSchedule(id: number) {
    setBusy(true);
    await fetch(`/api/toss/schedule?id=${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      {/* 모의계좌 */}
      <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
        <div className="mb-2 text-xs font-bold text-[rgb(var(--pink-900,var(--foreground)))]">📋 내 보유 입력 (모의계좌)</div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="보유수량" value={shares} onChange={setShares} />
          <Field label="평단가" value={avgPrice} onChange={setAvgPrice} />
          <Field label="현금" value={cash} onChange={setCash} />
        </div>
        <button onClick={savePosition} disabled={busy} className="mt-2 w-full rounded-md bg-[rgb(var(--accent))] py-1.5 text-xs font-bold text-white disabled:opacity-50">
          포지션 저장
        </button>
        {paper && (
          <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">
            기준 {new Date(paper.asOf).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 이후 주문만 누적
          </p>
        )}
      </div>

      {/* 예약 */}
      <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
        <div className="mb-2 text-xs font-bold">⏰ 실행 예약</div>
        <div className="mb-2 flex gap-1">
          {(["weekly", "daily", "once"] as ScheduleKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                kind === k ? "bg-[rgb(var(--accent))] text-white" : "bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]"
              }`}
            >
              {k === "weekly" ? "매주" : k === "daily" ? "매일" : "1회"}
            </button>
          ))}
        </div>

        {kind === "once" ? (
          <input
            type="datetime-local"
            value={onceDt}
            onChange={(e) => setOnceDt(e.target.value)}
            className="w-full rounded-md border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-sm"
          />
        ) : (
          <div className="flex items-center justify-center gap-1">
            {kind === "weekly" && <WheelPicker options={WEEKDAYS} value={weekday} onChange={setWeekday} width={48} ariaLabel="요일" />}
            <WheelPicker options={HOURS} value={hour} onChange={setHour} ariaLabel="시" />
            <span className="text-lg font-bold text-[rgb(var(--muted))]">:</span>
            <WheelPicker options={MINUTES} value={minute} onChange={setMinute} ariaLabel="분" />
          </div>
        )}

        <button onClick={addSchedule} disabled={busy} className="mt-2 w-full rounded-md border border-[rgb(var(--accent))] py-1.5 text-xs font-bold text-[rgb(var(--accent))] disabled:opacity-50">
          + 예약 추가
        </button>

        {schedules.length > 0 && (
          <ul className="mt-2 space-y-1">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded bg-[rgb(var(--surface-2))] px-2 py-1 text-[11px]">
                <span>
                  {describeSchedule(s.kind as ScheduleKind, s.spec ?? {})}
                  {s.nextRunAt && s.active && (
                    <span className="ml-1 text-[rgb(var(--muted))]">· 다음 {new Date(s.nextRunAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                  {!s.active && <span className="ml-1 text-[rgb(var(--muted))]">· 완료</span>}
                </span>
                <button onClick={() => delSchedule(s.id)} className="text-[rgb(var(--up))]">삭제</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] text-[rgb(var(--muted))]">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[rgb(var(--border))] bg-white px-2 py-1 text-sm tabular-nums"
      />
    </label>
  );
}
