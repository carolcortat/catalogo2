"use client";

import clsx from "clsx";
import { Check, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatBRL, lineTotal } from "@/lib/currency";
import { useCart } from "@/store/cart";
import type { Product } from "@/types";
import { QuantityInput } from "./QuantityInput";

const NOTE_MAX = 200;

/** Escolha de variações, quantidade e observação, com validação antes de adicionar ao pedido. */
export function ProductPurchase({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const { toast } = useToast();

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  if (!product.available) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
      >
        Este produto está indisponível no momento. Que tal ver outras opções do catálogo?
      </div>
    );
  }

  const total = lineTotal(product.price, quantity);

  const handleAdd = () => {
    const missing = product.variants.filter((v) => !selected[v.name]).map((v) => v.name);
    setErrors(missing);
    if (missing.length > 0) {
      toast(`Escolha: ${missing.join(", ")}`, "error");
      return;
    }

    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? null,
      quantity,
      variants: selected,
      note,
    });
    setAdded(true);
    toast(
      `${quantity}x ${product.name} adicionado${quantity > 1 ? "s" : ""} ao pedido`,
    );
  };

  const resetFeedback = () => {
    if (added) setAdded(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {product.variants.map((variant) => {
        const hasError = errors.includes(variant.name);
        return (
          <fieldset key={variant.name} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">
              {variant.name}
              {selected[variant.name] && (
                <span className="ml-2 font-normal text-muted">{selected[variant.name]}</span>
              )}
            </legend>
            <div className="flex flex-wrap gap-2">
              {variant.options.map((option) => {
                const active = selected[variant.name] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelected((prev) => ({ ...prev, [variant.name]: option }));
                      setErrors((prev) => prev.filter((n) => n !== variant.name));
                      resetFeedback();
                    }}
                    className={clsx(
                      "min-h-11 rounded-xl border-2 px-4 text-sm font-semibold transition",
                      active
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-line bg-surface hover:bg-black/5",
                      hasError && !active && "border-red-400",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {hasError && (
              <p role="alert" className="text-sm text-red-600">
                Escolha uma opção de {variant.name.toLowerCase()}.
              </p>
            )}
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Quantidade</span>
        <QuantityInput
          value={quantity}
          onChange={(q) => {
            setQuantity(q);
            resetFeedback();
          }}
        />
      </div>

      <Textarea
        id="product-note"
        label="Observações do produto"
        optional
        rows={3}
        maxLength={NOTE_MAX}
        placeholder="Ex.: nome para gravar na capa, cor preferida..."
        hint={`${note.length}/${NOTE_MAX} caracteres`}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          resetFeedback();
        }}
      />

      <div className="flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3">
        <span className="text-sm font-semibold text-muted">Total deste item</span>
        <span className="text-2xl font-extrabold text-brand">{formatBRL(total)}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" fullWidth onClick={handleAdd}>
          {added ? (
            <>
              <Check className="h-5 w-5" aria-hidden /> Adicionado ao pedido
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" aria-hidden /> Adicionar ao pedido
            </>
          )}
        </Button>
        {added && (
          <Link
            href="/carrinho"
            className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden /> Ver meu pedido
          </Link>
        )}
      </div>
    </div>
  );
}
