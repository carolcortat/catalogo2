import { describe, expect, it } from "vitest";
import { formatBRL, lineTotal, parseBRL, sumMoney } from "./currency";

// O Intl usa espaço não separável entre "R$" e o valor
const plain = (s: string) => s.replace(/ /g, " ");

describe("currency", () => {
  it("formata em reais", () => {
    expect(plain(formatBRL(45))).toBe("R$ 45,00");
    expect(plain(formatBRL(1250.5))).toBe("R$ 1.250,50");
    expect(plain(formatBRL(Number.NaN))).toBe("R$ 0,00");
  });

  it("interpreta valores digitados", () => {
    expect(parseBRL("45,90")).toBe(45.9);
    expect(parseBRL("R$ 1.250,50")).toBe(1250.5);
    expect(parseBRL("45.9")).toBe(45.9);
    expect(parseBRL("abc")).toBeNaN();
    expect(parseBRL("")).toBeNaN();
  });

  it("soma e multiplica sem erro de ponto flutuante", () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(lineTotal(45, 2)).toBe(90);
    expect(lineTotal(19.99, 3)).toBe(59.97);
  });
});
