/**
 * /sector/[slug] — 섹터 리서치 상세 (대분류 Sector Research > 중분류).
 * 현재는 스캐폴드(개요 + 준비중 안내). 리서치 콘텐츠는 추후 채움.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageHeader, Section, Pill } from "@/components/ui";
import { SECTORS, getSector, type SectorStock } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.slug }));
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = getSector(slug);
  if (!sector) notFound();

  const content = sector.content;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Link
        href={"/" as Route}
        className="mb-3 inline-block text-xs text-[rgb(var(--muted))] transition hover:text-[rgb(var(--accent))]"
      >
        ← 🌰 도토리 모으기
      </Link>

      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span aria-hidden>{sector.emoji}</span>
            {sector.label}
          </span>
        }
        subtitle={sector.summary}
        meta={<span>Sector Research</span>}
      />

      {content?.valueChain && content.valueChain.length > 0 && (
        <Section title="밸류체인">
          <div className="flex flex-wrap items-center gap-1.5">
            {content.valueChain.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1.5">
                <span className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-medium">
                  {step}
                </span>
                {i < content.valueChain!.length - 1 && (
                  <span aria-hidden className="text-[rgb(var(--muted))]">
                    ›
                  </span>
                )}
              </span>
            ))}
          </div>
        </Section>
      )}

      {content?.stocks && content.stocks.length > 0 ? (
        <Section title="핵심 종목">
          <div className="flex flex-col gap-4">
            {content.stocks.map((s) => (
              <StockCard key={s.symbol} stock={s} />
            ))}
          </div>
        </Section>
      ) : (
        <Section>
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border-strong))] p-8 text-center">
            <div className="text-2xl">{sector.emoji}</div>
            <p className="mt-3 text-sm font-semibold">{sector.label} 리서치 준비 중</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              밸류체인·핵심 종목·투자 포인트를 정리해 이 페이지에 채울 예정입니다.
            </p>
          </div>
        </Section>
      )}

      <Section title="다른 섹터">
        <div className="flex flex-wrap gap-2">
          {SECTORS.filter((s) => s.slug !== sector.slug).map((s) => (
            <Link
              key={s.slug}
              href={(s.href ?? `/sector/${s.slug}`) as Route}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-medium transition hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]"
            >
              <span aria-hidden>{s.emoji}</span>
              {s.label}
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}

function StockCard({ stock }: { stock: SectorStock }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold sm:text-lg">
          {stock.name}
          {stock.exchange && (
            <span className="ml-2 font-mono text-[11px] font-medium text-[rgb(var(--muted))]">
              {stock.exchange}
            </span>
          )}
        </h3>
        {stock.asOf && <span className="text-[11px] text-[rgb(var(--muted))]">{stock.asOf}</span>}
      </div>

      <p className="mt-1.5 text-sm font-medium text-[rgb(var(--accent))]">{stock.thesis}</p>

      {stock.metrics && stock.metrics.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stock.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2.5"
            >
              <div className="text-[10px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
                {m.label}
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {stock.points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span aria-hidden className="mt-0.5 flex-none text-[rgb(var(--accent))]">
              •
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {stock.risks && stock.risks.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Pill tone="warning">주의</Pill>
          </div>
          <ul className="flex flex-col gap-1.5">
            {stock.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                <span aria-hidden className="mt-0.5 flex-none">
                  ⚠
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stock.sources && stock.sources.length > 0 && (
        <div className="mt-4 border-t border-dashed border-[rgb(var(--border))] pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            출처
          </div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {stock.sources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[rgb(var(--muted))] underline decoration-dotted underline-offset-2 transition hover:text-[rgb(var(--accent))]"
                >
                  {src.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
