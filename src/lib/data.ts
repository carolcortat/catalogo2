import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_STORE,
} from "@/lib/demo-data";
import type {
  Category,
  PaymentMethodId,
  Product,
  ProductVariant,
  StoreSettings,
} from "@/types";

const VALID_PAYMENTS: PaymentMethodId[] = ["pix", "credito", "debito", "dinheiro"];

function normalizeVariants(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (v): v is { name: string; options: unknown[] } =>
        typeof v === "object" && v !== null && typeof (v as ProductVariant).name === "string",
    )
    .map((v) => ({
      name: v.name,
      options: Array.isArray(v.options)
        ? v.options.filter((o): o is string => typeof o === "string" && o.trim() !== "")
        : [],
    }))
    .filter((v) => v.options.length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProduct(row: any): Product {
  return {
    id: row.id,
    category_id: row.category_id ?? null,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    images: Array.isArray(row.images) ? row.images : [],
    available: Boolean(row.available),
    variants: normalizeVariants(row.variants),
    created_at: row.created_at,
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!hasSupabaseEnv()) return DEMO_STORE;

  const { data, error } = await createPublicClient()
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEMO_STORE;

  return {
    ...DEMO_STORE,
    ...data,
    payment_methods: ((data.payment_methods ?? []) as string[]).filter(
      (p): p is PaymentMethodId => VALID_PAYMENTS.includes(p as PaymentMethodId),
    ),
  };
}

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return DEMO_CATEGORIES;

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, position")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as Category[];
}

export async function getProducts(): Promise<Product[]> {
  if (!hasSupabaseEnv()) return DEMO_PRODUCTS;

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!hasSupabaseEnv()) return DEMO_PRODUCTS.find((p) => p.id === id) ?? null;

  // Evita erro de sintaxe do Postgres quando o id não é um UUID válido
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data);
}
