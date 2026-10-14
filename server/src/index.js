import { app, ready } from './app.js';
import { config } from './config.js';

ready
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[api] Tareas Kamelia escuchando en http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('[api] No se pudo inicializar el store:', err);
    process.exit(1);
  });
