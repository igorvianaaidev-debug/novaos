const { SHEETS } = require("../config/sheetsSchema");
const { append, findById, readAll, updateById } = require("./sheetsService");
const { generateId } = require("../utils/idGenerator");
const { ensureRequired } = require("../utils/validators");
const { todayIsoDate } = require("../utils/formatters");
const { ApiError } = require("../utils/errorHandler");

function applyClienteFilter(clientes, query) {
  if (!query) return clientes;
  const q = query.toLowerCase();
  return clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(q) ||
      cliente.telefone.toLowerCase().includes(q) ||
      (cliente.cpf || "").toLowerCase().includes(q)
  );
}

async function listClientes(query) {
  const clientes = await readAll(SHEETS.CLIENTES);
  return applyClienteFilter(clientes, query);
}

async function getClienteById(id) {
  const cliente = await findById(SHEETS.CLIENTES, id);
  if (!cliente) throw new ApiError(404, "Cliente nao encontrado");
  return cliente;
}

async function createCliente(payload) {
  ensureRequired(["nome", "telefone"], payload);
  const cliente = {
    id_cliente: generateId("cli"),
    nome: payload.nome.trim(),
    telefone: payload.telefone.trim(),
    cpf: payload.cpf || "",
    email: payload.email || "",
    endereco: payload.endereco || "",
    data_cadastro: todayIsoDate(),
  };
  await append(SHEETS.CLIENTES, cliente);
  return cliente;
}

async function updateCliente(id, payload) {
  const current = await getClienteById(id);
  const nextData = {
    ...current,
    nome: payload.nome ?? current.nome,
    telefone: payload.telefone ?? current.telefone,
    cpf: payload.cpf ?? current.cpf,
    email: payload.email ?? current.email,
    endereco: payload.endereco ?? current.endereco,
  };
  ensureRequired(["nome", "telefone"], nextData);
  await updateById(SHEETS.CLIENTES, id, nextData);
  return nextData;
}

module.exports = {
  listClientes,
  getClienteById,
  createCliente,
  updateCliente,
};
