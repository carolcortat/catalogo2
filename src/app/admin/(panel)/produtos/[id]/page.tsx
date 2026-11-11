import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { mapProduct } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [product, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, position").order("position").order("name"),
  ]);

  if (!product.data) notFound();

  return (
    <ProductForm
      key={product.data.id}
      product={mapProduct(product.data)}
      categories={(categories.data ?? []) as Category[]}
    />
  );
}
