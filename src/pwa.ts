import { registerSW } from 'virtual:pwa-register';
import { UPDATE_EVENT } from './features/app/UpdatePrompt';
import { log } from './lib/log';

/** Registra o service worker; avisa a interface quando houver uma nova versão. */
export function setupPwa() {
  if (!('serviceWorker' in navigator)) return;
  const updateSW = registerSW({
    onNeedRefresh() {
      log.debug('sw.update_available');
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: () => updateSW(true) }));
    },
    onOfflineReady() {
      log.debug('sw.offline_ready');
    },
  });
}
