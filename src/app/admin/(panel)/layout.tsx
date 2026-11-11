import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { createClient } from "@/lib/supabase/server";

/**
 * Barreira definitiva da área administrativa (o proxy.ts é só uma checagem otimista).
 * Todas as páginas dentro de (panel) exigem um vendedor autenticado.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return (
    <div style={{ "--brand": "#e11d74", "--brand-contrast": "#ffffff" } as CSSProperties}>
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
