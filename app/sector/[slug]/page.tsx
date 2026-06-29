/**
 * /sector/[slug] — 섹터 리서치 상세 (대분류 Sector Research > 중분류).
 * 현재는 스캐폴드(개요 + 준비중 안내). 리서치 콘텐츠는 추후 채움.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageHeader, Section } from "@/components/ui";
import { SECTORS, getSector } from "@/lib/sectors";

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

      <Section>
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[rgb(var(--border-strong))] p-8 text-center">
          <div className="text-2xl">{sector.emoji}</div>
          <p className="mt-3 text-sm font-semibold">{sector.label} 리서치 준비 중</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            밸류체인·핵심 종목·투자 포인트를 정리해 이 페이지에 채울 예정입니다.
          </p>
        </div>
      </Section>

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
