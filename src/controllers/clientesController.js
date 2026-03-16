const clientesService = require("../services/clientesService");

async function list(req, res, next) {
  try {
    const data = await clientesService.listClientes(req.query.q);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await clientesService.getClienteById(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await clientesService.createCliente(req.body);
    res.status(201).json({ message: "Cliente cadastrado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await clientesService.updateCliente(req.params.id, req.body);
    res.json({ message: "Cliente atualizado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
};
