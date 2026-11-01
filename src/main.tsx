import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme, readTheme } from './lib/theme';
import { setupPwa } from './pwa';
import './styles/index.css';

// O data-theme já veio de theme-init.js; aqui só alinha a cor da barra do navegador.
applyTheme(readTheme());

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

setupPwa();
