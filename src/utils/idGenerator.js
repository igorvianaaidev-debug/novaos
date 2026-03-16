const { randomUUID } = require("crypto");

function generateId(prefix) {
  return `${prefix}_${randomUUID().split("-")[0]}${Date.now().toString().slice(-4)}`;
}

module.exports = {
  generateId,
};
