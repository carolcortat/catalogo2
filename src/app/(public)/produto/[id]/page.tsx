import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { formatBRL } from "@/lib/currency";
import { getCategories, getProduct, getStoreSettings } from "@/lib/data";

// Deve ser um número literal (o Next analisa este valor em tempo de build)
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [product, store] = await Promise.all([getProduct(id), getStoreSettings()]);
  if (!product) return { title: "Produto não encontrado" };

  const description = product.description.slice(0, 160) || `${product.name} - ${store.store_name}`;
  const image = product.images.find((src) => src.startsWith("http"));
  const title = `${product.name} | ${store.store_name}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  if (!product) notFound();

  const category = categories.find((c) => c.id === product.category_id);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-full py-2 pr-3 text-sm font-semibold text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar ao catálogo
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={product.available ? "success" : "danger"}>
                {product.available ? "Disponível" : "Indisponível"}
              </Badge>
              {category && <Badge tone="neutral">{category.name}</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">{product.name}</h1>
            <p className="text-3xl font-extrabold text-brand">{formatBRL(product.price)}</p>
            {product.description && (
              <p className="whitespace-pre-line text-base leading-relaxed text-muted">
                {product.description}
              </p>
            )}
          </div>

          <ProductPurchase product={product} />
        </div>
      </div>
    </div>
  );
}
