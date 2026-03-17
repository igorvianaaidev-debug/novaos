require("dotenv").config();

const app = require("./app");
const { validateEnv } = require("./config/env");
const { ensureSheetsStructure } = require("./services/sheetsService");

const PORT = process.env.PORT || 4000;
const SHEETS_BOOT_TIMEOUT_MS = Number(process.env.SHEETS_BOOT_TIMEOUT_MS || 20000);
const SHEETS_BOOT_RETRY_MS = Number(process.env.SHEETS_BOOT_RETRY_MS || 30000);

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function bootstrapSheets() {
  try {
    await withTimeout(
      ensureSheetsStructure(),
      SHEETS_BOOT_TIMEOUT_MS,
      `Timeout ao validar estrutura do Google Sheets (${SHEETS_BOOT_TIMEOUT_MS}ms)`
    );

    app.locals.systemStatus.sheetsReady = true;
    app.locals.systemStatus.sheetsLastError = null;
    app.locals.systemStatus.sheetsLastSyncAt = new Date().toISOString();
    console.log("Google Sheets conectado e estrutura validada.");
  } catch (error) {
    app.locals.systemStatus.sheetsReady = false;
    app.locals.systemStatus.sheetsLastError = error.message;
    console.error("Aviso: API iniciada em modo degradado (Google Sheets):", error.message);
  }
}

async function start() {
  try {
    validateEnv();
    app.locals.systemStatus = {
      service: "Oficina OS API",
      startedAt: new Date().toISOString(),
      sheetsReady: false,
      sheetsLastSyncAt: null,
      sheetsLastError: null,
    };

    const server = app.listen(PORT, () => {
      console.log(`Backend Oficina OS rodando na porta ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("Falha ao subir listener HTTP:", error.message);
      process.exit(1);
    });

    await bootstrapSheets();

    const retryTimer = setInterval(() => {
      if (app.locals.systemStatus.sheetsReady) return;
      bootstrapSheets();
    }, SHEETS_BOOT_RETRY_MS);
    retryTimer.unref?.();
  } catch (error) {
    console.error("Falha ao iniciar servidor:", error.message);
    process.exit(1);
  }
}

start();
