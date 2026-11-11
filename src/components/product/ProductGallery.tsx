"use client";

import clsx from "clsx";
import { ZoomIn } from "lucide-react";
import { useState } from "react";
import { ProductImage } from "@/components/catalog/ProductImage";
import { Modal } from "@/components/ui/Modal";

/** Galeria: imagem principal, miniaturas e ampliação ao tocar na foto. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[index] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => current && setZoom(true)}
        disabled={!current}
        aria-label="Ampliar imagem do produto"
        className="group relative block overflow-hidden rounded-3xl border border-line"
      >
        <ProductImage src={current} alt={name} priority className="aspect-square w-full" />
        {current && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
            <ZoomIn className="h-4 w-4" aria-hidden /> Ampliar
          </span>
        )}
      </button>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos do produto">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${images.length}`}
              aria-pressed={i === index}
              className={clsx(
                "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
                i === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={src} alt="" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}

      <Modal open={zoom} onClose={() => setZoom(false)} title={name}>
        <ProductImage src={current} alt={name} className="w-full rounded-2xl" />
      </Modal>
    </div>
  );
}
