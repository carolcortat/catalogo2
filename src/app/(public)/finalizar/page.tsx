import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getStoreSettings } from "@/lib/data";

// Deve ser um número literal (o Next analisa este valor em tempo de build)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const store = await getStoreSettings();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-extrabold">Finalizar pedido</h1>
      <CheckoutView store={store} />
    </div>
  );
}
