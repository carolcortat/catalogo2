import {
  ALLOWED_IMAGE_TYPES,
  STORAGE_BUCKET,
  storagePathFromUrl,
  validateImageFile,
} from "@/lib/admin";
import { createClient } from "@/lib/supabase/client";

/** Envia uma imagem ao Supabase Storage e devolve a URL pública. Lança Error com mensagem em português. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[file.type]}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Não foi possível enviar a imagem. Tente novamente.");

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Apaga arquivos do bucket a partir das URLs públicas (ignora URLs de outros lugares). */
export async function removeImages(urls: string[]): Promise<void> {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => p !== null);
  if (paths.length === 0) return;
  // Falha ao limpar arquivos antigos não deve atrapalhar o vendedor
  await createClient().storage.from(STORAGE_BUCKET).remove(paths);
}
