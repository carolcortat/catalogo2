import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>
        🔍
      </p>
      <h1 className="text-2xl font-extrabold">Página não encontrada</h1>
      <p className="max-w-sm text-muted">
        O produto que você procura pode ter sido removido ou o link está incorreto.
      </p>
      <Link href="/" className={buttonClasses({ size: "lg" })}>
        Ver o catálogo
      </Link>
    </div>
  );
}
