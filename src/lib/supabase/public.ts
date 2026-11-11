import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente somente-leitura, sem cookies, para as páginas públicas.
 * Como não depende da sessão, as páginas podem ser pré-renderizadas e
 * revalidadas por tempo (ISR), o que deixa o catálogo muito rápido.
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
