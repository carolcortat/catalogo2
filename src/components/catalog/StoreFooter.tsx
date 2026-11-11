import { MessageCircle } from "lucide-react";
import type { StoreSettings } from "@/types";

export function StoreFooter({ store }: { store: StoreSettings }) {
  const digits = store.whatsapp_number.replace(/\D/g, "");

  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted">
        <p className="text-base font-bold text-foreground">{store.store_name}</p>
        {store.store_info && <p>{store.store_info}</p>}
        {digits && (
          <a
            href={`https://wa.me/${digits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-2 font-semibold text-foreground hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Falar com a loja no WhatsApp
          </a>
        )}
      </div>
    </footer>
  );
}
