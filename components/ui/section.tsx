interface SectionProps {
  title?: string;
  caption?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, caption, trailing, children, className = "" }: SectionProps) {
  return (
    <section className={`mb-8 sm:mb-10 ${className}`}>
      {(title || trailing || caption) && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          {title && <h2 className="text-base font-semibold sm:text-lg">{title}</h2>}
          {trailing && <div>{trailing}</div>}
          {caption && (
            <span className="text-[11px] text-[rgb(var(--muted))] sm:text-xs">
              {caption}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
