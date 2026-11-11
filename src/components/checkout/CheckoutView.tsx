"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  QrCode,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatBRL } from "@/lib/currency";
import { buildCheckoutSchema, type CheckoutValues } from "@/lib/validators";
import {
  MAX_WHATSAPP_URL_LENGTH,
  buildOrderMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppNumber,
  type OrderData,
} from "@/lib/whatsapp";
import { cartSubtotal, useCart } from "@/store/cart";
import { useCartHydrated } from "@/store/useCartHydration";
import {
  PAYMENT_LABELS,
  type CartItem,
  type DeliveryMode,
  type PaymentMethodId,
  type StoreSettings,
} from "@/types";
import { OptionCard } from "./OptionCard";
import { OrderSummary } from "./OrderSummary";

type Step = "form" | "review" | "sent";

const ALL_PAYMENTS: PaymentMethodId[] = ["pix", "credito", "debito", "dinheiro"];

const PAYMENT_ICONS: Record<PaymentMethodId, ReactNode> = {
  pix: <QrCode className="h-6 w-6" aria-hidden />,
  credito: <CreditCard className="h-6 w-6" aria-hidden />,
  debito: <CreditCard className="h-6 w-6" aria-hidden />,
  dinheiro: <Banknote className="h-6 w-6" aria-hidden />,
};

