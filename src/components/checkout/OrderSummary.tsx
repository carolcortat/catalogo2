import { formatBRL, parseBRL } from "@/lib/currency";
import type { OrderData } from "@/lib/whatsapp";
import { cartCount, cartSubtotal, itemTotal } from "@/store/cart";
import { PAYMENT_LABELS } from "@/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold sm:text-right">{children}</dd>
    </div>
  );
}

/** Resumo completo do pedido, mostrado antes do envio pelo WhatsApp. */
export function OrderSummary({ order }: { order: OrderData }) {
  const { items } = order;
  const subtotal = cartSubtotal(items);
  const count = cartCount(items);
  const changeAmount = parseBRL(order.changeFor ?? "");

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="sum-products" className="rounded-2xl border border-line bg-surface p-4">
        <h2 id="sum-products" className="mb-3 text-lg font-extrabold">
          Produtos ({count} {count === 1 ? "item" : "itens"})
        </h2>
        <ul className="flex flex-col divide-y divide-line">
          {items.map((item) => {
            const options = Object.entries(item.variants);
            return (
              <li key={item.key} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {item.quantity}x {item.name}
                  </p>
                  <p className="text-sm text-muted">{formatBRL(item.price)} cada</p>
                  {options.length > 0 && (
                    <p className="text-sm">
                      {options.map(([n, v]) => `${n}: ${v}`).join(" · ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-sm">
                      <span className="font-semibold">Obs.:</span> {item.note}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-bold">{formatBRL(itemTotal(item))}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="sum-details" className="rounded-2xl border border-line bg-surface p-4">
        <h2 id="sum-details" className="mb-3 text-lg font-extrabold">
          Dados do pedido
        </h2>
        <dl className="flex flex-col gap-3">
          <Row label="Nome">{order.customerName}</Row>
          {order.customerPhone && <Row label="Telefone">{order.customerPhone}</Row>}
          <Row label="Recebimento">{order.delivery === "entrega" ? "Entrega" : "Retirada"}</Row>
          {order.delivery === "entrega" && order.address && (
            <Row label="Endereço">{order.address}</Row>
          )}
          <Row label="Pagamento">{PAYMENT_LABELS[order.payment]}</Row>
          {order.payment === "dinheiro" && (
            <Row label="Troco">
              {order.needsChange && Number.isFinite(changeAmount)
                ? `Para ${formatBRL(changeAmount)}`
                : "Não preciso de troco"}
            </Row>
          )}
          {order.generalNote && <Row label="Observações gerais">{order.generalNote}</Row>}
        </dl>
      </section>

      <section aria-label="Valores" className="rounded-2xl bg-black/5 p-4">
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatBRL(subtotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-2">
            <dt className="text-lg font-bold">Total</dt>
            <dd className="text-3xl font-extrabold text-brand">{formatBRL(subtotal)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
