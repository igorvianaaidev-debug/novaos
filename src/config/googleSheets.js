const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

module.exports = {
  getSheetsClient
};
