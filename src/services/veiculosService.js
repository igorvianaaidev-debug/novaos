const { SHEETS } = require("../config/sheetsSchema");
const { append, findById, readAll, updateById } = require("./sheetsService");
const { generateId } = require("../utils/idGenerator");
const { ensureRequired } = require("../utils/validators");
const { ApiError } = require("../utils/errorHandler");
const { getClienteById } = require("./clientesService");

function normalizePlaca(placa) {
  return (placa || "").replace("-", "").toUpperCase().trim();
}

function applyVeiculoFilter(veiculos, query) {
  if (!query) return veiculos;
  const q = query.toLowerCase();
  return veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q)
  );
}

async function ensureUniquePlaca(placa, ignoreId) {
  const normalized = normalizePlaca(placa);
  const veiculos = await readAll(SHEETS.VEICULOS);
  const conflict = veiculos.find(
    (v) => normalizePlaca(v.placa) === normalized && v.id_veiculo !== ignoreId
  );
  if (conflict) {
    throw new ApiError(400, "Placa ja cadastrada");
  }
}

async function listVeiculos(query, idCliente) {
  const veiculos = await readAll(SHEETS.VEICULOS);
  const byCliente = idCliente ? veiculos.filter((v) => v.id_cliente === idCliente) : veiculos;
  return applyVeiculoFilter(byCliente, query);
}

async function getVeiculoById(id) {
  const veiculo = await findById(SHEETS.VEICULOS, id);
  if (!veiculo) throw new ApiError(404, "Veiculo nao encontrado");
  return veiculo;
}

async function createVeiculo(payload) {
  ensureRequired(["id_cliente", "placa", "modelo", "marca"], payload);
  await getClienteById(payload.id_cliente);
  await ensureUniquePlaca(payload.placa);

  const veiculo = {
    id_veiculo: generateId("vei"),
    id_cliente: payload.id_cliente,
    placa: normalizePlaca(payload.placa),
    modelo: payload.modelo.trim(),
    marca: payload.marca.trim(),
    ano: payload.ano || "",
    cor: payload.cor || "",
    km_atual: payload.km_atual || "",
  };
  await append(SHEETS.VEICULOS, veiculo);
  return veiculo;
}

async function updateVeiculo(id, payload) {
  const current = await getVeiculoById(id);
  const nextData = {
    ...current,
    id_cliente: payload.id_cliente ?? current.id_cliente,
    placa: payload.placa ? normalizePlaca(payload.placa) : current.placa,
    modelo: payload.modelo ?? current.modelo,
    marca: payload.marca ?? current.marca,
    ano: payload.ano ?? current.ano,
    cor: payload.cor ?? current.cor,
    km_atual: payload.km_atual ?? current.km_atual,
  };
  ensureRequired(["id_cliente", "placa", "modelo", "marca"], nextData);
  await getClienteById(nextData.id_cliente);
  await ensureUniquePlaca(nextData.placa, id);
  await updateById(SHEETS.VEICULOS, id, nextData);
  return nextData;
}

module.exports = {
  listVeiculos,
  getVeiculoById,
  createVeiculo,
  updateVeiculo,
};
