import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/anton';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { SettingsProvider } from './lib/settings.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
