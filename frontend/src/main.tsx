import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Poppins is bundled with the app, so nothing loads from the web (G2).
import '@fontsource/poppins/latin-300.css';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
