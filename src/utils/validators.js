const { ALLOWED_STATUS, ALLOWED_ITEM_TYPES } = require("../config/sheetsSchema");
const { ApiError } = require("./errorHandler");

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function ensureRequired(fields, data) {
  const missing = fields.filter((field) => isBlank(data[field]));
  if (missing.length > 0) {
    throw new ApiError(400, `Campos obrigatorios ausentes: ${missing.join(", ")}`);
  }
}

function parseNonNegativeNumber(value, fieldName) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ApiError(400, `${fieldName} deve ser um numero nao negativo`);
  }
  return parsed;
}

function validateStatus(status) {
  if (!ALLOWED_STATUS.includes(status)) {
    throw new ApiError(400, `Status invalido. Permitidos: ${ALLOWED_STATUS.join(", ")}`);
  }
}

function normalizeItemType(type) {
  if (!ALLOWED_ITEM_TYPES.includes(type)) {
    throw new ApiError(400, "tipo_item invalido. Use 'Peca' ou 'Servico'");
  }
  if (type === "Peça" || type === "Peca") {
    return "Peca";
  }
  return "Servico";
}

module.exports = {
  ensureRequired,
  parseNonNegativeNumber,
  validateStatus,
  normalizeItemType,
  isBlank,
};
