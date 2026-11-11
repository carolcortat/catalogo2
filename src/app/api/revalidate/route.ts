import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

/**
 * O painel chama esta rota depois de salvar algo, para o catálogo público
 * refletir a mudança imediatamente (em vez de esperar a revalidação por tempo).
 * Somente o vendedor autenticado pode usá-la.
 */
export async function POST() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
