import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n } from './i18n/ui';
import { AppStateProvider } from './ui/state';
import { App } from './ui/App';
import './ui/ui.css';

initI18n();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>,
);
