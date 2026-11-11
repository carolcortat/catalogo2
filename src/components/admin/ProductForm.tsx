"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatOptions, priceToInput, productToPayload } from "@/lib/admin";
import { removeImages } from "@/lib/admin-storage";
import { refreshPublicCatalog } from "@/lib/revalidate-client";
import { createClient } from "@/lib/supabase/client";
import { productSchema, type ProductFormValues } from "@/lib/validators";
import type { Category, Product } from "@/types";
import { ImageUploader } from "./ImageUploader";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      category_id: product?.category_id ?? "",
      price: product ? priceToInput(product.price) : "",
      description: product?.description ?? "",
      available: product?.available ?? true,
      variants: (product?.variants ?? []).map((v) => ({
        name: v.name,
        options: formatOptions(v.options),
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const onSubmit = handleSubmit(
    async (values) => {
      setSaving(true);
      const payload = productToPayload(values, images);
      const supabase = createClient();

      const { error } = product
        ? await supabase
            .from("products")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", product.id)
        : await supabase.from("products").insert(payload);

      if (error) {
        setSaving(false);
        toast("Não foi possível salvar o produto. Tente novamente.", "error");
        return;
      }

      // Apaga do armazenamento as fotos que o vendedor removeu
      if (product) await removeImages(product.images.filter((u) => !images.includes(u)));

      await refreshPublicCatalog();
      toast(product ? "Produto atualizado" : "Produto cadastrado");
      router.push("/admin");
      router.refresh();
    },
    () => toast("Confira os campos destacados", "error"),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-extrabold">{product ? "Editar produto" : "Novo produto"}</h1>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <legend className="px-1 text-lg font-extrabold">Informações</legend>
        <Input id="name" label="Nome" error={errors.name?.message} {...register("name")} />
        <Input
          id="price"
          label="Preço (R$)"
          inputMode="decimal"
          placeholder="45,90"
          error={errors.price?.message}
          {...register("price")}
        />
        <Select id="category_id" label="Categoria" {...register("category_id")}>
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Textarea
          id="description"
          label="Descrição"
          rows={5}
          error={errors.description?.message}
          {...register("description")}
        />
        <label className="flex min-h-11 items-center gap-3 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" {...register("available")} />
          Produto disponível para pedidos
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-surface p-4">
        <legend className="px-1 text-lg font-extrabold">Fotos</legend>
        <ImageUploader
          label="Fotos do produto"
          value={images}
          onChange={setImages}
          folder="products"
          hint="A primeira foto é a capa. JPG, PNG, WebP ou GIF, até 5 MB cada."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <legend className="px-1 text-lg font-extrabold">Variações (opcional)</legend>
        <p className="text-sm text-muted">
          Use para cor, tamanho, modelo etc. Separe as opções por vírgula. O cliente precisará
          escolher uma opção de cada variação.
        </p>

        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-3 rounded-2xl bg-black/5 p-3">
            <Input
              id={`variants-${index}-name`}
              label="Nome da variação"
              placeholder="Ex.: Cor"
              error={errors.variants?.[index]?.name?.message}
              {...register(`variants.${index}.name`)}
            />
            <Input
              id={`variants-${index}-options`}
              label="Opções"
              placeholder="Ex.: Rosa, Azul, Verde"
              error={errors.variants?.[index]?.options?.message}
              {...register(`variants.${index}.options`)}
            />
            <Button variant="ghost" size="sm" onClick={() => remove(index)} className="self-end text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden />
              Remover variação
            </Button>
          </div>
        ))}
        {errors.variants?.message && (
          <p role="alert" className="text-sm text-red-600">
            {errors.variants.message}
          </p>
        )}
        {fields.length < 5 && (
          <Button variant="secondary" onClick={() => append({ name: "", options: "" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar variação
          </Button>
        )}
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" size="lg" fullWidth loading={saving}>
          Salvar produto
        </Button>
        <Link href="/admin" className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
