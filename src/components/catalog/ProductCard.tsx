import clsx from "clsx";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { formatBRL } from "@/lib/currency";
import type { Product } from "@/types";
import { AddToOrderButton } from "./AddToOrderButton";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const href = `/produto/${product.id}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
      <Link href={href} className="relative block" aria-label={`Ver detalhes de ${product.name}`}>
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className={clsx("aspect-square w-full", !product.available && "opacity-60 grayscale")}
        />
        <Badge
          tone={product.available ? "success" : "danger"}
          className="absolute left-2 top-2 shadow-sm"
        >
          {product.available ? "Disponível" : "Indisponível"}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="text-base font-bold leading-snug">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted">{product.description}</p>
        )}
        <p className="mt-auto pt-1 text-xl font-extrabold text-brand">
          {formatBRL(product.price)}
        </p>

        <div className="mt-1 flex flex-col gap-2">
          <Link
            href={href}
            className={buttonClasses({ variant: "secondary", size: "sm", fullWidth: true })}
          >
            Ver detalhes
          </Link>
          <AddToOrderButton product={product} />
        </div>
      </div>
    </article>
  );
}
