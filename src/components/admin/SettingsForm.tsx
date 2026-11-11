"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { removeImages } from "@/lib/admin-storage";
import { refreshPublicCatalog } from "@/lib/revalidate-client";
import { createClient } from "@/lib/supabase/client";
import { settingsSchema, type SettingsFormValues } from "@/lib/validators";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { PAYMENT_LABELS, type PaymentMethodId, type StoreSettings } from "@/types";
import { ImageUploader } from "./ImageUploader";

const PAYMENT_IDS = Object.keys(PAYMENT_LABELS) as PaymentMethodId[];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <legend className="px-1 text-lg font-extrabold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [logo, setLogo] = useState<string[]>(settings.logo_url ? [settings.logo_url] : []);
  const [banner, setBanner] = useState<string[]>(
    settings.banner_image_url ? [settings.banner_image_url] : [],
  );
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      store_name: settings.store_name,
      tagline: settings.tagline,
      brand_color: settings.brand_color,
      banner_title: settings.banner_title,
      banner_text: settings.banner_text,
      whatsapp_number: settings.whatsapp_number,
      payment_methods: settings.payment_methods,
      accepts_delivery: settings.accepts_delivery,
      accepts_pickup: settings.accepts_pickup,
      store_info: settings.store_info,
    },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      setSaving(true);
      const newLogo = logo[0] ?? null;
      const newBanner = banner[0] ?? null;

      const { error } = await createClient()
        .from("store_settings")
        .update({
          ...values,
          // Salva só os dígitos, já com DDI (formato do wa.me)
          whatsapp_number: normalizeWhatsAppNumber(values.whatsapp_number),
          logo_url: newLogo,
          banner_image_url: newBanner,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      setSaving(false);
      if (error) {
        toast("Não foi possível salvar as configurações.", "error");
        return;
      }

      // Limpa do armazenamento imagens substituídas ou removidas
      const old = [settings.logo_url, settings.banner_image_url].filter((u): u is string => !!u);
      await removeImages(old.filter((u) => u !== newLogo && u !== newBanner));

      await refreshPublicCatalog();
      toast("Configurações salvas");
      router.refresh();
    },
    () => toast("Confira os campos destacados", "error"),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-extrabold">Configurações da loja</h1>

      <Section title="Identidade da loja">
        <Input id="store_name" label="Nome da loja" error={errors.store_name?.message} {...register("store_name")} />
        <Input
          id="tagline"
          label="Slogan"
          optional
          placeholder="Ex.: Artigos personalizados feitos com carinho"
          error={errors.tagline?.message}
          {...register("tagline")}
        />
        <ImageUploader label="Logotipo" value={logo} onChange={setLogo} folder="store" max={1} hint="Imagem quadrada funciona melhor." />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="brand_color" className="text-sm font-semibold">
            Cor principal
          </label>
          <input
            id="brand_color"
            type="color"
            className="h-12 w-24 cursor-pointer rounded-xl border border-line bg-surface p-1"
            {...register("brand_color")}
          />
          {errors.brand_color && (
            <p role="alert" className="text-sm text-red-600">
              {errors.brand_color.message}
            </p>
          )}
        </div>
      </Section>

      <Section title="Banner de promoções">
        <Input id="banner_title" label="Título" optional error={errors.banner_title?.message} {...register("banner_title")} />
        <Textarea id="banner_text" label="Texto" optional rows={2} error={errors.banner_text?.message} {...register("banner_text")} />
        <ImageUploader label="Imagem do banner" value={banner} onChange={setBanner} folder="store" max={1} hint="Opcional. Imagens horizontais ficam melhores." />
      </Section>

      <Section title="WhatsApp para receber pedidos">
        <Input
          id="whatsapp_number"
          label="Número do WhatsApp"
          type="tel"
          inputMode="tel"
          placeholder="(21) 99999-8888"
          hint="Com DDD. Se não informar o código do país, usamos o do Brasil (+55)."
          error={errors.whatsapp_number?.message}
          {...register("whatsapp_number")}
        />
      </Section>

      <Section title="Pagamento e recebimento">
        <Controller
          control={control}
          name="payment_methods"
          render={({ field }) => (
            <div role="group" aria-label="Formas de pagamento aceitas" className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Formas de pagamento aceitas</span>
              {PAYMENT_IDS.map((id) => (
                <label key={id} className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--brand)]"
                    checked={field.value.includes(id)}
                    onChange={(e) =>
                      field.onChange(
                        e.target.checked ? [...field.value, id] : field.value.filter((v) => v !== id),
                      )
                    }
                  />
                  {PAYMENT_LABELS[id]}
                </label>
              ))}
              {errors.payment_methods?.message && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.payment_methods.message}
                </p>
              )}
            </div>
          )}
        />
        <div role="group" aria-label="Formas de recebimento" className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Formas de recebimento</span>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" {...register("accepts_delivery")} />
            Entrega
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" {...register("accepts_pickup")} />
            Retirada
          </label>
          {errors.accepts_delivery?.message && (
            <p role="alert" className="text-sm text-red-600">
              {errors.accepts_delivery.message}
            </p>
          )}
        </div>
      </Section>

      <Section title="Informações da loja">
        <Textarea
          id="store_info"
          label="Horário de atendimento, endereço etc."
          optional
          rows={3}
          error={errors.store_info?.message}
          {...register("store_info")}
        />
      </Section>

      <Button type="submit" size="lg" fullWidth loading={saving}>
        Salvar configurações
      </Button>
    </form>
  );
}
