/**
 * Variáveis públicas do Supabase.
 * Aceita o nome novo (PUBLISHABLE_KEY, formato sb_publishable_...) e o antigo (ANON_KEY).
 * Cada variável precisa ser lida de forma literal para o Next.js conseguir embuti-la no build.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}
