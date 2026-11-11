"use client";

import clsx from "clsx";
import { ExternalLink, LogOut, Package, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Produtos", icon: Package, exact: false },
  { href: "/admin/categorias", label: "Categorias", icon: Tags, exact: false },
  { href: "/admin/configuracoes", label: "Loja", icon: Settings, exact: false },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/produtos")
      : pathname.startsWith(href);

  const logout = async () => {
    setLeaving(true);
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <p className="hidden min-w-0 truncate text-sm text-muted sm:block">{email}</p>
        <nav aria-label="Painel" className="flex flex-1 gap-1 sm:flex-none">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={clsx(
                "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition sm:flex-none",
                isActive(href) ? "bg-brand text-brand-contrast" : "hover:bg-black/5",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            target="_blank"
            aria-label="Ver catálogo (abre em nova aba)"
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-black/5"
          >
            <ExternalLink className="h-5 w-5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            aria-label="Sair"
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-black/5 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
