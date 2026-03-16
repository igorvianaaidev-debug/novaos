const { getResumoDashboard } = require("../services/dashboardService");

async function resumo(req, res, next) {
  try {
    const data = await getResumoDashboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  resumo,
};
