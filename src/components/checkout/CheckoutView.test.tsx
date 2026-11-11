import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import { DEMO_STORE } from "@/lib/demo-data";
import { useCart } from "@/store/cart";
import type { CartItem, StoreSettings } from "@/types";
import { CheckoutView } from "./CheckoutView";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const items: CartItem[] = [
  {
    key: "caderno::Cor da capa=Rosa::capa na cor rosa.",
    productId: "caderno-personalizado",
    name: "Caderno personalizado",
    price: 45,
    image: null,
    quantity: 2,
    variants: { "Cor da capa": "Rosa" },
    note: "Capa na cor rosa.",
  },
  {
    key: "agenda::::",
    productId: "agenda-personalizada",
    name: "Agenda personalizada",
    price: 60,
    image: null,
    quantity: 1,
    variants: {},
    note: "",
  },
];

/**
 * Simula um carrinho já salvo no navegador (como se o cliente tivesse navegado antes).
 * O store vive em memória durante toda a execução dos testes, então é preciso
 * reidratar explicitamente (no navegador isso acontece uma vez por carregamento de página).
 */
async function seedCart(generalNote = "Entregar no período da tarde.") {
  localStorage.setItem(
    "catalogo-cart",
    JSON.stringify({ state: { items, generalNote }, version: 1 }),
  );
  await useCart.persist.rehydrate();
}

function renderCheckout(store: StoreSettings = DEMO_STORE) {
  return render(
    <ToastProvider>
      <CheckoutView store={store} />
    </ToastProvider>,
  );
}

const plain = (s: string) => s.replace(/ /g, " ");

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ items: [], generalNote: "" });
  window.scrollTo = vi.fn();
});
afterEach(cleanup);

