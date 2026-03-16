const { SHEETS } = require("../config/sheetsSchema");
const { readAll } = require("./sheetsService");
const { toNumber } = require("../utils/formatters");

async function getResumoDashboard() {
  const [ordens, clientes, veiculos] = await Promise.all([
    readAll(SHEETS.ORDENS),
    readAll(SHEETS.CLIENTES),
    readAll(SHEETS.VEICULOS),
  ]);

  const ordensAbertas = ordens.filter((os) => os.status !== "Finalizado");
  const ordensFinalizadas = ordens.filter((os) => os.status === "Finalizado");
  const totalEmAndamento = ordensAbertas.reduce((acc, os) => acc + toNumber(os.valor_total), 0);

  const ordensRecentes = [...ordens]
    .sort((a, b) => (a.data_entrada < b.data_entrada ? 1 : -1))
    .slice(0, 8);

  return {
    ordens_abertas: ordensAbertas.length,
    ordens_finalizadas: ordensFinalizadas.length,
    total_veiculos: veiculos.length,
    total_clientes: clientes.length,
    valor_total_em_andamento: totalEmAndamento.toFixed(2),
    ordens_recentes: ordensRecentes,
  };
}

module.exports = {
  getResumoDashboard,
};
