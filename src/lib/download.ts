export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isStandaloneIos(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    (/iPad|iPhone|iPod/.test(navigator.userAgent) &&
      window.matchMedia('(display-mode: standalone)').matches)
  );
}

/**
 * Entrega um arquivo ao usuário sem passar por servidor: link de download local.
 * No PWA instalado do iOS, onde o download é instável, usa o compartilhamento nativo.
 */
export async function saveFile(blob: Blob, fileName: string): Promise<void> {
  if (isStandaloneIos() && typeof navigator.canShare === 'function') {
    const file = new File([blob], fileName, { type: blob.type || XLSX_MIME });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
