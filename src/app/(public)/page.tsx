import type { Metadata } from "next";
import { Banner } from "@/components/catalog/Banner";
import { ProductBrowser } from "@/components/catalog/ProductBrowser";
import { getCategories, getProducts, getStoreSettings } from "@/lib/data";

// Deve ser um número literal (o Next analisa este valor em tempo de build)
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreSettings();
  const description =
    store.tagline || store.banner_text || "Escolha seus produtos e envie o pedido pelo WhatsApp.";
  const images = store.banner_image_url
    ? [store.banner_image_url]
    : store.logo_url
      ? [store.logo_url]
      : undefined;

  return {
    title: store.store_name,
    description,
    // Pré-visualização do link ao compartilhar no WhatsApp e no Instagram
    openGraph: { title: store.store_name, description, type: "website", images },
  };
}

export default async function HomePage() {
  const [store, categories, products] = await Promise.all([
    getStoreSettings(),
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Banner store={store} />
      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center text-muted">
          Em breve novos produtos por aqui.
        </p>
      ) : (
        <ProductBrowser products={products} categories={categories} />
      )}
    </div>
  );
}
