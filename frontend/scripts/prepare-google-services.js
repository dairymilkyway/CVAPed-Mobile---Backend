const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const sourcePath = process.env.GOOGLE_SERVICES_JSON || path.join(rootDir, 'google-services.json');
const targetPath = path.join(rootDir, 'android', 'app', 'google-services.json');

if (!fs.existsSync(sourcePath)) {
  console.error(`Missing google-services.json source: ${sourcePath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Prepared google-services.json for Android build at ${targetPath}`);
