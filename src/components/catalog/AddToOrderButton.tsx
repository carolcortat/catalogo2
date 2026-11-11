"use client";

import { Check, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useCart } from "@/store/cart";
import type { Product } from "@/types";

/**
 * Botão "Adicionar ao pedido" do card.
 * Produtos com variações levam à página de detalhes para o cliente escolher as opções.
 */
export function AddToOrderButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1400);
    return () => clearTimeout(t);
  }, [justAdded]);

  if (!product.available) {
    return (
      <Button variant="secondary" fullWidth disabled>
        Indisponível
      </Button>
    );
  }

  if (product.variants.length > 0) {
    return (
      <Link
        href={`/produto/${product.id}`}
        className={buttonClasses({ variant: "primary", fullWidth: true })}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Escolher opções
      </Link>
    );
  }

  return (
    <Button
      variant="primary"
      fullWidth
      onClick={() => {
        add({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] ?? null,
          quantity: 1,
          variants: {},
          note: "",
        });
        setJustAdded(true);
        toast(`${product.name} adicionado ao pedido`);
      }}
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4" aria-hidden /> Adicionado
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" aria-hidden /> Adicionar ao pedido
        </>
      )}
    </Button>
  );
}
