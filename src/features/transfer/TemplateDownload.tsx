import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { xlsxAdapter } from '../../data/xlsxAdapter';
import { saveFile } from '../../lib/download';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';

export const TEMPLATE_FILE = 'modelo-gastos.xlsx';

export function TemplateDownload() {
  const [error, setError] = useState<string | null>(null);
  async function onClick() {
    setError(null);
    try {
      await saveFile(await xlsxAdapter.buildTemplate(), TEMPLATE_FILE);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <section aria-labelledby="modelo-title" className="flex flex-col gap-4">
      <h1 id="modelo-title" className="text-2xl font-bold">
        Planilha modelo
      </h1>
      <p className="text-muted">
        Use este formato para importar: uma despesa por linha, com as colunas <strong>Data</strong>{' '}
        (dd/mm/aaaa), <strong>Descrição</strong> (opcional), <strong>Categoria</strong> e{' '}
        <strong>Valor</strong>. As colunas podem estar em qualquer ordem; só a primeira aba é lida.
      </p>
      <p className="text-muted">Categorias que o app não reconhecer entram em "Outros".</p>
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
      <Button icon={<FileSpreadsheet aria-hidden size={18} />} onClick={onClick}>
        Baixar planilha modelo
      </Button>
    </section>
  );
}
