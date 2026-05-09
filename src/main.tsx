import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Konva from 'konva';
import './index.css';
import App from './App.tsx';

Konva.dragDistance = 5;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
