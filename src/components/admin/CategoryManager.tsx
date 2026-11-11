"use client";

import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { refreshPublicCatalog } from "@/lib/revalidate-client";
import { createClient } from "@/lib/supabase/client";
import { categorySchema } from "@/lib/validators";
import type { Category } from "@/types";

export function CategoryManager({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const done = async (message: string) => {
    toast(message);
    await refreshPublicCatalog();
    router.refresh();
  };

  const parseName = (name: string): string | null => {
    const r = categorySchema.safeParse({ name });
    if (!r.success) {
      toast(r.error.issues[0].message, "error");
      return null;
    }
    return r.data.name;
  };

  const exists = (name: string, ignoreId?: string) =>
    categories.some((c) => c.id !== ignoreId && c.name.toLowerCase() === name.toLowerCase());

  const add = async () => {
    const name = parseName(newName);
    if (!name) return;
    if (exists(name)) return toast("Já existe uma categoria com esse nome", "error");
    setBusy(true);
    const position = categories.reduce((max, c) => Math.max(max, c.position), 0) + 1;
    const { error } = await createClient().from("categories").insert({ name, position });
    setBusy(false);
    if (error) return toast("Não foi possível criar a categoria.", "error");
    setNewName("");
    await done("Categoria criada");
  };

  const saveEdit = async (id: string) => {
    const name = parseName(editName);
    if (!name) return;
    if (exists(name, id)) return toast("Já existe uma categoria com esse nome", "error");
    setBusy(true);
    const { error } = await createClient().from("categories").update({ name }).eq("id", id);
    setBusy(false);
    if (error) return toast("Não foi possível renomear a categoria.", "error");
    setEditingId(null);
    await done("Categoria renomeada");
  };

  /** Troca a posição com a categoria vizinha (as posições são regravadas em sequência). */
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    const supabase = createClient();
    const results = await Promise.all(
      reordered.map((c, i) => supabase.from("categories").update({ position: i + 1 }).eq("id", c.id)),
    );
    setBusy(false);
    if (results.some((r) => r.error)) return toast("Não foi possível reordenar.", "error");
    await done("Ordem atualizada");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await createClient().from("categories").delete().eq("id", toDelete.id);
    setBusy(false);
    if (error) return toast("Não foi possível excluir a categoria.", "error");
    setToDelete(null);
    await done("Categoria excluída");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-extrabold">Categorias</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
        className="flex gap-2"
      >
        <label htmlFor="new-category" className="sr-only">
          Nome da nova categoria
        </label>
        <input
          id="new-category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={60}
          placeholder="Nova categoria (ex.: Cadernos)"
          className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <Button type="submit" size="lg" loading={busy && newName !== ""}>
          <Plus className="h-5 w-5" aria-hidden />
          Criar
        </Button>
      </form>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-muted">
          Nenhuma categoria ainda. Crie a primeira acima.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2.5">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => void move(i, -1)}
                  disabled={busy || i === 0}
                  aria-label={`Subir ${c.name}`}
                  className="rounded p-1 hover:bg-black/5 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => void move(i, 1)}
                  disabled={busy || i === categories.length - 1}
                  aria-label={`Descer ${c.name}`}
                  className="rounded p-1 hover:bg-black/5 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {editingId === c.id ? (
                <>
                  <input
                    autoFocus
                    aria-label={`Novo nome para ${c.name}`}
                    value={editName}
                    maxLength={60}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveEdit(c.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-line px-3 focus:border-brand focus:outline-none"
                  />
                  <Button size="sm" onClick={() => void saveEdit(c.id)} aria-label="Salvar nome" loading={busy}>
                    <Check className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} aria-label="Cancelar">
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? "produto" : "produtos"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Renomear ${c.name}`}
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-red-600"
                    aria-label={`Excluir ${c.name}`}
                    onClick={() => setToDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Excluir categoria?">
        <p className="text-muted">
          A categoria <strong className="text-foreground">{toDelete?.name}</strong> será removida. Os
          produtos dela <strong>não</strong> serão excluídos: ficam em &quot;Outros produtos&quot;.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button variant="danger" size="lg" fullWidth loading={busy} onClick={confirmDelete}>
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
