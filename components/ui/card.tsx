import { type HTMLAttributes } from "react";

type Variant = "default" | "subtle" | "dashed";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: "sm" | "md" | "lg";
}

const VARIANT: Record<Variant, string> = {
  default: "border-[rgb(var(--border))] bg-[rgb(var(--background))]",
  subtle: "border-[rgb(var(--border))] bg-[rgb(var(--surface))]",
  dashed: "border-dashed border-[rgb(var(--border))] bg-transparent opacity-70",
};

const PADDING = { sm: "p-3", md: "p-4 sm:p-5", lg: "p-5 sm:p-6" };

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border ${VARIANT[variant]} ${PADDING[padding]} ${className}`}
      {...rest}
    />
  );
}
