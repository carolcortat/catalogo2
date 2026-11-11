import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/server";

// A área administrativa não deve aparecer em buscadores
export const metadata: Metadata = {
  title: { default: "Painel do vendedor", template: "%s | Painel" },
  robots: { index: false, follow: false },
};

function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-extrabold">Painel ainda não configurado</h1>
      <p className="text-muted">
        Para usar o painel do vendedor, conecte o projeto ao Supabase (login, banco de dados e
        imagens). São 3 passos:
      </p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Crie um projeto gratuito em <strong>supabase.com</strong> e execute o arquivo{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5">supabase/migrations/001_init.sql</code>{" "}
          no SQL Editor.
        </li>
        <li>
          Em <strong>Authentication &gt; Users</strong>, crie o usuário do vendedor (e-mail e senha).
        </li>
        <li>
          Copie <code className="rounded bg-black/5 px-1.5 py-0.5">.env.example</code> para{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5">.env.local</code>, preencha as chaves e
          reinicie o servidor.
        </li>
      </ol>
      <p className="text-sm text-muted">
        Enquanto isso, o catálogo público funciona com produtos de demonstração.
      </p>
    </div>
  );
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{hasSupabaseEnv() ? children : <SetupNotice />}</div>;
}