function toOrder(values: CheckoutValues, items: CartItem[], generalNote: string): OrderData {
  const payment = values.payment as PaymentMethodId;
  return {
    items,
    customerName: values.name,
    customerPhone: values.phone,
    delivery: values.delivery as DeliveryMode,
    address: values.address,
    payment,
    needsChange: payment === "dinheiro" && values.needsChange === "sim",
    changeFor: values.changeFor,
    generalNote,
  };
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <legend className="px-1 text-lg font-extrabold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function CheckoutView({ store }: { store: StoreSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const generalNote = useCart((s) => s.generalNote);
  const clear = useCart((s) => s.clear);

  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<CheckoutValues | null>(null);

  const subtotal = cartSubtotal(items);

  const deliveryModes = useMemo<DeliveryMode[]>(() => {
    const modes: DeliveryMode[] = [];
    if (store.accepts_delivery) modes.push("entrega");
    if (store.accepts_pickup) modes.push("retirada");
    return modes.length > 0 ? modes : ["entrega", "retirada"];
  }, [store.accepts_delivery, store.accepts_pickup]);

  const paymentMethods = useMemo<PaymentMethodId[]>(
    () => (store.payment_methods.length > 0 ? store.payment_methods : ALL_PAYMENTS),
    [store.payment_methods],
  );

  const schema = useMemo(
    () => buildCheckoutSchema({ total: subtotal, paymentMethods, deliveryModes }),
    [subtotal, paymentMethods, deliveryModes],
  );

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      delivery: deliveryModes[0],
      address: "",
      payment: "",
      needsChange: "nao",
      changeFor: "",
    },
  });
  const { register, formState } = form;
  const errors = formState.errors;
  const delivery = useWatch({ control: form.control, name: "delivery" });
  const payment = useWatch({ control: form.control, name: "payment" });
  const needsChange = useWatch({ control: form.control, name: "needsChange" });

  const order = useMemo(
    () => (values ? toOrder(values, items, generalNote) : null),
    [values, items, generalNote],
  );
  const sellerConfigured = normalizeWhatsAppNumber(store.whatsapp_number) !== "";
  const whatsappUrl = useMemo(
    () => (order ? buildWhatsAppUrl(store.whatsapp_number, buildOrderMessage(order)) : null),
    [order, store.whatsapp_number],
  );
  const tooLong = whatsappUrl !== null && whatsappUrl.length > MAX_WHATSAPP_URL_LENGTH;
  const canSend = whatsappUrl !== null && !tooLong;

  const goTo = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = form.handleSubmit(
    (v) => {
      setValues(v);
      goTo("review");
    },
    () => toast("Confira os campos destacados", "error"),
  );

  // Enquanto lê o localStorage, mostra um esqueleto
  if (!hydrated) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5" />
        ))}
      </div>
    );
  }

  // ---------- Etapa 3: pedido aberto no WhatsApp ----------
  if (step === "sent" && order && whatsappUrl) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-6 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-600" aria-hidden />
        <h2 className="text-2xl font-extrabold">Falta só um passo!</h2>
        <p className="text-muted">
          Abrimos o WhatsApp com o seu pedido pronto. Para concluir, toque em{" "}
          <strong className="text-foreground">Enviar</strong> na conversa com a loja.
        </p>
        <div className="flex w-full flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "whatsapp", size: "lg", fullWidth: true })}
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Abrir o WhatsApp novamente
          </a>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {
              clear();
              toast("Pedido finalizado. Obrigado!");
              router.push("/");
            }}
          >
            Já enviei! Começar novo pedido
          </Button>
          <Button variant="ghost" fullWidth onClick={() => goTo("review")}>
            Voltar e revisar o pedido
          </Button>
        </div>
        <p className="text-xs text-muted">
          Seu carrinho continua guardado até você tocar em &quot;Já enviei&quot;.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <h2 className="text-xl font-extrabold">Seu pedido está vazio</h2>
        <p className="max-w-sm text-muted">Adicione produtos antes de finalizar o pedido.</p>
        <Link href="/" className={buttonClasses({ size: "lg" })}>
          Ver produtos
        </Link>
      </div>
    );
  }

  // ---------- Etapa 2: resumo para conferência ----------
  const review = step === "review" && order;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {review ? (
        <>
          <div role="note" className="rounded-2xl bg-brand/10 p-4 text-sm">
            <strong>Confira seu pedido.</strong> Ele só será enviado quando você tocar em
            &quot;Enviar&quot; na conversa do WhatsApp.
          </div>

          <OrderSummary order={order} />

          {!sellerConfigured && (
            <div role="alert" className="flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              Esta loja ainda não configurou o WhatsApp para receber pedidos. Tente novamente mais
              tarde.
            </div>
          )}
          {tooLong && (
            <div role="alert" className="flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              Seu pedido ficou grande demais para uma única mensagem. Divida em dois pedidos.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {canSend ? (
              <a
                href={whatsappUrl!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setStep("sent")}
                className={buttonClasses({ variant: "whatsapp", size: "lg", fullWidth: true })}
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                Enviar pedido pelo WhatsApp
              </a>
            ) : (
              <Button variant="whatsapp" size="lg" fullWidth disabled>
                <MessageCircle className="h-5 w-5" aria-hidden />
                Enviar pedido pelo WhatsApp
              </Button>
            )}
            <Button variant="secondary" size="lg" fullWidth onClick={() => goTo("form")}>
              <ArrowLeft className="h-5 w-5" aria-hidden />
              Voltar e editar
            </Button>
          </div>
        </>
      ) : null}

      {/* O formulário continua montado (apenas oculto) para não perder o que foi digitado */}
      <form onSubmit={onSubmit} noValidate hidden={Boolean(review)} className="flex flex-col gap-5">
        <Link
          href="/carrinho"
          className="inline-flex w-fit items-center gap-2 py-2 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao pedido
        </Link>

        <FormSection title="Seus dados">
          <Input
            id="name"
            label="Nome"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            id="phone"
            label="Telefone para contato"
            optional
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(21) 99999-8888"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </FormSection>

        <FormSection title="Como você quer receber?">
          <div className="grid gap-2 sm:grid-cols-2">
            {deliveryModes.includes("entrega") && (
              <OptionCard
                label="Entrega"
                description="Receba no seu endereço"
                icon={<Truck className="h-6 w-6" aria-hidden />}
                value="entrega"
                {...register("delivery")}
              />
            )}
            {deliveryModes.includes("retirada") && (
              <OptionCard
                label="Retirada"
                description="Busque com a loja"
                icon={<Store className="h-6 w-6" aria-hidden />}
                value="retirada"
                {...register("delivery")}
              />
            )}
          </div>
          {errors.delivery?.message && (
            <p role="alert" className="text-sm text-red-600">
              {errors.delivery.message}
            </p>
          )}
          {delivery === "entrega" && (
            <Textarea
              id="address"
              label="Endereço de entrega"
              rows={2}
              autoComplete="street-address"
              placeholder="Rua, número, bairro e complemento"
              error={errors.address?.message}
              {...register("address")}
            />
          )}
        </FormSection>

        <FormSection title="Forma de pagamento">
          <div className="grid gap-2 sm:grid-cols-2">
            {paymentMethods.map((method) => (
              <OptionCard
                key={method}
                label={PAYMENT_LABELS[method]}
                icon={PAYMENT_ICONS[method]}
                value={method}
                {...register("payment")}
              />
            ))}
          </div>
          {errors.payment?.message && (
            <p role="alert" className="text-sm text-red-600">
              {errors.payment.message}
            </p>
          )}

          {payment === "dinheiro" && (
            <div className="flex flex-col gap-3 rounded-2xl bg-black/5 p-3">
              <p className="text-sm font-semibold">Você precisa de troco?</p>
              <div className="grid grid-cols-2 gap-2">
                <OptionCard label="Não" value="nao" {...register("needsChange")} />
                <OptionCard label="Sim" value="sim" {...register("needsChange")} />
              </div>
              {needsChange === "sim" && (
                <Input
                  id="changeFor"
                  label="Troco para quanto?"
                  inputMode="decimal"
                  placeholder="Ex.: 200,00"
                  hint={`Total do pedido: ${formatBRL(subtotal)}`}
                  error={errors.changeFor?.message}
                  {...register("changeFor")}
                />
              )}
            </div>
          )}
        </FormSection>

        <div className="flex items-baseline justify-between rounded-2xl bg-black/5 px-4 py-3">
          <span className="font-bold">Total do pedido</span>
          <span className="text-2xl font-extrabold text-brand">{formatBRL(subtotal)}</span>
        </div>

        <Button type="submit" size="lg" fullWidth>
          Revisar pedido
        </Button>
      </form>
    </div>
  );
}
