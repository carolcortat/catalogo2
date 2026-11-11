"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { MAX_QUANTITY } from "@/store/cart";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

/** Controle de quantidade com botões grandes (−/+) e digitação direta. */
export function QuantityInput({
  value,
  onChange,
  label = "Quantidade",
  min = 1,
  max = MAX_QUANTITY,
}: QuantityInputProps) {
  // Texto digitado; permite apagar o campo antes de digitar outro número
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(n)));

  const commit = (raw: string) => {
    const n = Number(raw);
    onChange(Number.isFinite(n) && raw.trim() !== "" ? clamp(n) : value);
    setDraft(null);
  };

  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
        className="flex h-12 w-12 items-center justify-center rounded-l-xl hover:bg-black/5 disabled:opacity-40"
      >
        <Minus className="h-5 w-5" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
          }
        }}
        className="h-12 w-14 border-x border-line bg-transparent text-center text-lg font-bold focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
        className="flex h-12 w-12 items-center justify-center rounded-r-xl hover:bg-black/5 disabled:opacity-40"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
