import type { ReactNode } from 'react';
import { ExportPanel } from '../transfer/ExportPanel';
import { ImportWizard } from '../transfer/ImportWizard';
import { TemplateDownload } from '../transfer/TemplateDownload';
import { AboutPrivacy } from './AboutPrivacy';
import { WipeData } from './WipeData';

/** Telas do menu "Mais" além de Carteiras. */
export const extraMoreRoutes: { path: string; element: ReactNode }[] = [
  { path: 'exportar', element: <ExportPanel /> },
  { path: 'importar', element: <ImportWizard /> },
  { path: 'modelo', element: <TemplateDownload /> },
  { path: 'privacidade', element: <AboutPrivacy /> },
  { path: 'apagar', element: <WipeData /> },
];
