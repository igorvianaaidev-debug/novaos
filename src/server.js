require('dotenv').config();

const app = require('./app');
const { validateEnv } = require('./config/env');
const { ensureSheetsStructure } = require('./services/sheetsService');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    validateEnv();
    await ensureSheetsStructure();

    app.listen(PORT, () => {
      console.log(`Backend Oficina OS rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

start();
