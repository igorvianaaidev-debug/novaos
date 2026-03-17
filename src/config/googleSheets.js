const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const GOOGLE_API_TIMEOUT_MS = Number(process.env.GOOGLE_API_TIMEOUT_MS || 12000);

let sheetsClient;

function buildPrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  // Configure estas credenciais no arquivo .env (service account do Google Cloud).
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: buildPrivateKey(),
    scopes: SCOPES
  });

  // Evita requests penduradas por muito tempo em ambiente de deploy.
  google.options({
    timeout: GOOGLE_API_TIMEOUT_MS
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

module.exports = {
  getSheetsClient
};
