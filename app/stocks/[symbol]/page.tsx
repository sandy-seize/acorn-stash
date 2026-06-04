/**
 * /stocks/[symbol] — 단일 종목 버즈 상세.
 * 언급량(14d) 스파크라인 + 크롤링 링크 테이블. 데이터는 vr_* (seed / 향후 API).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageHeader, Section } from "@/components/ui";
import {
  getVrTickerDetail,
  getVrRecentMentionUrls,
  getVrMentionTimeSeries,
} from "@/lib/sns/queries";
import { MentionSpark } from "@/components/mention-spark";
import { CrawledLinksTable } from "@/components/crawled-links-table";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const REGION_FLAG: Record<string, string> = { KR: "🇰🇷", US: "🇺🇸", HK: "🇭🇰", CN: "🇨🇳" };

export default async function TickerDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);

  const detail = await getVrTickerDetail(symbol);
  if (!detail) notFound();

  const [urls, series] = await Promise.all([
    getVrRecentMentionUrls(symbol, 300),
    getVrMentionTimeSeries(symbol, 14),
  ]);

  const crawledRows = urls.map((u) => ({
    source: u.source,
    hourBucket: u.hourBucket.toISOString(),
    url: u.url,
    count: u.count,
  }));
  const points = series.map((p) => ({
    hourBucket: p.hourBucket.toISOString(),
    count: p.count,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href={"/stocks" as Route}
        className="mb-3 inline-block text-xs text-[rgb(var(--muted))] transition hover:text-[rgb(var(--accent))]"
      >
        ← 종목 모니터
      </Link>

      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span aria-label={detail.region ?? ""}>
              {REGION_FLAG[detail.region ?? ""] ?? detail.region}
            </span>
            <span>{detail.name ?? detail.symbol}</span>
          </span>
        }
        subtitle={<span className="font-mono text-sm text-[rgb(var(--muted))]">{detail.symbol}</span>}
        meta={
          <>
            {detail.sourceUrl && (
              <a
                href={detail.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-[rgb(var(--accent))]"
              >
                시세 페이지 ↗
              </a>
            )}
            {detail.latestChangePct != null && (
              <>
                {" · Latest "}
                <span
                  className={
                    detail.latestChangePct >= 0
                      ? "text-[rgb(var(--up))]"
                      : "text-[rgb(var(--down))]"
                  }
                >
                  {detail.latestChangePct > 0 ? "+" : ""}
                  {detail.latestChangePct.toFixed(2)}%
                </span>
              </>
            )}
            {detail.latestCapturedAt && <>{" · "}{formatRelativeTime(detail.latestCapturedAt)}</>}
          </>
        }
      />

      <Section title="Mentions (14d)" caption="Google News + Reddit 합산, 시간 버킷">
        <div className="px-4">
          <MentionSpark data={points} />
        </div>
      </Section>

      <Section title="Crawled Links" caption={`최근 ${urls.length}개 — 버킷별 sample URL, source 별`}>
        {urls.length === 0 ? (
          <p className="px-4 text-sm text-[rgb(var(--muted))]">
            아직 수집된 링크가 없어요. 데이터 API 연결 후 채워집니다.
          </p>
        ) : (
          <CrawledLinksTable rows={crawledRows} initialPreviews={{}} />
        )}
      </Section>
    </main>
  );
}
