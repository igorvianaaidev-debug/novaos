const { getSheetsClient } = require("../config/googleSheets");
const { SHEETS } = require("../config/sheetsSchema");
const { rowToObject, objectToRow } = require("../utils/sheetMapper");
const { ApiError } = require("../utils/errorHandler");

const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

async function ensureSheetHeaders(sheetConfig) {
  const sheets = getSheetsClient();
  const range = `${sheetConfig.name}!1:1`;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const current = response.data.values?.[0] || [];
  if (current.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetConfig.name}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [sheetConfig.headers] },
    });
  }
}

async function ensureSheetsStructure() {
  const allSheets = Object.values(SHEETS);
  for (const sheet of allSheets) {
    // Garante que cada aba tenha cabecalho esperado para o mapeamento.
    await ensureSheetHeaders(sheet);
  }
}

async function getSheetRows(sheetConfig) {
  const sheets = getSheetsClient();
  const range = `${sheetConfig.name}!A:Z`;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return response.data.values || [];
}

async function readAll(sheetConfig) {
  const rows = await getSheetRows(sheetConfig);
  const headers = rows[0] || sheetConfig.headers;
  const dataRows = rows.slice(1);
  return dataRows.map((row) => rowToObject(headers, row));
}

async function append(sheetConfig, data) {
  const sheets = getSheetsClient();
  const row = objectToRow(sheetConfig.headers, data);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetConfig.name}!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return data;
}

async function findById(sheetConfig, id) {
  const records = await readAll(sheetConfig);
  return records.find((item) => item[sheetConfig.idField] === id);
}

async function getRowIndexById(sheetConfig, id) {
  const rows = await getSheetRows(sheetConfig);
  const headers = rows[0] || sheetConfig.headers;
  const idColumn = headers.indexOf(sheetConfig.idField);
  if (idColumn === -1) {
    throw new ApiError(500, `Coluna de ID ${sheetConfig.idField} nao encontrada em ${sheetConfig.name}`);
  }

  const index = rows.findIndex((row, rowIndex) => rowIndex > 0 && row[idColumn] === id);
  return index;
}

async function updateById(sheetConfig, id, nextData) {
  const sheets = getSheetsClient();
  const rowIndex = await getRowIndexById(sheetConfig, id);
  if (rowIndex === -1) {
    throw new ApiError(404, `Registro ${id} nao encontrado`);
  }
  const row = objectToRow(sheetConfig.headers, nextData);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetConfig.name}!A${rowIndex + 1}:Z${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
  return nextData;
}

async function deleteById(sheetConfig, id) {
  const sheets = getSheetsClient();
  const rowIndex = await getRowIndexById(sheetConfig, id);
  if (rowIndex === -1) {
    throw new ApiError(404, `Registro ${id} nao encontrado`);
  }

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const targetSheet = meta.data.sheets.find((sheet) => sheet.properties.title === sheetConfig.name);
  if (!targetSheet) {
    throw new ApiError(500, `Aba ${sheetConfig.name} nao encontrada`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: targetSheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
}

module.exports = {
  ensureSheetsStructure,
  readAll,
  append,
  findById,
  updateById,
  deleteById,
};
