"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductImage } from "@/components/catalog/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { removeImages } from "@/lib/admin-storage";
import { formatBRL } from "@/lib/currency";
import { refreshPublicCatalog } from "@/lib/revalidate-client";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/types";

export function ProductList({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  const toggleAvailable = async (product: Product) => {
    setBusyId(product.id);
    const { error } = await createClient()
      .from("products")
      .update({ available: !product.available, updated_at: new Date().toISOString() })
      .eq("id", product.id);
    setBusyId(null);
    if (error) {
      toast("Não foi possível alterar a disponibilidade.", "error");
      return;
    }
    toast(product.available ? "Produto marcado como indisponível" : "Produto disponível novamente");
    await refreshPublicCatalog();
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    const { error } = await createClient().from("products").delete().eq("id", toDelete.id);
    setBusyId(null);
    if (error) {
      toast("Não foi possível excluir o produto.", "error");
      return;
    }
    await removeImages(toDelete.images);
    toast("Produto excluído");
    setToDelete(null);
    await refreshPublicCatalog();
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produtos ({products.length})</h1>
        <Link href="/admin/produtos/novo" className={buttonClasses({ size: "md" })}>
          <Plus className="h-5 w-5" aria-hidden />
          Novo produto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="text-lg font-bold">Nenhum produto cadastrado</p>
          <p className="mt-1 text-muted">Cadastre o primeiro produto para ele aparecer no catálogo.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ProductImage src={p.images[0]} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate font-bold">{p.name}</p>
                  <p className="text-sm text-muted">
                    {formatBRL(p.price)} · {categoryName(p.category_id)}
                  </p>
                  <Badge tone={p.available ? "success" : "danger"} className="mt-1">
                    {p.available ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={p.available}
                    disabled={busyId === p.id}
                    onChange={() => void toggleAvailable(p)}
                    className="h-5 w-5 accent-[var(--brand)]"
                  />
                  Disponível
                </label>
                <Link
                  href={`/admin/produtos/${p.id}`}
                  className={buttonClasses({ variant: "secondary", size: "md" })}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Editar
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => setToDelete(p)}
                  aria-label={`Excluir ${p.name}`}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Excluir produto?">
        <p className="text-muted">
          <strong className="text-foreground">{toDelete?.name}</strong> será removido do catálogo e
          suas fotos serão apagadas. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button variant="danger" size="lg" fullWidth loading={busyId === toDelete?.id} onClick={confirmDelete}>
            Sim, excluir
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
