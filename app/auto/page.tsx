/**
 * /auto — 자동매매 대시보드 (dry-run 토대).
 * 안전 상태 + 전략 목록 + 각 전략의 주문 로그. 라이브 연결은 키 도착 후.
 */
import Link from "next/link";
import type { Route } from "next";
import { PageHeader, Section, Pill, DataTable, Th, Td } from "@/components/ui";
import { listStrategies, recentOrders, schedulesFor, paperFor } from "@/lib/toss/queries";
import { loadSafetyConfig } from "@/lib/toss/safety";
import { hasCredentials } from "@/lib/toss/client";
import { AutoControls } from "@/components/auto-controls";
import { PushToggle } from "@/components/push-toggle";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  dry_run: "accent",
  submitted: "success",
  filled: "success",
  blocked: "danger",
  failed: "danger",
  skipped: "default",
};

function won(n: number | string | null) {
  if (n == null) return "—";
  return Math.round(Number(n)).toLocaleString("ko-KR") + "원";
}

export default async function AutoPage() {
  const cfg = loadSafetyConfig();
  const creds = hasCredentials();
  const live = creds && !cfg.dryRun;
  const strategies = await listStrategies();
  const [ordersByStrat, schedulesByStrat, paperByStrat] = await Promise.all([
    Promise.all(strategies.map((s) => recentOrders(s.id))),
    Promise.all(strategies.map((s) => schedulesFor(s.id))),
    Promise.all(strategies.map((s) => paperFor(s.id))),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Link href={"/" as Route} className="mb-3 inline-block text-xs text-[rgb(var(--muted))] transition hover:text-[rgb(var(--accent))]">
        ← 🌰 도토리 모으기
      </Link>

      <PageHeader
        title="자동매매"
        subtitle="VR · 무한매수 · DCA 전략 — Toss OpenAPI 연동 (단계적: 읽기 → 수동 → 자동)"
        trailing={
          live ? <Pill tone="danger">LIVE</Pill> : <Pill tone="warning">DRY-RUN</Pill>
        }
      />

      {/* 안전 상태 */}
      <Section title="안전 상태">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SafetyTile label="모드" value={live ? "LIVE (실주문)" : "DRY-RUN (모의)"} danger={live} />
          <SafetyTile label="자격증명" value={creds ? "연결됨" : "미연결"} danger={false} />
          <SafetyTile label="Kill-switch" value={cfg.killSwitch ? "ON (차단)" : "off"} danger={cfg.killSwitch} />
          <SafetyTile label="일일 한도" value={`${cfg.dailyOrderCap}건 / ${won(cfg.maxOrderAmount)}`} danger={false} />
        </div>
        {!creds && (
          <p className="mt-3 rounded-[var(--radius)] border border-dashed border-[rgb(var(--border-strong))] p-3 text-xs text-[rgb(var(--muted))]">
            Toss OpenAPI 자격증명(TOSS_CLIENT_ID/SECRET) 미연결 — 모든 실행은 <b>모의(dry-run)</b>이며 네트워크·실주문이 발생하지 않습니다.
            키 연결 후에도 <code>TOSS_DRY_RUN=false</code> 로 명시 전환해야 실주문이 가능합니다.
          </p>
        )}
      </Section>

      {/* 알림 */}
      <Section title="알림" caption="자동매매 실행 시 웹 푸시">
        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
          <PushToggle />
        </div>
      </Section>

      {/* 전략 */}
      <Section title="전략" caption={`${strategies.length}개`}>
        {strategies.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border-strong))] p-8 text-center text-sm text-[rgb(var(--muted))]">
            아직 전략이 없어요. <code>npm run demo:dryrun</code> 으로 데모 전략을 만들어보세요.
          </div>
        ) : (
          strategies.map((s, i) => (
            <div key={s.id} className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold">{s.name}</span>
                <Pill tone="accent">{s.kind.toUpperCase()}</Pill>
                <span className="font-mono text-xs text-[rgb(var(--muted))]">{s.symbol} · {s.market}</span>
                <span className="text-xs text-[rgb(var(--muted))]">풀 {won(s.seed)}</span>
                {s.dryRun && <Pill tone="warning">DRY-RUN</Pill>}
              </div>
              <DataTable>
                <thead>
                  <tr>
                    <Th className="w-[48px] !text-center">스텝</Th>
                    <Th>구분</Th>
                    <Th>상태</Th>
                    <Th numeric>금액</Th>
                    <Th>근거</Th>
                  </tr>
                </thead>
                <tbody>
                  {ordersByStrat[i].length === 0 ? (
                    <tr><Td muted className="text-center" colSpan={5}>실행 기록 없음</Td></tr>
                  ) : (
                    ordersByStrat[i].map((o) => {
                      const stepNo = (o.raw as { step?: number } | null)?.step ?? "—";
                      const isOrder = o.status !== "skipped";
                      return (
                        <tr key={o.id}>
                          <Td muted className="!text-center tabular-nums">{stepNo}</Td>
                          <Td>{isOrder ? o.side : "HOLD"}</Td>
                          <Td><Pill tone={STATUS_TONE[o.status] ?? "default"}>{o.status}</Pill></Td>
                          <Td numeric>{o.amount ? won(o.amount) : "—"}</Td>
                          <Td muted className="max-w-[260px] truncate">{o.reason}</Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </DataTable>

              <AutoControls
                strategyId={s.id}
                paper={
                  paperByStrat[i]
                    ? {
                        shares: String(paperByStrat[i]!.shares),
                        avgCost: String(paperByStrat[i]!.avgCost),
                        cash: String(paperByStrat[i]!.cash),
                        asOf: paperByStrat[i]!.asOf.toISOString(),
                      }
                    : null
                }
                schedules={schedulesByStrat[i].map((sc) => ({
                  id: sc.id,
                  kind: sc.kind,
                  spec: (sc.spec ?? {}) as { weekday?: number; hour?: number; minute?: number; datetimeIso?: string },
                  nextRunAt: sc.nextRunAt ? sc.nextRunAt.toISOString() : null,
                  active: sc.active,
                }))}
              />
            </div>
          ))
        )}
      </Section>

      <p className="text-xs text-[rgb(var(--muted))]">
        ⚠️ 자동매매는 실제 자금을 다룹니다. 라이브 전환 전 읽기·수동 단계 검증, dry-run 충분히 확인, 한도·kill-switch 설정을 반드시 거치세요.
      </p>
    </main>
  );
}

function SafetyTile({ label, value, danger }: { label: string; value: string; danger: boolean }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${danger ? "text-[rgb(var(--up))]" : ""}`}>{value}</div>
    </div>
  );
}
