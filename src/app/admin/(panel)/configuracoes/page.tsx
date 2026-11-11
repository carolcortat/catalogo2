import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { DEMO_STORE } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethodId, StoreSettings } from "@/types";

export const metadata: Metadata = { title: "Configurações da loja" };

const VALID: PaymentMethodId[] = ["pix", "credito", "debito", "dinheiro"];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();

  // Na primeira vez, começa dos valores de exemplo, sem WhatsApp preenchido
  const base: StoreSettings = { ...DEMO_STORE, whatsapp_number: "" };
  const settings: StoreSettings = data
    ? {
        ...base,
        ...data,
        payment_methods: ((data.payment_methods ?? []) as string[]).filter((p): p is PaymentMethodId =>
          VALID.includes(p as PaymentMethodId),
        ),
      }
    : base;

  return <SettingsForm settings={settings} />;
}
