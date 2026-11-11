import { describe, expect, it } from "vitest";
import type { CartItem } from "@/types";
import {
  MAX_WHATSAPP_URL_LENGTH,
  buildOrderMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppNumber,
  type OrderData,
} from "./whatsapp";

const item = (over: Partial<CartItem>): CartItem => ({
  key: Math.random().toString(),
  productId: "p",
  name: "Produto",
  price: 10,
  image: null,
  quantity: 1,
  variants: {},
  note: "",
  ...over,
});

// Mesmo exemplo do enunciado
const exampleOrder: OrderData = {
  items: [
    item({ name: "Caderno personalizado", price: 45, quantity: 2, note: "Capa na cor rosa." }),
    item({ name: "Agenda personalizada", price: 60, quantity: 1, note: "Nome na capa: Maria." }),
  ],
  customerName: "Maria",
  delivery: "entrega",
  payment: "pix",
  generalNote: "Entregar no período da tarde.",
};

describe("buildOrderMessage", () => {
  it("gera a mensagem no formato do exemplo", () => {
    const msg = buildOrderMessage({ ...exampleOrder, address: "" });
    expect(msg.replace(/ /g, " ")).toBe(
      [
        "Olá! Gostaria de fazer um pedido.",
        "",
        "Dados do cliente:",
        "Nome: Maria",
        "",
        "Produtos:",
        "",
        "2x Caderno personalizado – R$ 45,00",
        "Observação: Capa na cor rosa.",
        "",
        "1x Agenda personalizada – R$ 60,00",
        "Observação: Nome na capa: Maria.",
        "",
        "Subtotal: R$ 150,00",
        "",
        "Forma de pagamento: Pix.",
        "Recebimento: Entrega.",
        "Observações gerais: Entregar no período da tarde.",
        "",
        "TOTAL: R$ 150,00",
      ].join("\n"),
    );
  });

  it("inclui telefone, endereço e opções somente quando existem", () => {
    const msg = buildOrderMessage({
      ...exampleOrder,
      customerPhone: "(21) 99999-8888",
      address: "Rua das Flores, 10 - Centro",
      items: [item({ name: "Caderno", variants: { Cor: "Rosa", Tamanho: "A5" } })],
      generalNote: "",
    });
    expect(msg).toContain("Telefone: (21) 99999-8888");
    expect(msg).toContain("Endereço: Rua das Flores, 10 - Centro");
    expect(msg).toContain("Opções: Cor: Rosa, Tamanho: A5");
    expect(msg).not.toContain("Observações gerais");
    expect(msg).not.toContain("Observação:");
  });

  it("não mostra endereço na retirada, mesmo que esteja preenchido", () => {
    const msg = buildOrderMessage({
      ...exampleOrder,
      delivery: "retirada",
      address: "Rua X, 1",
    });
    expect(msg).toContain("Recebimento: Retirada.");
    expect(msg).not.toContain("Endereço");
  });

  it("informa troco quando o pagamento é em dinheiro", () => {
    const base = { ...exampleOrder, payment: "dinheiro" as const };
    const com = buildOrderMessage({ ...base, needsChange: true, changeFor: "200,00" })
      .replace(/ /g, " ");
    expect(com).toContain("Forma de pagamento: Dinheiro.");
    expect(com).toContain("Troco: sim, para R$ 200,00 (troco de R$ 50,00).");

    const sem = buildOrderMessage({ ...base, needsChange: false });
    expect(sem).toContain("Troco: não preciso de troco.");

    const outro = buildOrderMessage({ ...exampleOrder, payment: "pix" });
    expect(outro).not.toContain("Troco");
  });

  it("calcula subtotal e total sem erro de centavos", () => {
    const msg = buildOrderMessage({
      ...exampleOrder,
      items: [item({ price: 19.99, quantity: 3 }), item({ price: 0.1 }), item({ price: 0.2 })],
    }).replace(/ /g, " ");
    expect(msg).toContain("Subtotal: R$ 60,27");
    expect(msg).toContain("TOTAL: R$ 60,27");
  });

  it("deixa o texto do cliente em uma linha e remove caracteres de controle", () => {
    const msg = buildOrderMessage({
      ...exampleOrder,
      customerName: "Maria\nSilva\u0000",
      generalNote: "linha 1\n\n\nlinha 2",
    });
    expect(msg).toContain("Nome: Maria Silva\n");
    expect(msg).toContain("Observações gerais: linha 1 linha 2");
    expect(msg).not.toContain("\u0000");
  });
});

describe("normalizeWhatsAppNumber", () => {
  it.each([
    ["5521999998888", "5521999998888"],
    ["+55 (21) 99999-8888", "5521999998888"],
    ["(21) 99999-8888", "5521999998888"],
    ["21 3333-4444", "552133334444"],
    ["021999998888", "5521999998888"],
  ])("aceita %s", (input, expected) => {
    expect(normalizeWhatsAppNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "12345", "1234567890123456"])("rejeita %j", (input) => {
    expect(normalizeWhatsAppNumber(input)).toBe("");
  });
});

describe("buildWhatsAppUrl", () => {
  it("monta o link wa.me com a mensagem codificada", () => {
    const message = "Olá! Pedido:\n2x Café – R$ 10,00 & mais #1 100%";
    const url = buildWhatsAppUrl("(21) 99999-8888", message);
    expect(url).not.toBeNull();
    expect(url!.startsWith("https://wa.me/5521999998888?text=")).toBe(true);

    // Os caracteres especiais não podem "quebrar" a URL
    const query = url!.split("?text=")[1];
    expect(query).not.toMatch(/[\s&#\n]/);
    // E a decodificação devolve exatamente o texto original
    expect(decodeURIComponent(query)).toBe(message);
  });

  it("retorna null quando o número do vendedor é inválido", () => {
    expect(buildWhatsAppUrl("", "oi")).toBeNull();
    expect(buildWhatsAppUrl("123", "oi")).toBeNull();
  });

  it("um pedido grande, mas razoável, cabe no limite da URL", () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      item({
        name: `Caderno personalizado modelo ${i}`,
        variants: { Cor: "Rosa", Tamanho: "A5" },
        note: "Nome na capa: Maria Eduarda",
      }),
    );
    const url = buildWhatsAppUrl("5521999998888", buildOrderMessage({ ...exampleOrder, items }));
    expect(url!.length).toBeLessThan(MAX_WHATSAPP_URL_LENGTH);
  });
});
