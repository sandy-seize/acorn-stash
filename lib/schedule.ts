/**
 * 예약 다음 실행시각 계산 (KST 기준). cron 이 nextRunAt<=now 인 예약을 실행.
 */
export type ScheduleKind = "weekly" | "daily" | "once";

export interface ScheduleSpec {
  weekday?: number; // 0=일 .. 6=토 (weekly)
  hour?: number; // 0-23
  minute?: number; // 0-59
  datetimeIso?: string; // once
}

const KST = 9 * 3600 * 1000;

export function computeNextRunAt(kind: ScheduleKind, spec: ScheduleSpec, from: Date = new Date()): Date | null {
  if (kind === "once") {
    if (!spec.datetimeIso) return null;
    const d = new Date(spec.datetimeIso);
    return d.getTime() > from.getTime() ? d : null;
  }
  const hour = spec.hour ?? 9;
  const minute = spec.minute ?? 0;
  // from 을 KST 벽시계로 환산
  const k = new Date(from.getTime() + KST);
  // 오늘(KST) hour:minute 의 UTC ms
  let cand = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate(), hour, minute, 0) - KST;

  if (kind === "daily") {
    if (cand <= from.getTime()) cand += 24 * 3600 * 1000;
    return new Date(cand);
  }
  // weekly
  const targetDow = spec.weekday ?? 1; // 기본 월요일
  const curDow = k.getUTCDay(); // KST 요일
  const addDays = (targetDow - curDow + 7) % 7;
  let c = cand + addDays * 24 * 3600 * 1000;
  if (c <= from.getTime()) c += 7 * 24 * 3600 * 1000;
  return new Date(c);
}

export const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function describeSchedule(kind: ScheduleKind, spec: ScheduleSpec): string {
  const hh = String(spec.hour ?? 9).padStart(2, "0");
  const mm = String(spec.minute ?? 0).padStart(2, "0");
  if (kind === "once") {
    if (!spec.datetimeIso) return "일시 미지정";
    const d = new Date(spec.datetimeIso);
    const k = new Date(d.getTime() + KST);
    return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, "0")}-${String(k.getUTCDate()).padStart(2, "0")} ${String(k.getUTCHours()).padStart(2, "0")}:${String(k.getUTCMinutes()).padStart(2, "0")} (1회)`;
  }
  if (kind === "daily") return `매일 ${hh}:${mm}`;
  return `매주 ${WEEKDAY_KO[spec.weekday ?? 1]} ${hh}:${mm}`;
}
