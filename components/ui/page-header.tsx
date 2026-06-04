interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function PageHeader({ title, subtitle, meta, trailing }: PageHeaderProps) {
  return (
    <header className="mb-8 sm:mb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[rgb(var(--muted))] sm:mt-2">
              {subtitle}
            </p>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {meta && (
        <div className="mt-3 text-xs text-[rgb(var(--muted))]">{meta}</div>
      )}
    </header>
  );
}
