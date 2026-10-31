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
import { TileIcon } from '../../ui/CategoryIcon';
import { GroupedList } from '../../ui/Grouped';
import { PageHeader } from '../../ui/PageHeader';
import { WalletManager } from '../wallets/WalletManager';
import { ExportReminder } from './ExportReminder';
import { extraMoreRoutes } from './moreRoutes';

interface Item {
  to: string;
  label: string;
  hint: string;
  icon: ReactNode;
  /** Cor do ícone (token), como os ícones coloridos dos Ajustes do iOS. */
  color: string;
  destructive?: boolean;
}

const ICON = { size: 18, strokeWidth: 2.25, 'aria-hidden': true } as const;

/** Seções agrupadas como nos Ajustes: dados, planilhas, privacidade e a ação destrutiva à parte. */
const SECTIONS: Item[][] = [
  [
    {
      to: 'carteiras',
      label: 'Carteiras',
      hint: 'Criar, renomear e excluir',
      icon: <WalletMinimal {...ICON} />,
      color: 'var(--cat-mercado)',
    },
  ],
  [
    {
      to: 'exportar',
      label: 'Exportar planilha',
      hint: 'Um arquivo .xlsx por mês',
      icon: <Download {...ICON} />,
      color: 'var(--cat-moradia)',
    },
    {
      to: 'importar',
      label: 'Importar planilha',
      hint: 'Trazer gastos de um .xlsx',
      icon: <Upload {...ICON} />,
      color: 'var(--cat-educacao)',
    },
    {
      to: 'modelo',
      label: 'Planilha modelo',
      hint: 'Baixar o formato aceito',
      icon: <FileSpreadsheet {...ICON} />,
      color: 'var(--cat-familia)',
    },
  ],
  [
    {
      to: 'privacidade',
      label: 'Privacidade e sobre',
      hint: 'Seus dados ficam só neste aparelho',
      icon: <ShieldCheck {...ICON} />,
      color: 'var(--cat-outros)',
    },
  ],
  [
    {
      to: 'apagar',
      label: 'Apagar do aparelho',
      hint: 'Remove todos os dados',
      icon: <Trash2 {...ICON} />,
      color: 'var(--danger)',
      destructive: true,
    },
  ],
];

function MoreMenu() {
  return (
    <section aria-labelledby="mais-title" className="flex flex-col gap-3">
      <PageHeader id="mais-title" title="Mais" />
      <ExportReminder />
      <div className="flex flex-col gap-6 pt-2">
        {SECTIONS.map((items) => (
          <GroupedList key={items[0]!.to}>
            {items.map((i) => (
              <li key={i.to}>
                <Link
                  to={i.to}
                  className="flex min-h-14 items-center gap-3 pl-4 hover:bg-surface-2/60 active:bg-surface-2"
                >
                  <TileIcon size={30} color={i.color}>
                    {i.icon}
                  </TileIcon>
                  <span className="row-body flex flex-1 items-center gap-3 self-stretch py-2 pr-3">
                    <span className="flex flex-1 flex-col">
                      <span className={i.destructive ? 'text-danger' : ''}>{i.label}</span>
                      <span className="text-footnote text-muted">{i.hint}</span>
                    </span>
                    <ChevronRight
                      aria-hidden
                      size={18}
                      strokeWidth={2.5}
                      className="shrink-0 text-border"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </GroupedList>
        ))}
      </div>
    </section>
  );
}

/** Botão de voltar do iOS: chevron e o nome da tela anterior, em azul. */
function Back({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Link
        to="/mais"
        className="-ml-2.5 inline-flex min-h-11 w-fit items-center rounded-lg pr-2 text-body text-tint"
      >
        <ChevronLeft aria-hidden size={28} strokeWidth={2.5} /> Mais
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
