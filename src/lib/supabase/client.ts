import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Cliente do Supabase para uso em componentes do navegador (admin). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
}
