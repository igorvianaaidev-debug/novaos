const REQUIRED_ENV_VARS = [
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY'
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Variaveis de ambiente ausentes: ${missing.join(', ')}`);
  }
}

module.exports = {
  validateEnv
};
