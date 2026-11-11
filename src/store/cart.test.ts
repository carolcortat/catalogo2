import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_QUANTITY,
  buildItemKey,
  cartCount,
  cartSubtotal,
  itemTotal,
  useCart,
} from "./cart";

const base = {
  productId: "p1",
  name: "Caderno personalizado",
  price: 45,
  image: null,
  quantity: 1,
  variants: {},
  note: "",
};

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ items: [], generalNote: "" });
});

describe("carrinho", () => {
  it("adiciona um item novo", () => {
    useCart.getState().add(base);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it("soma a quantidade de itens iguais (mesmo produto, variações e observação)", () => {
    const { add } = useCart.getState();
    add({ ...base, variants: { Cor: "Rosa", Tamanho: "A5" }, note: "Maria" });
    // ordem das variações e maiúsculas/espaços na observação não mudam a identidade
    add({ ...base, quantity: 2, variants: { Tamanho: "A5", Cor: "Rosa" }, note: "  maria " });
    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("mantém linhas separadas quando variação ou observação diferem", () => {
    const { add } = useCart.getState();
    add({ ...base, variants: { Cor: "Rosa" } });
    add({ ...base, variants: { Cor: "Azul" } });
    add({ ...base, variants: { Cor: "Rosa" }, note: "Com nome" });
    expect(useCart.getState().items).toHaveLength(3);
  });

  it("limita a quantidade entre 1 e o máximo", () => {
    const { add, setQuantity } = useCart.getState();
    add(base);
    const key = useCart.getState().items[0].key;
    setQuantity(key, 0);
    expect(useCart.getState().items[0].quantity).toBe(1);
    setQuantity(key, 5000);
    expect(useCart.getState().items[0].quantity).toBe(MAX_QUANTITY);
    setQuantity(key, 2.9);
    expect(useCart.getState().items[0].quantity).toBe(2);
    setQuantity(key, Number.NaN);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it("não ultrapassa o máximo ao somar itens iguais", () => {
    const { add } = useCart.getState();
    add({ ...base, quantity: 90 });
    add({ ...base, quantity: 90 });
    expect(useCart.getState().items[0].quantity).toBe(MAX_QUANTITY);
  });

  it("remove um item e limpa o carrinho", () => {
    const { add, remove, clear, setGeneralNote } = useCart.getState();
    add(base);
    add({ ...base, productId: "p2", name: "Agenda", price: 60 });
    const key = useCart.getState().items[0].key;
    remove(key);
    expect(useCart.getState().items).toHaveLength(1);
    setGeneralNote("Entregar à tarde");
    clear();
    expect(useCart.getState().items).toHaveLength(0);
    expect(useCart.getState().generalNote).toBe("");
  });

  it("gera chaves estáveis", () => {
    expect(buildItemKey("a", { B: "2", A: "1" }, " X ")).toBe(
      buildItemKey("a", { A: "1", B: "2" }, "x"),
    );
  });
});

describe("cálculos", () => {
  it("calcula total do item, subtotal e contagem sem erro de centavos", () => {
    const items = [
      { ...base, key: "1", quantity: 2, price: 45 }, // 90,00
      { ...base, key: "2", quantity: 3, price: 19.99 }, // 59,97
      { ...base, key: "3", quantity: 1, price: 0.1 }, // 0,10
      { ...base, key: "4", quantity: 1, price: 0.2 }, // 0,20
    ];
    expect(itemTotal(items[1])).toBe(59.97);
    expect(cartSubtotal(items)).toBe(150.27);
    expect(cartCount(items)).toBe(7);
  });

  it("subtotal de carrinho vazio é zero", () => {
    expect(cartSubtotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});

describe("persistência", () => {
  it("grava no localStorage e recupera ao reidratar", async () => {
    useCart.getState().add({ ...base, quantity: 2 });
    useCart.getState().setGeneralNote("Entregar à tarde");

    const raw = localStorage.getItem("catalogo-cart") ?? "{}";
    const saved = JSON.parse(raw);
    expect(saved.state.items).toHaveLength(1);
    expect(saved.state.generalNote).toBe("Entregar à tarde");
    // funções não devem ser gravadas
    expect(saved.state.add).toBeUndefined();

    // Simula recarregar a página: a memória volta vazia, mas o localStorage
    // (que o setState acima sobrescreveria) ainda guarda o carrinho salvo.
    useCart.setState({ items: [], generalNote: "" });
    localStorage.setItem("catalogo-cart", raw);
    await useCart.persist.rehydrate();
    expect(useCart.getState().items[0].quantity).toBe(2);
    expect(useCart.getState().generalNote).toBe("Entregar à tarde");
  });
});
