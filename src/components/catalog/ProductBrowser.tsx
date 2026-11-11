"use client";

import clsx from "clsx";
import { PackageSearch, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/types";
import { ProductCard } from "./ProductCard";

const ALL = "all";

/** Remove acentos e ignora maiúsculas para a busca ("cafe" encontra "Café"). */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function Grid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

/** Busca, filtro por categoria e listagem dos produtos (agrupados por categoria). */
export function ProductBrowser({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);

  // Só exibe chips de categorias que têm produtos
  const visibleCategories = useMemo(
    () => categories.filter((c) => products.some((p) => p.category_id === c.id)),
    [categories, products],
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    return products.filter((p) => {
      if (categoryId !== ALL && p.category_id !== categoryId) return false;
      if (!q) return true;
      return normalize(`${p.name} ${p.description}`).includes(q);
    });
  }, [products, query, categoryId]);

  // Disponíveis primeiro, mantendo a ordem original dentro de cada grupo
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => Number(b.available) - Number(a.available)),
    [filtered],
  );

  const grouped = categoryId === ALL && !query.trim();

  const sections = useMemo(() => {
    if (!grouped) return [];
    const result: { id: string; title: string; items: Product[] }[] = [];
    for (const c of visibleCategories) {
      const items = sorted.filter((p) => p.category_id === c.id);
      if (items.length) result.push({ id: c.id, title: c.name, items });
    }
    const known = new Set(visibleCategories.map((c) => c.id));
    const others = sorted.filter((p) => !p.category_id || !known.has(p.category_id));
    if (others.length) result.push({ id: "outros", title: "Outros produtos", items: others });
    return result;
  }, [grouped, sorted, visibleCategories]);

  const hasResults = sorted.length > 0;

  return (
    <div>
      {/* Barra fixa de busca e categorias */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-background/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produtos..."
            aria-label="Buscar produtos"
            className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-11 text-base placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {visibleCategories.length > 0 && (
          <div
            role="group"
            aria-label="Filtrar por categoria"
            className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[{ id: ALL, name: "Todos" }, ...visibleCategories].map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  aria-pressed={active}
                  className={clsx(
                    "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
                    active
                      ? "border-brand bg-brand text-brand-contrast"
                      : "border-line bg-surface hover:bg-black/5",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5" aria-live="polite">
        {!hasResults ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
            <PackageSearch className="h-10 w-10 text-muted" aria-hidden />
            <p className="text-lg font-bold">Nenhum produto encontrado</p>
            <p className="text-sm text-muted">
              Tente outra palavra ou escolha a categoria &quot;Todos&quot;.
            </p>
            {(query || categoryId !== ALL) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategoryId(ALL);
                }}
                className="mt-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-8">
            {sections.map((s) => (
              <section key={s.id} aria-labelledby={`cat-${s.id}`}>
                <h2 id={`cat-${s.id}`} className="mb-3 text-xl font-extrabold">
                  {s.title}
                </h2>
                <Grid products={s.items} />
              </section>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">
              {sorted.length} {sorted.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
            <Grid products={sorted} />
          </>
        )}
      </div>
    </div>
  );
}
