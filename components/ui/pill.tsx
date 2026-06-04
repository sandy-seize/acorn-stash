type Tone = "default" | "accent" | "success" | "warning" | "danger" | "reddit";

const TONE: Record<Tone, string> = {
  default: "bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]",
  accent: "bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]",
  success: "bg-[rgb(var(--success)/0.12)] text-[rgb(var(--success))]",
  warning: "bg-[rgb(var(--warning)/0.12)] text-[rgb(var(--warning))]",
  danger: "bg-[rgb(var(--danger)/0.12)] text-[rgb(var(--danger))]",
  // Reddit 브랜드 오렌지 (#FF4500) — Reddit source pill 전용
  reddit: "bg-[#FF4500]/15 text-[#FF6314]",
};

export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
