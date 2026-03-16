const express = require("express");
const controller = require("../controllers/dashboardController");

const router = express.Router();

router.get("/resumo", controller.resumo);

module.exports = router;
