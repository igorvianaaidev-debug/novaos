const { SHEETS } = require("../config/sheetsSchema");
const { append, deleteById, findById, readAll, updateById } = require("./sheetsService");
const { generateId } = require("../utils/idGenerator");
const {
  ensureRequired,
  normalizeItemType,
  parseNonNegativeNumber,
  validateStatus,
} = require("../utils/validators");
const { todayIsoDate, toNumber } = require("../utils/formatters");
const { ApiError } = require("../utils/errorHandler");
const { getClienteById } = require("./clientesService");
const { getVeiculoById } = require("./veiculosService");

function enrichOs(os, clientesMap, veiculosMap) {
  return {
    ...os,
    cliente: clientesMap[os.id_cliente] || null,
    veiculo: veiculosMap[os.id_veiculo] || null,
  };
}

async function buildMaps() {
  const [clientes, veiculos] = await Promise.all([readAll(SHEETS.CLIENTES), readAll(SHEETS.VEICULOS)]);
  const clientesMap = Object.fromEntries(clientes.map((c) => [c.id_cliente, c]));
  const veiculosMap = Object.fromEntries(veiculos.map((v) => [v.id_veiculo, v]));
  return { clientesMap, veiculosMap };
}

async function recalcOsTotals(idOs) {
  const itens = await listItensByOs(idOs);
  const totals = itens.reduce(
    (acc, item) => {
      const subtotal = toNumber(item.subtotal);
      if (item.tipo_item === "Peca") {
        acc.valor_pecas += subtotal;
      } else {
        acc.valor_mao_obra += subtotal;
      }
      return acc;
    },
    { valor_pecas: 0, valor_mao_obra: 0 }
  );
  const os = await getOsById(idOs);
  const next = {
    ...os,
    valor_pecas: totals.valor_pecas.toFixed(2),
    valor_mao_obra: totals.valor_mao_obra.toFixed(2),
    valor_total: (totals.valor_pecas + totals.valor_mao_obra).toFixed(2),
  };
  await updateById(SHEETS.ORDENS, idOs, next);
  return next;
}

async function listOs(filters = {}) {
  const all = await readAll(SHEETS.ORDENS);
  const { clientesMap, veiculosMap } = await buildMaps();
  let result = all.map((os) => enrichOs(os, clientesMap, veiculosMap));

  if (filters.status) {
    result = result.filter((os) => os.status === filters.status);
  }
  if (filters.placa) {
    const placa = filters.placa.toLowerCase();
    result = result.filter((os) => (os.veiculo?.placa || "").toLowerCase().includes(placa));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (os) =>
        os.id_os.toLowerCase().includes(q) ||
        (os.veiculo?.placa || "").toLowerCase().includes(q) ||
        (os.cliente?.nome || "").toLowerCase().includes(q) ||
        os.status.toLowerCase().includes(q)
    );
  }
  return result;
}

async function getOsById(id) {
  const os = await findById(SHEETS.ORDENS, id);
  if (!os) throw new ApiError(404, "OS nao encontrada");
  return os;
}

async function getOsDetails(id) {
  const os = await getOsById(id);
  const [cliente, veiculo, itens] = await Promise.all([
    getClienteById(os.id_cliente),
    getVeiculoById(os.id_veiculo),
    listItensByOs(id),
  ]);
  return { ...os, cliente, veiculo, itens };
}

async function createOs(payload) {
  ensureRequired(["id_cliente", "id_veiculo", "problema_relatado"], payload);
  await getClienteById(payload.id_cliente);
  const veiculo = await getVeiculoById(payload.id_veiculo);
  if (veiculo.id_cliente !== payload.id_cliente) {
    throw new ApiError(400, "Veiculo nao pertence ao cliente informado");
  }

  const nova = {
    id_os: generateId("os"),
    id_cliente: payload.id_cliente,
    id_veiculo: payload.id_veiculo,
    data_entrada: payload.data_entrada || todayIsoDate(),
    problema_relatado: payload.problema_relatado,
    diagnostico: payload.diagnostico || "",
    status: "Aguardando",
    valor_mao_obra: "0.00",
    valor_pecas: "0.00",
    valor_total: "0.00",
    observacoes: payload.observacoes || "",
    data_saida: "",
  };
  await append(SHEETS.ORDENS, nova);
  return nova;
}

