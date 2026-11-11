import { ProductList } from "@/components/admin/ProductList";
import { mapProduct } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export default async function AdminHome() {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, position").order("position").order("name"),
  ]);

  if (products.error) {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-800">
        Não foi possível carregar os produtos. Confirme se o arquivo SQL foi executado no Supabase.
      </p>
    );
  }

  return (
    <ProductList
      products={(products.data ?? []).map(mapProduct)}
      categories={(categories.data ?? []) as Category[]}
    />
  );
}
