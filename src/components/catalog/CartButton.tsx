"use client";

import clsx from "clsx";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cartCount, useCart } from "@/store/cart";
import { useCartHydrated } from "@/store/useCartHydration";

/** Botão do carrinho no cabeçalho, com contador que "pula" ao adicionar itens. */
export function CartButton() {
  const hydrated = useCartHydrated();
  const count = useCart((s) => cartCount(s.items));
  const [pop, setPop] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    if (hydrated && count > previous.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      previous.current = count;
      return () => clearTimeout(t);
    }
    previous.current = count;
  }, [count, hydrated]);

  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/carrinho"
      aria-label={`Abrir meu pedido (${shown} ${shown === 1 ? "item" : "itens"})`}
      className="relative inline-flex h-11 items-center gap-2 rounded-full bg-brand px-4 font-semibold text-brand-contrast shadow-sm transition hover:brightness-95"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">Meu pedido</span>
      <span
        className={clsx(
          "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-sm font-bold text-foreground",
          pop && "animate-pop",
        )}
      >
        {shown}
      </span>
    </Link>
  );
}
