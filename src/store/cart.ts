"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lineTotal, sumMoney } from "@/lib/currency";
import type { CartItem } from "@/types";

export const MAX_QUANTITY = 99;

interface CartState {
  items: CartItem[];
  generalNote: string;
  add: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  setGeneralNote: (note: string) => void;
  clear: () => void;
}

/** Itens iguais (mesmo produto, variações e observação) são agrupados. */
export function buildItemKey(
  productId: string,
  variants: Record<string, string>,
  note: string,
): string {
  const v = Object.keys(variants)
    .sort()
    .map((k) => `${k}=${variants[k]}`)
    .join("|");
  return `${productId}::${v}::${note.trim().toLowerCase()}`;
}

function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(q)));
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      generalNote: "",

      add: (item) =>
        set((state) => {
          const note = item.note.trim();
          const key = buildItemKey(item.productId, item.variants, note);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key
                  ? { ...i, quantity: clampQuantity(i.quantity + item.quantity) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, note, key, quantity: clampQuantity(item.quantity) },
            ],
          };
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: clampQuantity(quantity) } : i,
          ),
        })),

      remove: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      setGeneralNote: (generalNote) => set({ generalNote }),

      clear: () => set({ items: [], generalNote: "" }),
    }),
    {
      name: "catalogo-cart",
      version: 1,
      // Só grava itens e observação geral (não as funções)
      partialize: (state) => ({
        items: state.items,
        generalNote: state.generalNote,
      }),
      // Evita diferença entre servidor e navegador na primeira renderização
      skipHydration: true,
    },
  ),
);

/** Funções puras de cálculo (testáveis e reutilizadas no resumo e no WhatsApp). */
export function itemTotal(item: CartItem): number {
  return lineTotal(item.price, item.quantity);
}

export function cartSubtotal(items: CartItem[]): number {
  return sumMoney(items.map(itemTotal));
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}
