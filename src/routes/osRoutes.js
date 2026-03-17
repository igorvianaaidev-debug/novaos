const express = require("express");
const controller = require("../controllers/osController");

const router = express.Router();

router.get("/", controller.list);
router.get("/:id/pdf", controller.gerarPdf);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.patch("/:id/status", controller.patchStatus);
router.get("/:id/itens", controller.listItens);
router.post("/:id/itens", controller.addItem);
router.put("/:id/itens/:idItem", controller.updateItem);
router.delete("/:id/itens/:idItem", controller.deleteItem);

module.exports = router;
