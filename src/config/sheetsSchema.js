const SHEETS = {
  CLIENTES: {
    name: "clientes",
    idField: "id_cliente",
    headers: ["id_cliente", "nome", "telefone", "cpf", "email", "endereco", "data_cadastro"],
  },
  VEICULOS: {
    name: "veiculos",
    idField: "id_veiculo",
    headers: ["id_veiculo", "id_cliente", "placa", "modelo", "marca", "ano", "cor", "km_atual"],
  },
  ORDENS: {
    name: "ordens_servico",
    idField: "id_os",
    headers: [
      "id_os",
      "id_cliente",
      "id_veiculo",
      "data_entrada",
      "problema_relatado",
      "diagnostico",
      "status",
      "valor_mao_obra",
      "valor_pecas",
      "valor_total",
      "observacoes",
      "data_saida",
    ],
  },
  ITENS: {
    name: "itens_os",
    idField: "id_item",
    headers: ["id_item", "id_os", "tipo_item", "descricao", "quantidade", "valor_unitario", "subtotal"],
  },
};

const ALLOWED_STATUS = ["Aguardando", "Em andamento", "Finalizado"];
const ALLOWED_ITEM_TYPES = ["Peca", "Peça", "Servico", "Serviço"];

module.exports = {
  SHEETS,
  ALLOWED_STATUS,
  ALLOWED_ITEM_TYPES,
};
