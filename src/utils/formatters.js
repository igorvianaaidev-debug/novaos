function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

module.exports = {
  todayIsoDate,
  toNumber,
};
