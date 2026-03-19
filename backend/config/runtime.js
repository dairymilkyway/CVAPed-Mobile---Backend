const isProduction = process.env.NODE_ENV === 'production';

function normalizeUrl(value) {
  return value ? value.replace(/\/$/, '') : value;
}

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.SECRET_KEY || null;
}

function requireJwtSecret() {
  const secret = getJwtSecret();

  if (!secret) {
    throw new Error('Missing JWT secret. Set JWT_SECRET or SECRET_KEY.');
  }

  return secret;
}

function getGoogleClientId() {
  if (process.env.GOOGLE_CLIENT_ID) {
    return process.env.GOOGLE_CLIENT_ID;
  }

  if (isProduction) {
    throw new Error('Missing GOOGLE_CLIENT_ID in production.');
  }

  return '292803901437-fk6kg98k8gj8e61k39osqlvf03cq3aer.apps.googleusercontent.com';
}

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS || '';
  return raw.split(',').map(origin => origin.trim()).filter(Boolean);
}

function getServiceUrl(envName, fallbackPort) {
  const envValue = normalizeUrl(process.env[envName]);

  if (envValue) {
    return envValue;
  }

  const fallback = `http://127.0.0.1:${fallbackPort}`;

  console.warn(`⚠️ ${envName} not set. Falling back to ${fallback}`);
  return fallback;
}

module.exports = {
  getAllowedOrigins,
  getGoogleClientId,
  getJwtSecret,
  getServiceUrl,
  isProduction,
  requireJwtSecret
};
