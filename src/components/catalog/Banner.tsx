import type { StoreSettings } from "@/types";

/** Banner principal para promoções e novidades (imagem opcional). */
export function Banner({ store }: { store: StoreSettings }) {
  if (!store.banner_title && !store.banner_text && !store.banner_image_url) return null;

  return (
    <section
      aria-label="Destaque"
      className="relative isolate overflow-hidden rounded-3xl bg-brand text-brand-contrast"
    >
      {store.banner_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.banner_image_url}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      <div
        className={
          store.banner_image_url
            ? "bg-gradient-to-r from-black/65 to-black/10 px-6 py-10 text-white sm:px-10 sm:py-14"
            : "bg-gradient-to-br from-white/0 to-black/20 px-6 py-10 sm:px-10 sm:py-14"
        }
      >
        {store.banner_title && (
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
            {store.banner_title}
          </h1>
        )}
        {store.banner_text && (
          <p className="mt-3 max-w-xl text-base opacity-95 sm:text-lg">{store.banner_text}</p>
        )}
      </div>
    </section>
  );
}
