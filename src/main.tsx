import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/animations.css';
import './styles/components.css';
import { router } from './router';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
