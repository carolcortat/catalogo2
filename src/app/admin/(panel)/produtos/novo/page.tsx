import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, position").order("position").order("name");
  return <ProductForm categories={(data ?? []) as Category[]} />;
}
