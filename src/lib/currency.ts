const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em reais: 45 -> "R$ 45,00" */
export function formatBRL(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0);
}

/**
 * Converte texto digitado ("45,90", "R$ 1.250,50", "45.9") em número.
 * Retorna NaN quando não for possível interpretar.
 */
export function parseBRL(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return NaN;
  // Se houver vírgula, ela é o separador decimal e os pontos são milhares.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  return Number(normalized);
}

/** Soma em centavos para evitar erros de ponto flutuante. */
export function sumMoney(values: number[]): number {
  const cents = values.reduce((acc, v) => acc + Math.round(v * 100), 0);
  return cents / 100;
}

/** Multiplica preço por quantidade sem erro de ponto flutuante. */
export function lineTotal(price: number, quantity: number): number {
  return Math.round(price * 100) * quantity / 100;
}
