const fs = require('fs');
const path = require('path');

function readEnvFile(filePath) {
  const env = {};

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }

  return env;
}

async function checkJson(url, label) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing frontend .env at ${envPath}`);
  }

  const env = readEnvFile(envPath);
  const apiUrl = env.EXPO_PUBLIC_API_URL;
  const gaitUrl = env.EXPO_PUBLIC_GAIT_API_URL;
  const therapyUrl = env.EXPO_PUBLIC_THERAPY_API_URL;

  if (!apiUrl || !gaitUrl || !therapyUrl) {
    throw new Error('Missing one or more frontend backend URLs in .env');
  }

  console.log('Verifying frontend backend configuration...');
  console.log(`Main API: ${apiUrl}`);
  console.log(`Gait API: ${gaitUrl}`);
  console.log(`Therapy API: ${therapyUrl}`);

  const [root, ready, gait, therapy] = await Promise.all([
    checkJson(apiUrl.replace(/\/api\/?$/, '/'), 'Root endpoint'),
    checkJson(apiUrl.replace(/\/api\/?$/, '/readyz'), 'Readiness endpoint'),
    checkJson(`${gaitUrl.replace(/\/$/, '')}/api/gait/health`, 'Gait health endpoint'),
    checkJson(`${therapyUrl.replace(/\/$/, '')}/api/therapy/health`, 'Therapy health endpoint')
  ]);

  if (!ready.ready) {
    throw new Error(`Readiness endpoint returned not ready: ${JSON.stringify(ready)}`);
  }

  console.log('OK Root:', root.message || root.service || 'reachable');
  console.log('OK Ready:', ready.ready);
  console.log('OK Gait:', gait.status || 'healthy');
  console.log('OK Therapy:', therapy.status || 'healthy');
  console.log('Backend is ready for frontend build testing.');
}

main().catch(error => {
  console.error('Backend verification failed.');
  console.error(error.message);
  process.exit(1);
});
