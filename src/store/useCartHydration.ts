"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/store/cart";

function subscribe(onChange: () => void): () => void {
  const unsubscribe = useCart.persist.onFinishHydration(onChange);
  // Lê o localStorage do navegador (o carrinho usa skipHydration por causa do SSR)
  if (!useCart.persist.hasHydrated()) {
    void useCart.persist.rehydrate();
  }
  return unsubscribe;
}

/**
 * Retorna `true` quando o carrinho já foi carregado do localStorage.
 * No servidor é sempre `false`, o que evita diferenças na hidratação.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
