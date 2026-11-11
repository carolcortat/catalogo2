import { parseBRL } from "@/lib/currency";
import type { ProductVariant } from "@/types";

export const STORAGE_BUCKET = "catalog-images";
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (igual ao limite do bucket)

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Retorna uma mensagem de erro em português, ou `null` se o arquivo for aceito. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return "Formato não aceito. Use JPG, PNG, WebP ou GIF.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "A imagem é maior que 5 MB. Reduza o tamanho e tente de novo.";
  }
  if (file.size === 0) return "O arquivo está vazio.";
  return null;
}

/** "Rosa, Azul,  rosa ,, Verde" -> ["Rosa", "Azul", "Verde"] (sem repetidos, ignorando maiúsculas). */
export function parseOptions(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of text.split(/[,;\n]/)) {
    const option = raw.trim().replace(/\s+/g, " ");
    const key = option.toLowerCase();
    if (option && !seen.has(key)) {
      seen.add(key);
      result.push(option);
    }
  }
  return result;
}

export function formatOptions(options: string[]): string {
  return options.join(", ");
}

/**
 * Extrai o caminho do arquivo dentro do bucket a partir da URL pública do Supabase.
 * Retorna `null` para URLs que não pertencem ao bucket do catálogo.
 */
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  return path && !path.includes("..") ? path : null;
}

export interface ProductFormShape {
  name: string;
  category_id: string;
  price: string;
  description: string;
  available: boolean;
  variants: { name: string; options: string }[];
}

export interface ProductPayload {
  name: string;
  category_id: string | null;
  price: number;
  description: string;
  available: boolean;
  images: string[];
  variants: ProductVariant[];
}

/** Converte os valores do formulário no objeto gravado no banco. */
export function productToPayload(values: ProductFormShape, images: string[]): ProductPayload {
  return {
    name: values.name.trim(),
    category_id: values.category_id || null,
    price: Math.round(parseBRL(values.price) * 100) / 100,
    description: values.description.trim(),
    available: values.available,
    images,
    variants: values.variants
      .map((v) => ({ name: v.name.trim(), options: parseOptions(v.options) }))
      .filter((v) => v.name && v.options.length > 0),
  };
}

/** Texto do preço para o campo do formulário: 45.9 -> "45,90". */
export function priceToInput(price: number): string {
  return price.toFixed(2).replace(".", ",");
}
