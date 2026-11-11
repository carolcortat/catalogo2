"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/catalog/ProductImage";
import { QuantityInput } from "@/components/product/QuantityInput";
import { formatBRL } from "@/lib/currency";
import { itemTotal } from "@/store/cart";
import type { CartItem } from "@/types";

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const variantEntries = Object.entries(item.variants);

  return (
    <li className="flex gap-3 rounded-2xl border border-line bg-surface p-3 sm:gap-4 sm:p-4">
      <Link href={`/produto/${item.productId}`} className="shrink-0" aria-label={`Ver ${item.name}`}>
        <ProductImage
          src={item.image}
          alt={item.name}
          className="h-20 w-20 rounded-xl sm:h-24 sm:w-24"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold leading-snug">{item.name}</h3>
            <p className="text-sm text-muted">{formatBRL(item.price)} cada</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`Remover ${item.name} do pedido`}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2.5 text-muted transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {variantEntries.length > 0 && (
          <p className="text-sm">
            {variantEntries.map(([name, value], i) => (
              <span key={name}>
                {i > 0 && " · "}
                <span className="text-muted">{name}:</span> {value}
              </span>
            ))}
          </p>
        )}
        {item.note && (
          <p className="rounded-lg bg-black/5 px-2.5 py-1.5 text-sm">
            <span className="font-semibold">Obs.:</span> {item.note}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <QuantityInput
            value={item.quantity}
            onChange={(q) => onQuantityChange(item.key, q)}
            label={`Quantidade de ${item.name}`}
          />
          <p className="text-lg font-extrabold text-brand" aria-label="Total do item">
            {formatBRL(itemTotal(item))}
          </p>
        </div>
      </div>
    </li>
  );
}
