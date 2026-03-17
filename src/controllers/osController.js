const osService = require("../services/osService");
const { gerarPdfOrdemServico } = require("../services/pdfService");

async function list(req, res, next) {
  try {
    const data = await osService.listOs({
      q: req.query.q,
      status: req.query.status,
      placa: req.query.placa,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await osService.getOsDetails(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await osService.createOs(req.body);
    res.status(201).json({ message: "OS criada com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await osService.updateOs(req.params.id, req.body);
    res.json({ message: "OS atualizada com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function patchStatus(req, res, next) {
  try {
    const data = await osService.changeOsStatus(req.params.id, req.body.status);
    res.json({ message: "Status atualizado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function listItens(req, res, next) {
  try {
    const data = await osService.listItensByOs(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const data = await osService.addItemToOs(req.params.id, req.body);
    res.status(201).json({ message: "Item adicionado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const data = await osService.updateItemFromOs(req.params.id, req.params.idItem, req.body);
    res.json({ message: "Item atualizado com sucesso", data });
  } catch (error) {
    next(error);
  }
}

async function deleteItem(req, res, next) {
  try {
    await osService.removeItemFromOs(req.params.id, req.params.idItem);
    res.json({ message: "Item removido com sucesso" });
  } catch (error) {
    next(error);
  }
}

async function gerarPdf(req, res, next) {
  try {
    const id = req.params.id;

    // Busca base da OS no padrao solicitado.
    const osBase = await osService.buscarPorId(id);
    if (!osBase) {
      return res.status(404).json({ message: "OS nao encontrada" });
    }

    // Dados completos (cliente, veiculo e itens) para renderizar no PDF.
    const osDetalhes = await osService.buscarDetalhes(id);

    gerarPdfOrdemServico(res, osDetalhes, {
      download: req.query.download,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  patchStatus,
  listItens,
  addItem,
  updateItem,
  deleteItem,
  gerarPdf,
  // Alias para retrocompatibilidade.
  getPdf: gerarPdf,
};
