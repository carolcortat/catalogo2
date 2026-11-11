export type PaymentMethodId = "pix" | "credito" | "debito" | "dinheiro";

export const PAYMENT_LABELS: Record<PaymentMethodId, string> = {
  pix: "Pix",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  dinheiro: "Dinheiro",
};

export type DeliveryMode = "entrega" | "retirada";

/** Uma variação, ex.: { name: "Cor", options: ["Rosa", "Azul"] } */
export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  /** Preço em reais (ex.: 45.9) */
  price: number;
  images: string[];
  available: boolean;
  variants: ProductVariant[];
  created_at?: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  logo_url: string | null;
  brand_color: string;
  banner_image_url: string | null;
  banner_title: string;
  banner_text: string;
  /** Somente dígitos com DDI, ex.: 5521999998888 */
  whatsapp_number: string;
  payment_methods: PaymentMethodId[];
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  /** Texto livre, ex.: "Seg a Sex, 9h às 18h" */
  store_info: string;
}

export interface CartItem {
  /** Chave única: produto + variações + observação */
  key: string;
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  /** Ex.: { Cor: "Rosa" } */
  variants: Record<string, string>;
  note: string;
}
