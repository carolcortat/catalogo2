"use client";

import clsx from "clsx";
import { ImageOff } from "lucide-react";
import { useState } from "react";

/** Imagem quadrada com carregamento preguiçoso e substituto caso a foto falhe. */
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (sem foto)`}
        className={clsx("flex items-center justify-center bg-black/5 text-muted", className)}
      >
        <ImageOff className="h-8 w-8" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={clsx("object-cover", className)}
    />
  );
}
