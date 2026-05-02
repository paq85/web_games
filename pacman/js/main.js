import { PacmanApp } from './app.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = new PacmanApp(document);
  app.init();
  window.__PACMAN_APP__ = app;
});
