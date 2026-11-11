import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id, name, position").order("position").order("name"),
    supabase.from("products").select("category_id"),
  ]);

  const counts: Record<string, number> = {};
  for (const p of products.data ?? []) {
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  }

  return <CategoryManager categories={(categories.data ?? []) as Category[]} counts={counts} />;
}
