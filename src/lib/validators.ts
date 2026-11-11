import { z } from "zod";
import { parseOptions } from "@/lib/admin";
import { isHexColor } from "@/lib/color";
import { formatBRL, parseBRL } from "@/lib/currency";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import type { DeliveryMode, PaymentMethodId } from "@/types";

interface CheckoutSchemaOptions {
  /** Total do pedido (para validar o valor do troco) */
  total: number;
  paymentMethods: PaymentMethodId[];
  deliveryModes: DeliveryMode[];
}

/** Remove caracteres de controle do texto digitado. */
const noControlChars = (v: string) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v);

export function buildCheckoutSchema({ total, paymentMethods, deliveryModes }: CheckoutSchemaOptions) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Informe seu nome")
        .max(80, "O nome pode ter no máximo 80 caracteres")
        .refine(noControlChars, "O nome contém caracteres inválidos"),
      phone: z
        .string()
        .trim()
        .max(25, "Telefone muito longo")
        .refine((v) => {
          if (v === "") return true; // opcional
          const digits = v.replace(/\D/g, "");
          return digits.length >= 10 && digits.length <= 13;
        }, "Telefone inválido. Informe o DDD e o número"),
      delivery: z.string().refine(
        (v) => deliveryModes.includes(v as DeliveryMode),
        "Escolha entrega ou retirada",
      ),
      address: z
        .string()
        .trim()
        .max(200, "O endereço pode ter no máximo 200 caracteres")
        .refine(noControlChars, "O endereço contém caracteres inválidos"),
      payment: z.string().refine(
        (v) => paymentMethods.includes(v as PaymentMethodId),
        "Escolha a forma de pagamento",
      ),
      needsChange: z.enum(["sim", "nao"]),
      changeFor: z.string().trim().max(20, "Valor muito longo"),
    })
    .superRefine((data, ctx) => {
      if (data.delivery === "entrega" && data.address.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["address"],
          message: "Informe o endereço completo para entrega (rua, número e bairro)",
        });
      }

      if (data.payment === "dinheiro" && data.needsChange === "sim") {
        const amount = parseBRL(data.changeFor);
        if (!Number.isFinite(amount)) {
          ctx.addIssue({
            code: "custom",
            path: ["changeFor"],
            message: "Informe para qual valor você precisa de troco",
          });
        } else if (amount <= total) {
          ctx.addIssue({
            code: "custom",
            path: ["changeFor"],
            message: `O valor deve ser maior que o total do pedido (${formatBRL(total)})`,
          });
        } else if (amount > 10000) {
          ctx.addIssue({
            code: "custom",
            path: ["changeFor"],
            message: "Valor muito alto. Confira se digitou corretamente",
          });
        }
      }
    });
}

export type CheckoutValues = z.infer<ReturnType<typeof buildCheckoutSchema>>;

// ---------------------------------------------------------------------------
// Painel administrativo
// ---------------------------------------------------------------------------

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do produto")
    .max(120, "O nome pode ter no máximo 120 caracteres"),
  category_id: z.string(),
  price: z
    .string()
    .trim()
    .refine((v) => {
      const n = parseBRL(v);
      return Number.isFinite(n) && n >= 0 && n <= 1_000_000;
    }, "Informe um preço válido (ex.: 45,90)"),
  description: z.string().trim().max(2000, "A descrição pode ter no máximo 2000 caracteres"),
  available: z.boolean(),
  variants: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Informe o nome da variação (ex.: Cor)")
          .max(40, "O nome da variação pode ter no máximo 40 caracteres"),
        options: z
          .string()
          .refine(
            (v) => parseOptions(v).length > 0,
            "Informe ao menos uma opção, separadas por vírgula",
          )
          .refine((v) => parseOptions(v).length <= 20, "Use no máximo 20 opções"),
      }),
    )
    .max(5, "Use no máximo 5 variações")
    .superRefine((variants, ctx) => {
      const seen = new Set<string>();
      variants.forEach((v, i) => {
        const key = v.name.trim().toLowerCase();
        if (key && seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "name"],
            message: "Já existe uma variação com esse nome",
          });
        }
        seen.add(key);
      });
    }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

const paymentEnum = z.enum(["pix", "credito", "debito", "dinheiro"]);

export const settingsSchema = z
  .object({
    store_name: z
      .string()
      .trim()
      .min(1, "Informe o nome da loja")
      .max(60, "O nome pode ter no máximo 60 caracteres"),
    tagline: z.string().trim().max(100, "O slogan pode ter no máximo 100 caracteres"),
    brand_color: z.string().refine(isHexColor, "Escolha uma cor válida"),
    banner_title: z.string().trim().max(80, "O título pode ter no máximo 80 caracteres"),
    banner_text: z.string().trim().max(200, "O texto pode ter no máximo 200 caracteres"),
    whatsapp_number: z
      .string()
      .trim()
      .refine(
        (v) => normalizeWhatsAppNumber(v) !== "",
        "Informe um WhatsApp válido, com DDD (ex.: 21 99999-8888)",
      ),
    payment_methods: z.array(paymentEnum).min(1, "Aceite ao menos uma forma de pagamento"),
    accepts_delivery: z.boolean(),
    accepts_pickup: z.boolean(),
    store_info: z.string().trim().max(300, "As informações podem ter no máximo 300 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (!data.accepts_delivery && !data.accepts_pickup) {
      ctx.addIssue({
        code: "custom",
        path: ["accepts_delivery"],
        message: "Habilite entrega, retirada ou as duas",
      });
    }
  });

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da categoria")
    .max(60, "O nome pode ter no máximo 60 caracteres"),
});
