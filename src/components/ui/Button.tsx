import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-contrast hover:brightness-95 active:brightness-90",
  secondary:
    "bg-surface text-foreground border border-line hover:bg-black/5 active:bg-black/10",
  ghost: "bg-transparent text-foreground hover:bg-black/5 active:bg-black/10",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  // Verde escuro: texto branco com contraste de 5:1 (o verde oficial claro não atinge o mínimo AA)
  whatsapp: "bg-[#15803d] text-white hover:bg-[#166534] active:bg-[#14532d]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-base gap-2",
  lg: "h-14 px-6 text-lg gap-2.5",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: Pick<ButtonProps, "variant" | "size" | "fullWidth" | "className">) {
  return clsx(
    "inline-flex select-none items-center justify-center rounded-xl font-semibold transition",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  loading,
  fullWidth,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
