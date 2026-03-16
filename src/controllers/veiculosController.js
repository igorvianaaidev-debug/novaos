const veiculosService = require("../services/veiculosService");
const osService = require("../services/osService");

async function list(req, res, next) {
  try {
    const data = await veiculosService.listVeiculos(req.query.q, req.query.id_cliente);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const veiculo = await veiculosService.getVeiculoById(req.params.id);
    const historico = await osService.listHistoricoVeiculo(req.params.id);
    res.json({ ...veiculo, historico });
  } catch (error) {
    next(error);
  }
}

async function listByCliente(req, res, next) {
  try {
    const data = await veiculosService.listVeiculos(req.query.q, req.params.idCliente);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await veiculosService.createVeiculo(req.body);
    res.status(201).json({ message: "Veiculo cadastrado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await veiculosService.updateVeiculo(req.params.id, req.body);
    res.json({ message: "Veiculo atualizado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  listByCliente,
  create,
  update,
};
