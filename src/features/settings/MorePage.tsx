import type { ReactNode } from 'react';
import { Link, Route, Routes } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  Upload,
  WalletMinimal,
} from 'lucide-react';
import { WalletManager } from '../wallets/WalletManager';
import { ExportReminder } from './ExportReminder';
import { extraMoreRoutes } from './moreRoutes';

interface Item {
  to: string;
  label: string;
  hint: string;
  icon: ReactNode;
}

const ITEMS: Item[] = [
  {
    to: 'carteiras',
    label: 'Carteiras',
    hint: 'Criar, renomear e excluir',
    icon: <WalletMinimal aria-hidden />,
  },
  {
    to: 'exportar',
    label: 'Exportar planilha',
    hint: 'Um arquivo .xlsx por mês',
    icon: <Download aria-hidden />,
  },
  {
    to: 'importar',
    label: 'Importar planilha',
    hint: 'Trazer gastos de um .xlsx',
    icon: <Upload aria-hidden />,
  },
  {
    to: 'modelo',
    label: 'Planilha modelo',
    hint: 'Baixar o formato aceito',
    icon: <FileSpreadsheet aria-hidden />,
  },
  {
    to: 'privacidade',
    label: 'Privacidade e sobre',
    hint: 'Seus dados ficam só neste aparelho',
    icon: <ShieldCheck aria-hidden />,
  },
  {
    to: 'apagar',
    label: 'Apagar do aparelho',
    hint: 'Remove todos os dados',
    icon: <Trash2 aria-hidden />,
  },
];

function MoreMenu() {
  return (
    <section aria-labelledby="mais-title" className="flex flex-col gap-4">
      <h1 id="mais-title" className="text-2xl font-bold">
        Mais
      </h1>
      <ExportReminder />
      <ul className="flex flex-col gap-2">
        {ITEMS.map((i) => (
          <li key={i.to}>
            <Link
              to={i.to}
              className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface px-4 py-2 shadow-sm hover:bg-surface-2"
            >
              <span className="text-primary">{i.icon}</span>
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{i.label}</span>
                <span className="text-sm text-muted">{i.hint}</span>
              </span>
              <ChevronRight aria-hidden size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Back({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Link
        to="/mais"
        className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 font-semibold text-primary"
      >
        <ChevronLeft aria-hidden size={18} /> Mais
      </Link>
      {children}
    </div>
  );
}

export function MorePage() {
  return (
    <Routes>
      <Route index element={<MoreMenu />} />
      <Route
        path="carteiras"
        element={
          <Back>
            <WalletManager />
          </Back>
        }
      />
      {extraMoreRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={<Back>{element}</Back>} />
      ))}
      <Route path="*" element={<MoreMenu />} />
    </Routes>
  );
}
