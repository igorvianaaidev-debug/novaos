const express = require("express");
const controller = require("../controllers/veiculosController");

const router = express.Router();

router.get("/", controller.list);
router.get("/cliente/:idCliente", controller.listByCliente);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);

module.exports = router;
