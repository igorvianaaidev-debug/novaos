class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Rota nao encontrada: ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Erro interno no servidor",
  });
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
};
