import { useEffect } from 'react';
import { useToast } from './Toaster';

export const UPDATE_EVENT = 'gastos:update-available';

/** Mostra "Atualizar" quando o service worker tem uma nova versão (o usuário decide quando). */
export function UpdatePrompt() {
  const toast = useToast();
  useEffect(() => {
    function onUpdate(e: Event) {
      const apply = (e as CustomEvent<() => void>).detail;
      toast.show('Nova versão disponível.', {
        tone: 'info',
        durationMs: 0,
        action: { label: 'Atualizar', onClick: apply },
      });
    }
    window.addEventListener(UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(UPDATE_EVENT, onUpdate);
  }, [toast]);
  return null;
}
