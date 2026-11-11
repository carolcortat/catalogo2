import type { InputHTMLAttributes, ReactNode } from "react";

interface OptionCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  icon?: ReactNode;
}

/** Opção de escolha única em formato de cartão grande (acessível por teclado e leitor de tela). */
export function OptionCard({ label, description, icon, ...inputProps }: OptionCardProps) {
  return (
    <label className="relative block cursor-pointer">
      <input type="radio" className="peer sr-only" {...inputProps} />
      <span className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3 transition hover:bg-black/5 peer-checked:border-brand peer-checked:bg-brand/10 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30">
        {icon && <span className="shrink-0 text-brand">{icon}</span>}
        <span className="flex flex-col">
          <span className="font-semibold">{label}</span>
          {description && <span className="text-sm text-muted">{description}</span>}
        </span>
      </span>
    </label>
  );
}
