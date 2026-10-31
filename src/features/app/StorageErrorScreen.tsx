import { DatabaseZap } from 'lucide-react';
import { Button } from '../../ui/Button';

/** Mostrada quando o banco do aparelho não abre (navegação privada, bloqueio, cota). */
export function StorageErrorScreen({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <DatabaseZap aria-hidden size={56} className="text-danger" />
      <h1 className="text-title1 font-bold">Não foi possível abrir seus dados</h1>
      <p role="alert" className="font-semibold">
        {message}
      </p>
      <p className="text-muted">
        O app guarda tudo só neste aparelho. Verifique se o navegador não está em modo privado e se
        permite armazenar dados deste site, e tente de novo.
      </p>
      <Button onClick={() => window.location.reload()}>Tentar de novo</Button>
    </main>
  );
}
