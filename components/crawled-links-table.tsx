"use client";

/**
 * Crawled Links 테이블 + 미리보기.
 * - 서버에서 캐시된 link_previews 를 받아 즉시 렌더, 캐시에 없는 URL 은 마운트 후
 *   /api/link-preview 로 일괄 fetch.
 * - Hour Bucket · Mentions 컬럼은 ↑/↓ 토글 정렬. 기본 Hour Bucket DESC.
 */

import { useEffect, useMemo, useState } from "react";
import { DataTable, Th, Td, Pill } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format";

type SourceKey = "google_news" | "reddit" | "x" | "toss_feed" | string;

type PillTone = "default" | "accent" | "success" | "warning" | "danger" | "reddit";

const SOURCE_LABEL: Record<string, string> = {
  google_news: "Google News",
  reddit: "Reddit",
  x: "X",
  toss_feed: "Toss Feed",
};

const SOURCE_TONE: Record<string, PillTone> = {
  google_news: "accent",
  reddit: "reddit",
  x: "default",
  toss_feed: "default",
};

export interface CrawledLinkRow {
  source: SourceKey;
  hourBucket: string; // ISO
  url: string;
  count: number;
}

export interface PreviewMeta {
  title: string | null;
  description: string | null;
  siteName: string | null;
  ogImage: string | null;
  status: string; // 'ok' | 'error'
}

type SortKey = "hourBucket" | "count";
type SortDir = "asc" | "desc";

export function CrawledLinksTable({
  rows,
  initialPreviews,
}: {
  rows: CrawledLinkRow[];
  initialPreviews: Record<string, PreviewMeta>;
}) {
  const [previews, setPreviews] = useState<Record<string, PreviewMeta>>(initialPreviews);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(() => {
    const missing = new Set<string>();
    for (const r of rows) {
      if (!initialPreviews[r.url]) missing.add(r.url);
    }
    return missing;
  });

  const [sortKey, setSortKey] = useState<SortKey>("hourBucket");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const PAGE_SIZE = 100;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "hourBucket") {
        cmp = a.hourBucket.localeCompare(b.hourBucket);
      } else {
        cmp = a.count - b.count;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const missingUrls = useMemo(
    () => rows.map((r) => r.url).filter((u) => !previews[u]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (missingUrls.length === 0) return;
    let cancelled = false;
    const BATCH = 25;
    (async () => {
      for (let i = 0; i < missingUrls.length; i += BATCH) {
        const slice = missingUrls.slice(i, i + BATCH);
        try {
          const res = await fetch("/api/link-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: slice }),
          });
          if (!res.ok) throw new Error(`http_${res.status}`);
          const data = (await res.json()) as { previews: Record<string, PreviewMeta> };
          if (cancelled) return;
          setPreviews((prev) => ({ ...prev, ...data.previews }));
          setLoadingUrls((prev) => {
            const next = new Set(prev);
            for (const u of slice) next.delete(u);
            return next;
          });
        } catch {
          if (cancelled) return;
          setLoadingUrls((prev) => {
            const next = new Set(prev);
            for (const u of slice) next.delete(u);
            return next;
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missingUrls]);

  const visibleRows = sortedRows.slice(0, visibleCount);
  const hasMore = visibleCount < sortedRows.length;
  const remaining = sortedRows.length - visibleCount;

  return (
    <>
      <DataTable>
        <thead>
          <tr>
            <Th className="w-[40px] min-w-[40px] max-w-[40px] !text-center">#</Th>
            <Th>Source</Th>
            <SortHeader
              label={<span className="hidden sm:inline">Mentions</span>}
              active={sortKey === "count"}
              dir={sortDir}
              onClick={() => toggleSort("count")}
              widthClass="w-[40px] min-w-[40px] max-w-[40px] sm:w-[64px] sm:min-w-[64px] sm:max-w-[64px]"
            />
            <Th>Article URL</Th>
            <SortHeader
              label="Hour"
              active={sortKey === "hourBucket"}
              dir={sortDir}
              onClick={() => toggleSort("hourBucket")}
              widthClass="w-[88px] min-w-[88px] max-w-[88px]"
            />
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((r, i) => {
            const meta = previews[r.url];
            const loading = loadingUrls.has(r.url);
            return (
              <tr key={`${r.url}-${i}`}>
                <Td muted className="w-[40px] min-w-[40px] max-w-[40px] !text-center tabular-nums">{i + 1}</Td>
                <Td>
                  <Pill tone={SOURCE_TONE[r.source] ?? "default"}>
                    {SOURCE_LABEL[r.source] ?? r.source}
                  </Pill>
                </Td>
                <Td muted className="w-[40px] min-w-[40px] max-w-[40px] tabular-nums sm:w-[64px] sm:min-w-[64px] sm:max-w-[64px]">
                  {r.count}
                </Td>
                <Td>
                  <TitleCell url={r.url} meta={meta} loading={loading} />
                </Td>
                <Td muted className="w-[88px] min-w-[88px] max-w-[88px]">
                  {formatRelativeTime(r.hourBucket)}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
      {hasMore && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((c) => Math.min(c + PAGE_SIZE, sortedRows.length))
            }
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--accent))]"
          >
            <span aria-hidden>▼</span>
            <span>
              more {Math.min(PAGE_SIZE, remaining)} ({sortedRows.length - remaining}/{sortedRows.length})
            </span>
          </button>
        </div>
      )}
    </>
  );
}

function SortHeader({
  label,
  numeric,
  active,
  dir,
  onClick,
  widthClass,
}: {
  label: React.ReactNode;
  numeric?: boolean;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  widthClass?: string;
}) {
  return (
    <Th numeric={numeric} className={widthClass}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 ${numeric ? "ml-auto" : ""} cursor-pointer transition hover:text-[rgb(var(--foreground))]`}
      >
        {label}
        <SortIcon active={active} dir={dir} />
      </button>
    </Th>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const upClass = active && dir === "asc"
    ? "text-[rgb(var(--foreground))]"
    : "text-[rgb(var(--muted))]/40";
  const downClass = active && dir === "desc"
    ? "text-[rgb(var(--foreground))]"
    : "text-[rgb(var(--muted))]/40";
  return (
    <span className="inline-flex flex-col leading-none">
      <span className={`text-[8px] ${upClass}`}>▲</span>
      <span className={`-mt-0.5 text-[8px] ${downClass}`}>▼</span>
    </span>
  );
}

function TitleCell({
  url,
  meta,
  loading,
}: {
  url: string;
  meta: PreviewMeta | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5" style={{ maxWidth: "420px" }}>
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-[rgb(var(--surface-2))]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[rgb(var(--surface-2))]" />
      </div>
    );
  }

  const title = meta?.title?.trim() || null;
  const description = meta?.description?.trim() || null;
  const siteName = meta?.siteName?.trim() || null;

  if (!title) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate text-xs text-[rgb(var(--muted))] underline decoration-dotted underline-offset-2 hover:text-[rgb(var(--accent))]"
        style={{ maxWidth: "420px" }}
        title={url}
      >
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      style={{ maxWidth: "420px" }}
      title={title}
    >
      <span className="block truncate text-sm font-medium text-[rgb(var(--foreground))] group-hover:text-[rgb(var(--accent))]">
        {title}
      </span>
      {description && (
        <span className="mt-0.5 block truncate text-xs text-[rgb(var(--muted))]">
          {description}
        </span>
      )}
      {siteName && (
        <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">
          {siteName}
        </span>
      )}
    </a>
  );
}
