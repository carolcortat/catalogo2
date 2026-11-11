import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Meu pedido",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-extrabold">Meu pedido</h1>
      <CartView />
    </div>
  );
}
