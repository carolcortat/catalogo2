import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Proteção otimista da área administrativa e renovação da sessão do Supabase.
 * A verificação definitiva continua no layout do painel, na rota de atualização
 * e nas regras de segurança do banco (RLS): o proxy sozinho não é a barreira final.
 */
export async function proxy(request: NextRequest) {
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  // Sem Supabase configurado, o próprio /admin mostra o aviso de configuração
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    // Preserva cookies renovados na resposta de redirecionamento
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (user && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
