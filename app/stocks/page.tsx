import Link from "next/link";
import type { Route } from "next";
import { fetchVrLatestSnapshots, type VrTickerRow } from "@/lib/queries";
import {
  formatPrice,
  formatChangePct,
  formatMarketCapNative,
  formatVolume,
  formatMetric,
  formatRelativeTime,
} from "@/lib/format";
import { PageHeader, Section, Tile, Pill, DataTable, Th, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

const REGION_FLAG: Record<string, string> = { KR: "🇰🇷", US: "🇺🇸", HK: "🇭🇰", CN: "🇨🇳" };

export default async function StocksPage() {
  const rows = await fetchVrLatestSnapshots();
  const lastCaptured = rows
    .map((r) => r.captured_at)
    .filter((x): x is string => !!x)
    .sort()
    .reverse()[0];
  const populated = rows.filter((r) => r.price !== null);
  const isSample = rows.some((r) => r.source === "seed");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Link
        href={"/" as Route}
        className="mb-3 inline-block text-xs text-[rgb(var(--muted))] transition hover:text-[rgb(var(--accent))]"
      >
        ← 🌰 도토리 모으기
      </Link>

      <PageHeader
        title="종목 모니터"
        subtitle="관심 종목 가격·등락·시총·거래량을 한눈에"
        meta={<span>업데이트: {formatRelativeTime(lastCaptured)}</span>}
        trailing={isSample ? <Pill tone="warning">SAMPLE DATA</Pill> : undefined}
      />

      {rows.length === 0 ? (
        <Section>
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border-strong))] p-8 text-center text-sm text-[rgb(var(--muted))]">
            아직 종목 데이터가 없어요. <code>npm run seed:vr</code> 로 샘플을 넣거나, 데이터 API를 연결하세요.
          </div>
        </Section>
      ) : (
        <>
          <Section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Tile label="Tracked" value={`${rows.length}`} sub="종목" />
              <Tile label="Coverage" value={`${populated.length}/${rows.length}`} sub="가격 수집" />
              <Tile
                label="Regions"
                value={`${new Set(rows.map((r) => r.region)).size}`}
                sub={`KR ${rows.filter((r) => r.region === "KR").length} · US ${rows.filter((r) => r.region === "US").length}`}
              />
            </div>
          </Section>

          <Section title="Tracked Tickers" caption="네이티브 통화 기준">
            <DataTable>
              <thead>
                <tr>
                  <Th className="w-[40px] min-w-[40px] max-w-[40px] !text-center">#</Th>
                  <Th sticky className="w-[160px] min-w-[160px] max-w-[160px]">Company</Th>
                  <Th numeric>Price</Th>
                  <Th numeric>1D %</Th>
                  <Th numeric>52W L–H</Th>
                  <Th numeric>Mkt Cap</Th>
                  <Th numeric>Volume</Th>
                  <Th numeric>P/E</Th>
                  <Th>Category</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <TickerRowItem key={r.id} row={r} index={i + 1} />
                ))}
              </tbody>
            </DataTable>
          </Section>
        </>
      )}
    </main>
  );
}

function TickerRowItem({ row, index }: { row: VrTickerRow; index: number }) {
  const cur = row.raw_currency ?? "";
  const change = row.change_pct;
  // 국내 관습: 상승=빨강(success 토큰), 하락=파랑(danger 토큰)
  const changeTone = change === null ? "default" : change >= 0 ? "success" : "danger";

  return (
    <tr className="group">
      <Td muted className="w-[40px] min-w-[40px] max-w-[40px] !text-center tabular-nums">{index}</Td>
      <Td sticky className="w-[160px] min-w-[160px] max-w-[160px]">
        <Link href={`/stocks/${encodeURIComponent(row.symbol)}` as Route} className="block">
          <span className="line-clamp-2 whitespace-normal text-sm font-semibold leading-snug underline decoration-dotted decoration-[rgb(var(--muted))] underline-offset-4 group-hover:text-[rgb(var(--accent))] group-hover:decoration-[rgb(var(--accent))]">
            {row.company_name}
            <span aria-hidden className="ml-1 text-xs text-[rgb(var(--muted))] transition group-hover:text-[rgb(var(--accent))]">›</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-[rgb(var(--muted))]">
            <span aria-label={row.region} className="text-sm leading-none">{REGION_FLAG[row.region] ?? row.region}</span>
            <span className="truncate">{row.symbol}</span>
          </span>
        </Link>
      </Td>
      <Td numeric>{formatPrice(row.price, cur)}</Td>
      <Td numeric>
        {change === null ? (
          <span className="text-[rgb(var(--muted))]">—</span>
        ) : (
          <Pill tone={changeTone}>{formatChangePct(change)}</Pill>
        )}
      </Td>
      <Week52Cell low={row.fifty_two_week_low} high={row.fifty_two_week_high} price={row.price} cur={cur} />
      <Td numeric>{formatMarketCapNative(row.market_cap_native, cur)}</Td>
      <Td numeric muted>{formatVolume(row.volume)}</Td>
      <Td numeric>{formatMetric(row.pe_ttm, 2)}</Td>
      <Td muted>{row.category}</Td>
      <Td muted>{row.source}</Td>
    </tr>
  );
}

function Week52Cell({
  low,
  high,
  price,
  cur,
}: {
  low: number | null;
  high: number | null;
  price: number | null;
  cur: string;
}) {
  if (low === null || high === null) {
    return (
      <Td numeric>
        <span className="text-[rgb(var(--muted))]">—</span>
      </Td>
    );
  }
  const span = high - low;
  const pos = span > 0 && price !== null ? Math.min(100, Math.max(0, ((price - low) / span) * 100)) : null;
  return (
    <Td numeric>
      <div className="flex min-w-[96px] flex-col items-end gap-1">
        <span className="font-mono text-[11px] leading-none text-[rgb(var(--muted))]">
          {formatPrice(low, cur)}
          <span className="mx-0.5">–</span>
          {formatPrice(high, cur)}
        </span>
        {pos !== null && (
          <span
            className="relative h-1 w-full overflow-hidden rounded-full bg-[rgb(var(--border-strong))]"
            title={`52주 위치 ${pos.toFixed(0)}%`}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[rgb(var(--accent))]"
              style={{ width: `${pos}%` }}
            />
          </span>
        )}
      </div>
    </Td>
  );
}
