import { formatBRL, parseBRL } from "@/lib/currency";
import { cartSubtotal } from "@/store/cart";
import {
  PAYMENT_LABELS,
  type CartItem,
  type DeliveryMode,
  type PaymentMethodId,
} from "@/types";

export interface OrderData {
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  delivery: DeliveryMode;
  address?: string;
  payment: PaymentMethodId;
  /** Só para dinheiro: "sim" se o cliente precisa de troco */
  needsChange?: boolean;
  /** Valor com que o cliente vai pagar (texto digitado, ex.: "100,00") */
  changeFor?: string;
  generalNote?: string;
}

/** Limite prático para a URL; acima disso alguns aparelhos/navegadores podem falhar. */
export const MAX_WHATSAPP_URL_LENGTH = 6000;

/** Remove caracteres de controle e espaços sobrando, preservando quebras de linha simples. */
function clean(text: string | undefined): string {
  return (text ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Mesma limpeza, mas em uma única linha (nome, endereço, observações curtas). */
function oneLine(text: string | undefined): string {
  return clean(text).replace(/\s*\n\s*/g, " ");
}

/**
 * Normaliza o número do vendedor para o formato do wa.me (somente dígitos, com DDI).
 * - Aceita "(21) 99999-8888", "+55 21 99999-8888", "5521999998888" etc.
 * - Números brasileiros sem DDI (10 ou 11 dígitos) ganham o prefixo 55.
 * Retorna "" se o número não for válido.
 */
export function normalizeWhatsAppNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  digits = digits.replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 12 && digits.length <= 15 ? digits : "";
}

/** Monta o texto do pedido, no formato combinado, de acordo com o que o cliente preencheu. */
export function buildOrderMessage(order: OrderData): string {
  const subtotal = cartSubtotal(order.items);
  const lines: string[] = [];

  lines.push("Olá! Gostaria de fazer um pedido.", "");

  lines.push("Dados do cliente:");
  lines.push(`Nome: ${oneLine(order.customerName)}`);
  const phone = oneLine(order.customerPhone);
  if (phone) lines.push(`Telefone: ${phone}`);
  lines.push("");

  lines.push("Produtos:", "");
  for (const item of order.items) {
    lines.push(`${item.quantity}x ${oneLine(item.name)} – ${formatBRL(item.price)}`);
    const options = Object.entries(item.variants)
      .map(([name, value]) => `${oneLine(name)}: ${oneLine(value)}`)
      .join(", ");
    if (options) lines.push(`Opções: ${options}`);
    const note = oneLine(item.note);
    if (note) lines.push(`Observação: ${note}`);
    lines.push("");
  }

  lines.push(`Subtotal: ${formatBRL(subtotal)}`, "");

  lines.push(`Forma de pagamento: ${PAYMENT_LABELS[order.payment]}.`);
  if (order.payment === "dinheiro") {
    const amount = parseBRL(order.changeFor ?? "");
    if (order.needsChange && Number.isFinite(amount)) {
      lines.push(
        `Troco: sim, para ${formatBRL(amount)} (troco de ${formatBRL(
          Math.round((amount - subtotal) * 100) / 100,
        )}).`,
      );
    } else {
      lines.push("Troco: não preciso de troco.");
    }
  }

  lines.push(`Recebimento: ${order.delivery === "entrega" ? "Entrega" : "Retirada"}.`);
  const address = oneLine(order.address);
  if (order.delivery === "entrega" && address) lines.push(`Endereço: ${address}`);

  const general = oneLine(order.generalNote);
  if (general) lines.push(`Observações gerais: ${general}`);

  lines.push("", `TOTAL: ${formatBRL(subtotal)}`);

  return lines.join("\n");
}

/**
 * Gera o link que abre a conversa com o vendedor já com a mensagem preenchida.
 * Retorna `null` se o número do vendedor for inválido.
 */
export function buildWhatsAppUrl(sellerNumber: string, message: string): string | null {
  const number = normalizeWhatsAppNumber(sellerNumber);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
