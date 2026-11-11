"use client";

import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatBRL } from "@/lib/currency";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { useCartHydrated } from "@/store/useCartHydration";
import type { CartItem } from "@/types";
import { CartItemRow } from "./CartItemRow";

const GENERAL_NOTE_MAX = 300;

export function CartView() {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const generalNote = useCart((s) => s.generalNote);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const setGeneralNote = useCart((s) => s.setGeneralNote);
  const { toast } = useToast();

  // Enquanto lê o localStorage, mostra um esqueleto (evita "piscar" o carrinho vazio)
  if (!hydrated) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando seu pedido">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted" aria-hidden />
        <h2 className="text-xl font-extrabold">Seu pedido está vazio</h2>
        <p className="max-w-sm text-muted">
          Escolha seus produtos no catálogo e eles aparecerão aqui.
        </p>
        <Link href="/" className={buttonClasses({ size: "lg" })}>
          Ver produtos
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const count = cartCount(items);

  const handleRemove = (item: CartItem) => {
    remove(item.key);
    toast(`${item.name} removido do pedido`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-4">
        <h2 className="sr-only">Produtos do pedido</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <CartItemRow
              key={item.key}
              item={item}
              onQuantityChange={setQuantity}
              onRemove={handleRemove}
            />
          ))}
        </ul>

        <Textarea
          id="general-note"
          label="Observações gerais do pedido"
          optional
          rows={3}
          maxLength={GENERAL_NOTE_MAX}
          placeholder="Ex.: entregar no período da tarde"
          hint={`${generalNote.length}/${GENERAL_NOTE_MAX} caracteres`}
          value={generalNote}
          onChange={(e) => setGeneralNote(e.target.value)}
        />
      </div>

      {/* Resumo: fixo no rodapé no celular, lateral no computador */}
      <aside
        aria-label="Resumo do pedido"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:sticky lg:top-4 lg:rounded-3xl lg:border lg:shadow-sm"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:max-w-none">
          <h2 className="hidden text-lg font-extrabold lg:block">Resumo do pedido</h2>

          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">
                Subtotal ({count} {count === 1 ? "item" : "itens"})
              </dt>
              <dd className="font-semibold">{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="text-base font-bold">Total</dt>
              <dd className="text-2xl font-extrabold text-brand">{formatBRL(subtotal)}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-[auto_1fr] gap-2 lg:grid-cols-1">
            <Link
              href="/"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
              aria-label="Continuar comprando"
            >
              <ArrowLeft className="h-5 w-5 lg:hidden" aria-hidden />
              <span className="hidden lg:inline">Continuar comprando</span>
            </Link>
            <Link href="/finalizar" className={buttonClasses({ size: "lg" })}>
              Finalizar pedido
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </aside>

      {/* Espaço para o resumo fixo não cobrir o conteúdo no celular */}
      <div className="h-44 lg:hidden" aria-hidden />
    </div>
  );
}
