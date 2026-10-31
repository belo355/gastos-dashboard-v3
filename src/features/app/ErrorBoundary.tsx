import { Component, type ErrorInfo, type ReactNode } from 'react';
import { log } from '../../lib/log';
import { Button } from '../../ui/Button';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo) {
    log.error('ui.unhandled', { name: error.name });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-title1 font-bold">Algo deu errado</h1>
        <p className="text-muted">
          Seus dados continuam salvos no aparelho. Recarregue o app para continuar.
        </p>
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
      </main>
    );
  }
}
