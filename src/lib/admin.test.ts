import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  formatOptions,
  parseOptions,
  priceToInput,
  productToPayload,
  storagePathFromUrl,
  validateImageFile,
} from "./admin";
import { categorySchema, productSchema, settingsSchema } from "./validators";

describe("validateImageFile", () => {
  it("aceita formatos e tamanhos permitidos", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES })).toBeNull();
    expect(validateImageFile({ type: "image/webp", size: 1 })).toBeNull();
  });
  it("rejeita formatos inválidos, arquivos grandes e vazios", () => {
    expect(validateImageFile({ type: "application/pdf", size: 10 })).toMatch(/Formato/);
    expect(validateImageFile({ type: "image/svg+xml", size: 10 })).toMatch(/Formato/);
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toMatch(/5 MB/);
    expect(validateImageFile({ type: "image/png", size: 0 })).toMatch(/vazio/);
  });
});

describe("parseOptions", () => {
  it("separa por vírgula, remove espaços e repetidos", () => {
    expect(parseOptions("Rosa, Azul,  rosa ,, Verde  claro")).toEqual(["Rosa", "Azul", "Verde claro"]);
    expect(parseOptions("")).toEqual([]);
    expect(parseOptions(" , ; ")).toEqual([]);
    expect(formatOptions(["A", "B"])).toBe("A, B");
  });
});

describe("storagePathFromUrl", () => {
  const base = "https://abc.supabase.co/storage/v1/object/public/catalog-images";
  it("extrai o caminho de arquivos do bucket do catálogo", () => {
    expect(storagePathFromUrl(`${base}/products/x.jpg`)).toBe("products/x.jpg");
    expect(storagePathFromUrl(`${base}/products/x.jpg?t=1`)).toBe("products/x.jpg");
  });
  it("ignora URLs externas e tentativas de sair da pasta", () => {
    expect(storagePathFromUrl("https://exemplo.com/foto.jpg")).toBeNull();
    expect(storagePathFromUrl(`${base}/../outro/x.jpg`)).toBeNull();
    expect(storagePathFromUrl("data:image/svg+xml;utf8,abc")).toBeNull();
  });
});

describe("productToPayload", () => {
  it("converte o formulário no formato do banco", () => {
    const payload = productToPayload(
      {
        name: "  Caderno  ",
        category_id: "",
        price: "R$ 45,90",
        description: " bonito ",
        available: true,
        variants: [
          { name: " Cor ", options: "Rosa, Azul, rosa" },
          { name: "", options: "x" },
          { name: "Tamanho", options: "" },
        ],
      },
      ["https://x/1.jpg"],
    );
    expect(payload).toEqual({
      name: "Caderno",
      category_id: null,
      price: 45.9,
      description: "bonito",
      available: true,
      images: ["https://x/1.jpg"],
      variants: [{ name: "Cor", options: ["Rosa", "Azul"] }],
    });
    expect(priceToInput(45.9)).toBe("45,90");
    expect(priceToInput(1250)).toBe("1250,00");
  });
});

const validProduct = {
  name: "Caderno",
  category_id: "",
  price: "45,90",
  description: "",
  available: true,
  variants: [],
};

function productErrors(input: object): string[] {
  const r = productSchema.safeParse({ ...validProduct, ...input });
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
}

describe("productSchema", () => {
  it("aceita um produto simples", () => {
    expect(productErrors({})).toEqual([]);
    expect(productErrors({ price: "0" })).toEqual([]);
  });
  it("valida nome e preço", () => {
    expect(productErrors({ name: "  " })).toContain("name");
    expect(productErrors({ price: "" })).toContain("price");
    expect(productErrors({ price: "abc" })).toContain("price");
    expect(productErrors({ price: "-5" })).toContain("price");
    expect(productErrors({ price: "9999999" })).toContain("price");
  });
  it("valida variações", () => {
    expect(productErrors({ variants: [{ name: "Cor", options: "Rosa, Azul" }] })).toEqual([]);
    expect(productErrors({ variants: [{ name: "", options: "Rosa" }] })).toContain("variants.0.name");
    expect(productErrors({ variants: [{ name: "Cor", options: " , " }] })).toContain("variants.0.options");
    expect(
      productErrors({
        variants: [
          { name: "Cor", options: "A" },
          { name: "cor", options: "B" },
        ],
      }),
    ).toContain("variants.1.name");
  });
});

const validSettings = {
  store_name: "Loja",
  tagline: "",
  brand_color: "#e11d74",
  banner_title: "",
  banner_text: "",
  whatsapp_number: "(21) 99999-8888",
  payment_methods: ["pix"],
  accepts_delivery: true,
  accepts_pickup: false,
  store_info: "",
};

function settingsErrors(input: object): string[] {
  const r = settingsSchema.safeParse({ ...validSettings, ...input });
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
}

describe("settingsSchema", () => {
  it("aceita configurações válidas", () => {
    expect(settingsErrors({})).toEqual([]);
  });
  it("exige nome, WhatsApp válido e cor válida", () => {
    expect(settingsErrors({ store_name: "" })).toContain("store_name");
    expect(settingsErrors({ whatsapp_number: "123" })).toContain("whatsapp_number");
    expect(settingsErrors({ whatsapp_number: "" })).toContain("whatsapp_number");
    expect(settingsErrors({ brand_color: "rosa" })).toContain("brand_color");
    expect(settingsErrors({ brand_color: "#fff" })).toContain("brand_color");
  });
  it("exige ao menos uma forma de pagamento e um modo de recebimento", () => {
    expect(settingsErrors({ payment_methods: [] })).toContain("payment_methods");
    expect(settingsErrors({ payment_methods: ["bitcoin"] })).toContain("payment_methods.0");
    expect(settingsErrors({ accepts_delivery: false, accepts_pickup: false })).toContain(
      "accepts_delivery",
    );
  });
});

describe("categorySchema", () => {
  it("exige nome", () => {
    expect(categorySchema.safeParse({ name: " " }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "Cadernos" }).success).toBe(true);
  });
});
