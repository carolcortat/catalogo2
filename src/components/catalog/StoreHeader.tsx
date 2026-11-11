import Link from "next/link";
import type { StoreSettings } from "@/types";
import { CartButton } from "./CartButton";

export function StoreHeader({ store }: { store: StoreSettings }) {
  const initial = store.store_name.trim().charAt(0).toUpperCase() || "L";

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logo_url}
              alt={`Logotipo de ${store.store_name}`}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-contrast"
            >
              {initial}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold leading-tight">
              {store.store_name}
            </span>
            {store.tagline && (
              <span className="block truncate text-sm text-muted">{store.tagline}</span>
            )}
          </span>
        </Link>
        <CartButton />
      </div>
    </header>
  );
}
