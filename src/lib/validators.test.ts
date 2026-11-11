import { describe, expect, it } from "vitest";
import { buildCheckoutSchema } from "./validators";

const schema = buildCheckoutSchema({
  total: 150,
  paymentMethods: ["pix", "credito", "dinheiro"],
  deliveryModes: ["entrega", "retirada"],
});

const valid = {
  name: "Maria",
  phone: "",
  delivery: "retirada",
  address: "",
  payment: "pix",
  needsChange: "nao",
  changeFor: "",
};

/** Retorna as mensagens de erro por campo */
function errorsOf(input: object): Record<string, string> {
  const result = schema.safeParse({ ...valid, ...input });
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

describe("validação do checkout", () => {
  it("aceita um pedido básico (telefone e endereço opcionais na retirada)", () => {
    expect(errorsOf({})).toEqual({});
  });

  it("exige nome", () => {
    expect(errorsOf({ name: "" }).name).toBeDefined();
    expect(errorsOf({ name: " a " }).name).toBeDefined();
    expect(errorsOf({ name: "x".repeat(81) }).name).toBeDefined();
  });

  it("valida o telefone só quando preenchido", () => {
    expect(errorsOf({ phone: "" }).phone).toBeUndefined();
    expect(errorsOf({ phone: "(21) 99999-8888" }).phone).toBeUndefined();
    expect(errorsOf({ phone: "12345" }).phone).toBeDefined();
  });

  it("exige endereço somente na entrega", () => {
    expect(errorsOf({ delivery: "retirada", address: "" }).address).toBeUndefined();
    expect(errorsOf({ delivery: "entrega", address: "" }).address).toBeDefined();
    expect(errorsOf({ delivery: "entrega", address: "Rua 1" }).address).toBeDefined();
    expect(
      errorsOf({ delivery: "entrega", address: "Rua das Flores, 10 - Centro" }).address,
    ).toBeUndefined();
  });

  it("só aceita formas de pagamento e recebimento habilitadas pela loja", () => {
    expect(errorsOf({ payment: "" }).payment).toBeDefined();
    expect(errorsOf({ payment: "debito" }).payment).toBeDefined(); // não habilitado
    expect(errorsOf({ delivery: "voando" }).delivery).toBeDefined();
  });

  it("valida o troco quando o pagamento é em dinheiro", () => {
    const cash = { payment: "dinheiro", needsChange: "sim" };
    expect(errorsOf({ ...cash, changeFor: "" }).changeFor).toBeDefined();
    expect(errorsOf({ ...cash, changeFor: "abc" }).changeFor).toBeDefined();
    expect(errorsOf({ ...cash, changeFor: "100" }).changeFor).toBeDefined(); // menor que o total
    expect(errorsOf({ ...cash, changeFor: "150,00" }).changeFor).toBeDefined(); // igual ao total
    expect(errorsOf({ ...cash, changeFor: "200,00" }).changeFor).toBeUndefined();
    expect(errorsOf({ ...cash, changeFor: "R$ 200" }).changeFor).toBeUndefined();
  });

  it("ignora o campo de troco quando não é necessário", () => {
    expect(errorsOf({ payment: "dinheiro", needsChange: "nao", changeFor: "" })).toEqual({});
    expect(errorsOf({ payment: "pix", needsChange: "sim", changeFor: "" })).toEqual({});
  });
});
