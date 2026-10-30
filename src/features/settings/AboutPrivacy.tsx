import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { storageEstimate } from '../../data/storageGuard';
import { useAppState } from '../app/AppState';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024)
    return `${(n / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  return `${(n / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

export function AboutPrivacy() {
  const { settings } = useAppState();
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null | undefined>(
    undefined,
  );
  useEffect(() => {
    void storageEstimate().then(setEstimate);
  }, []);

  return (
    <section aria-labelledby="priv-title" className="flex flex-col gap-4">
      <h1 id="priv-title" className="text-2xl font-bold">
        Privacidade e sobre
      </h1>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="text-lg font-bold">Seus dados ficam só neste aparelho</h2>
        <p>
          O Gastos do Dia não tem conta, login nem servidor. Lançamentos, carteiras e orçamentos são
          salvos apenas no armazenamento deste navegador e nunca são enviados para a internet.
          Importação e exportação de planilhas também acontecem aqui mesmo.
        </p>
        <p>
          <strong>Atenção:</strong> se você limpar os dados do navegador ou desinstalar o app, os
          gastos são apagados e não há como recuperá-los. Por isso,{' '}
          <Link to="/mais/exportar" className="font-semibold text-primary underline">
            exporte uma planilha
          </Link>{' '}
          periodicamente.
        </p>
        <p>
          Não coletamos dados pessoais nem estatísticas de uso. Por não haver tratamento de dados em
          servidor, não há dados seus conosco para consultar, corrigir ou excluir.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="text-lg font-bold">Armazenamento</h2>
        <p data-testid="persistence-status">
          {settings.persistenceGranted === true
            ? 'O navegador concedeu armazenamento persistente: seus dados não serão apagados automaticamente para liberar espaço.'
            : settings.persistenceGranted === false
              ? 'O navegador não garantiu armazenamento persistente. Instale o app na tela inicial e exporte seus dados com frequência.'
              : 'Este navegador não informou se o armazenamento é persistente. Exporte seus dados com frequência.'}
        </p>
        {estimate && <p className="text-muted">Espaço usado: {formatBytes(estimate.usage)}</p>}
        <p className="text-muted">
          Dica: instale o app na tela inicial (menu do navegador → "Adicionar à tela inicial") para
          usar offline e reduzir o risco de perda de dados.
        </p>
      </div>

      <p className="text-sm text-muted">Gastos do Dia · versão 0.1.0</p>
    </section>
  );
}
