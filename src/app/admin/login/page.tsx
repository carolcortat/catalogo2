import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Painel do vendedor</h1>
        <p className="mt-1 text-muted">Entre para gerenciar seu catálogo.</p>
      </div>
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <LoginForm />
      </div>
      <Link href="/" className="text-center text-sm font-semibold text-muted hover:text-foreground">
        ← Voltar para o catálogo
      </Link>
    </main>
  );
}
