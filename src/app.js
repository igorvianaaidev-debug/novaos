const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientesRoutes");
const veiculosRoutes = require("./routes/veiculosRoutes");
const osRoutes = require("./routes/osRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFoundHandler, errorHandler } = require("./utils/errorHandler");

const app = express();

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "https://novaoss.web.app"];
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsConfig = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origem nao permitida pelo CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.use(corsConfig);
app.options(/.*/, corsConfig);

// Permite preflight para acesso a loopback/private network.
app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"] === "true") {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

app.use(express.json());

app.get("/health", (req, res) => {
  const status = req.app.locals.systemStatus || {};
  res.json({
    ok: true,
    service: status.service || "Oficina OS API",
    started_at: status.startedAt || null,
    sheets_ready: Boolean(status.sheetsReady),
    sheets_last_sync_at: status.sheetsLastSyncAt || null,
    sheets_last_error: status.sheetsLastError || null,
    timestamp: new Date().toISOString(),
  });
});

app.use("/clientes", clientesRoutes);
app.use("/veiculos", veiculosRoutes);
app.use("/os", osRoutes);
app.use("/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