async function updateOs(id, payload) {
  const current = await getOsById(id);
  const next = {
    ...current,
    id_cliente: payload.id_cliente ?? current.id_cliente,
    id_veiculo: payload.id_veiculo ?? current.id_veiculo,
    data_entrada: payload.data_entrada ?? current.data_entrada,
    problema_relatado: payload.problema_relatado ?? current.problema_relatado,
    diagnostico: payload.diagnostico ?? current.diagnostico,
    observacoes: payload.observacoes ?? current.observacoes,
    data_saida: payload.data_saida ?? current.data_saida,
  };
  ensureRequired(["id_cliente", "id_veiculo", "problema_relatado"], next);
  await getClienteById(next.id_cliente);
  const veiculo = await getVeiculoById(next.id_veiculo);
  if (veiculo.id_cliente !== next.id_cliente) {
    throw new ApiError(400, "Veiculo nao pertence ao cliente informado");
  }
  await updateById(SHEETS.ORDENS, id, next);
  return next;
}

async function changeOsStatus(id, status) {
  validateStatus(status);
  const current = await getOsById(id);
  const next = {
    ...current,
    status,
    data_saida: status === "Finalizado" ? current.data_saida || todayIsoDate() : current.data_saida,
  };
  await updateById(SHEETS.ORDENS, id, next);
  return next;
}

async function listItensByOs(idOs) {
  const all = await readAll(SHEETS.ITENS);
  return all.filter((item) => item.id_os === idOs);
}

function buildItem(payload, idOs, idItem) {
  ensureRequired(["tipo_item", "descricao", "quantidade", "valor_unitario"], payload);
  const quantidade = parseNonNegativeNumber(payload.quantidade, "quantidade");
  const valorUnitario = parseNonNegativeNumber(payload.valor_unitario, "valor_unitario");
  const tipoItem = normalizeItemType(payload.tipo_item);
  return {
    id_item: idItem || generateId("item"),
    id_os: idOs,
    tipo_item: tipoItem,
    descricao: payload.descricao,
    quantidade: quantidade.toString(),
    valor_unitario: valorUnitario.toFixed(2),
    subtotal: (quantidade * valorUnitario).toFixed(2),
  };
}

async function addItemToOs(idOs, payload) {
  await getOsById(idOs);
  const item = buildItem(payload, idOs);
  await append(SHEETS.ITENS, item);
  await recalcOsTotals(idOs);
  return item;
}

async function updateItemFromOs(idOs, idItem, payload) {
  const current = await findById(SHEETS.ITENS, idItem);
  if (!current || current.id_os !== idOs) {
    throw new ApiError(404, "Item nao encontrado para esta OS");
  }
  const next = buildItem(
    {
      tipo_item: payload.tipo_item ?? current.tipo_item,
      descricao: payload.descricao ?? current.descricao,
      quantidade: payload.quantidade ?? current.quantidade,
      valor_unitario: payload.valor_unitario ?? current.valor_unitario,
    },
    idOs,
    idItem
  );
  await updateById(SHEETS.ITENS, idItem, next);
  await recalcOsTotals(idOs);
  return next;
}

async function removeItemFromOs(idOs, idItem) {
  const current = await findById(SHEETS.ITENS, idItem);
  if (!current || current.id_os !== idOs) {
    throw new ApiError(404, "Item nao encontrado para esta OS");
  }
  await deleteById(SHEETS.ITENS, idItem);
  await recalcOsTotals(idOs);
}

async function listHistoricoVeiculo(idVeiculo) {
  const all = await readAll(SHEETS.ORDENS);
  return all.filter((os) => os.id_veiculo === idVeiculo);
}

module.exports = {
  listOs,
  getOsById,
  getOsDetails,
  createOs,
  updateOs,
  changeOsStatus,
  listItensByOs,
  addItemToOs,
  updateItemFromOs,
  removeItemFromOs,
  listHistoricoVeiculo,
};
