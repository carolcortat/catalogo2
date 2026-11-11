import type { CSSProperties, ReactNode } from "react";
import { StoreFooter } from "@/components/catalog/StoreFooter";
import { StoreHeader } from "@/components/catalog/StoreHeader";
import { contrastColor, isHexColor } from "@/lib/color";
import { getStoreSettings } from "@/lib/data";

// Deve ser um número literal (o Next analisa este valor em tempo de build)
export const revalidate = 60;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const store = await getStoreSettings();
  const brand = isHexColor(store.brand_color) ? store.brand_color : "#e11d74";

  // Aplica a identidade visual da loja (cor principal) em toda a área pública
  const theme = {
    "--brand": brand,
    "--brand-contrast": contrastColor(brand),
  } as CSSProperties;

  return (
    <div style={theme} className="flex min-h-screen flex-col bg-background">
      <StoreHeader store={store} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-5">{children}</main>
      <StoreFooter store={store} />
    </div>
  );
}
