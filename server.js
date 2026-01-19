import app from './src/app.js';
import { config } from './src/config/env.js';

app.listen(config.port, () => {
  console.log(`🚀 Servidor (ESM) rodando em http://localhost:${config.port}`);
  console.log('URI de Redirecionamento:', config.instagram.redirectUri);
  console.log(`🛡️  Ambiente: ${config.nodeEnv}`);
});