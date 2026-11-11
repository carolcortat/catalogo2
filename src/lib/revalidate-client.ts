/**
 * Pede ao servidor para atualizar o catálogo público após uma alteração no painel.
 * Falhas são ignoradas de propósito: o catálogo se atualiza sozinho em até 1 minuto.
 */
export async function refreshPublicCatalog(): Promise<void> {
  try {
    await fetch("/api/revalidate", { method: "POST" });
  } catch {
    // sem rede ou rota indisponível: a revalidação por tempo cuida do resto
  }
}