describe("fluxo de finalização", () => {
  it("valida campos obrigatórios antes de avançar", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout();

    await user.click(await screen.findByRole("button", { name: "Revisar pedido" }));

    expect(await screen.findByText("Informe seu nome")).toBeTruthy();
    expect(screen.getByText("Escolha a forma de pagamento")).toBeTruthy();
    // não avançou para o resumo
    expect(screen.queryByText("Confira seu pedido.")).toBeNull();
  });

  it("exige endereço na entrega e não exige na retirada", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout();

    await user.type(await screen.findByLabelText("Nome"), "Maria");
    await user.click(screen.getByLabelText("Pix"));

    // Entrega (padrão): campo de endereço aparece e é obrigatório
    expect(screen.getByLabelText("Endereço de entrega")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));
    expect(await screen.findByText(/Informe o endereço completo/)).toBeTruthy();

    // Retirada: o endereço some e o pedido avança
    await user.click(screen.getByLabelText(/Retirada/));
    expect(screen.queryByLabelText("Endereço de entrega")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));
    expect(await screen.findByText("Confira seu pedido.")).toBeTruthy();
  });

  it("exige um valor de troco maior que o total quando paga em dinheiro", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout();

    await user.type(await screen.findByLabelText("Nome"), "Maria");
    await user.click(screen.getByLabelText(/Retirada/));
    await user.click(screen.getByLabelText("Dinheiro"));

    // O campo de troco só aparece depois de responder "Sim"
    expect(screen.queryByLabelText("Troco para quanto?")).toBeNull();
    await user.click(screen.getByLabelText("Sim"));

    await user.type(screen.getByLabelText("Troco para quanto?"), "100");
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));
    expect(await screen.findByText(/maior que o total do pedido/)).toBeTruthy();

    await user.clear(screen.getByLabelText("Troco para quanto?"));
    await user.type(screen.getByLabelText("Troco para quanto?"), "200,00");
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));
    expect(await screen.findByText("Confira seu pedido.")).toBeTruthy();
  });

  it("mostra o resumo completo e gera o link do WhatsApp com a mensagem do pedido", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout();

    await user.type(await screen.findByLabelText("Nome"), "Maria");
    await user.type(screen.getByLabelText(/Telefone/), "(21) 98888-7777");
    await user.type(
      screen.getByLabelText("Endereço de entrega"),
      "Rua das Flores, 10 - Centro",
    );
    await user.click(screen.getByLabelText("Pix"));
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));

    // Resumo
    expect(await screen.findByText("Confira seu pedido.")).toBeTruthy();
    expect(screen.getByText("2x Caderno personalizado")).toBeTruthy();
    expect(screen.getByText("1x Agenda personalizada")).toBeTruthy();
    const totals = screen.getByRole("region", { name: "Valores" });
    expect(plain(within(totals).getAllByText(/R\$/).map((e) => e.textContent).join("|"))).toBe(
      "R$ 150,00|R$ 150,00",
    );

    // Link do WhatsApp
    const link = screen.getByRole("link", { name: /Enviar pedido pelo WhatsApp/ });
    const href = link.getAttribute("href")!;
    expect(href.startsWith("https://wa.me/5521999998888?text=")).toBe(true);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");

    const message = plain(decodeURIComponent(href.split("?text=")[1]));
    expect(message).toContain("Olá! Gostaria de fazer um pedido.");
    expect(message).toContain("Nome: Maria");
    expect(message).toContain("Telefone: (21) 98888-7777");
    expect(message).toContain("2x Caderno personalizado – R$ 45,00");
    expect(message).toContain("Opções: Cor da capa: Rosa");
    expect(message).toContain("Observação: Capa na cor rosa.");
    expect(message).toContain("1x Agenda personalizada – R$ 60,00");
    expect(message).toContain("Subtotal: R$ 150,00");
    expect(message).toContain("Forma de pagamento: Pix.");
    expect(message).toContain("Recebimento: Entrega.");
    expect(message).toContain("Endereço: Rua das Flores, 10 - Centro");
    expect(message).toContain("Observações gerais: Entregar no período da tarde.");
    expect(message).toContain("TOTAL: R$ 150,00");
  });

  it("depois de enviar, mantém o carrinho até o cliente confirmar", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout();

    await user.type(await screen.findByLabelText("Nome"), "Maria");
    await user.click(screen.getByLabelText(/Retirada/));
    await user.click(screen.getByLabelText("Pix"));
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));

    const link = await screen.findByRole("link", { name: /Enviar pedido pelo WhatsApp/ });
    // evita que o jsdom tente navegar ao clicar no link
    link.addEventListener("click", (e) => e.preventDefault());
    await user.click(link);

    expect(await screen.findByText("Falta só um passo!")).toBeTruthy();
    // o pedido NÃO é apagado só por abrir o WhatsApp
    expect(useCart.getState().items).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Já enviei/ }));
    await waitFor(() => expect(useCart.getState().items).toHaveLength(0));
  });

  it("voltar e editar preserva o que foi digitado", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout();

    await user.type(await screen.findByLabelText("Nome"), "Maria Souza");
    await user.click(screen.getByLabelText(/Retirada/));
    await user.click(screen.getByLabelText("Pix"));
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));
    await user.click(await screen.findByRole("button", { name: /Voltar e editar/ }));

    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Maria Souza");
    expect((screen.getByLabelText("Pix") as HTMLInputElement).checked).toBe(true);
  });

  it("não deixa enviar quando a loja não configurou o WhatsApp", async () => {
    await seedCart();
    const user = userEvent.setup();
    renderCheckout({ ...DEMO_STORE, whatsapp_number: "" });

    await user.type(await screen.findByLabelText("Nome"), "Maria");
    await user.click(screen.getByLabelText(/Retirada/));
    await user.click(screen.getByLabelText("Pix"));
    await user.click(screen.getByRole("button", { name: "Revisar pedido" }));

    expect(await screen.findByText(/ainda não configurou o WhatsApp/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Enviar pedido pelo WhatsApp/ })).toBeNull();
    const button = screen.getByRole("button", { name: /Enviar pedido pelo WhatsApp/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("só oferece as formas de pagamento habilitadas pela loja", async () => {
    await seedCart();
    renderCheckout({ ...DEMO_STORE, payment_methods: ["pix", "credito"], accepts_delivery: false });

    expect(await screen.findByLabelText("Pix")).toBeTruthy();
    expect(screen.getByLabelText("Cartão de crédito")).toBeTruthy();
    expect(screen.queryByLabelText("Dinheiro")).toBeNull();
    expect(screen.queryByLabelText("Cartão de débito")).toBeNull();
    // Loja só com retirada: não aparece a opção de entrega
    expect(screen.queryByLabelText(/Entrega/)).toBeNull();
  });

  it("mostra mensagem quando o carrinho está vazio", async () => {
    renderCheckout();
    expect(await screen.findByText("Seu pedido está vazio")).toBeTruthy();
  });
});
