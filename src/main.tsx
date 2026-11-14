import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import DesignPreviewStudio from './components/DesignPreviewStudio';

const isDesignPreview =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('preview') === 'themes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDesignPreview ? <DesignPreviewStudio /> : <App />}
  </StrictMode>
);
