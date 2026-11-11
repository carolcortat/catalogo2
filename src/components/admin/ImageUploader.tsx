"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/catalog/ProductImage";
import { MAX_IMAGES } from "@/lib/admin";
import { uploadImage } from "@/lib/admin-storage";

interface ImageUploaderProps {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  max?: number;
  hint?: string;
}

/** Envio de fotos: toque para escolher (no celular abre a câmera/galeria), com pré-visualização e remoção. */
export function ImageUploader({
  label,
  value,
  onChange,
  folder,
  max = MAX_IMAGES,
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - value.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const selected = Array.from(files).slice(0, Math.max(remaining, 0));
    if (files.length > selected.length) {
      setError(`Você pode enviar no máximo ${max} ${max === 1 ? "imagem" : "imagens"}.`);
    }

    setUploading(selected.length);
    const urls: string[] = [];
    for (const file of selected) {
      try {
        urls.push(await uploadImage(file, folder));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enviar a imagem.");
      }
    }
    setUploading(0);
    if (urls.length > 0) onChange([...value, ...urls]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url} className="relative">
            <ProductImage
              src={url}
              alt={`${label} ${i + 1}`}
              className="h-24 w-24 rounded-2xl border border-line"
            />
            {i === 0 && max > 1 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                Capa
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              aria-label={`Remover imagem ${i + 1}`}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`up-${i}`}
            role="status"
            aria-label="Enviando imagem"
            className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-black/5"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
          </div>
        ))}

        {remaining > 0 && uploading === 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
            Adicionar
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={max > 1}
        className="sr-only"
        tabIndex={-1}
        aria-label={`Escolher arquivo: ${label}`}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
