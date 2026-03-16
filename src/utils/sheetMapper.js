function rowToObject(headers, row = []) {
  return headers.reduce((acc, header, index) => {
    acc[header] = row[index] ?? "";
    return acc;
  }, {});
}

function objectToRow(headers, obj = {}) {
  return headers.map((header) => (obj[header] ?? "").toString());
}

module.exports = {
  rowToObject,
  objectToRow,
};
