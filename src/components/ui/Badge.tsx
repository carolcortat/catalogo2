import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "success" | "danger" | "neutral" | "brand";

const tones: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-black/5 text-foreground",
  brand: "bg-brand/10 text-brand",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
