const DEFAULT_BACKEND_ORIGIN = 'https://cvacare-backend-526387613359.us-central1.run.app';

function stripTrailingSlash(value) {
  return value ? value.replace(/\/$/, '') : value;
}

function stripApiSuffix(value) {
  return value ? value.replace(/\/api\/?$/, '') : value;
}

const MAIN_API_URL = stripTrailingSlash(process.env.EXPO_PUBLIC_API_URL) || `${DEFAULT_BACKEND_ORIGIN}/api`;
const BACKEND_ORIGIN = stripApiSuffix(MAIN_API_URL);
const GAIT_SERVICE_URL = stripTrailingSlash(process.env.EXPO_PUBLIC_GAIT_API_URL) || BACKEND_ORIGIN;
const THERAPY_SERVICE_URL = stripTrailingSlash(process.env.EXPO_PUBLIC_THERAPY_API_URL) || BACKEND_ORIGIN;

export const API_CONFIG = {
  BASE_IP: BACKEND_ORIGIN.replace('http://', '').replace('https://', ''),
  MAIN_API_URL,
  GAIT_API_URL: GAIT_SERVICE_URL,
  THERAPY_API_URL: THERAPY_SERVICE_URL,
};

export const API_URL = MAIN_API_URL;
export const GAIT_API_URL = GAIT_SERVICE_URL;
export const THERAPY_API_URL = THERAPY_SERVICE_URL;

console.log('📡 API Configuration:', {
  'Main API': API_CONFIG.MAIN_API_URL,
  'Gait Analysis': API_CONFIG.GAIT_API_URL,
  'Therapy Exercises': API_CONFIG.THERAPY_API_URL,
});

export default API_CONFIG;
