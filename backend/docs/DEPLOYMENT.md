# Deployment Notes

## Production prerequisites

Set these environment variables on your hosting platform:

- `NODE_ENV=production`
- `FLASK_ENV=production`
- `USE_GLOBAL_PYTHON=true`
- `PORT=8080`
- `GAIT_ANALYSIS_PORT=5001`
- `THERAPY_PORT=5002`
- `MONGODB_URI`
- `DB_NAME`
- `JWT_SECRET`
- `SECRET_KEY` (use the same value as `JWT_SECRET`)
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` or `FIREBASE_SERVICE_ACCOUNT_JSON`

## Local production smoke test

```powershell
cd backend
$env:NODE_ENV="production"
$env:FLASK_ENV="production"
node start.js
```

## Health checks

- `GET /healthz` -> process health
- `GET /readyz` -> database + internal Python dependency readiness
- `GET /api/gait/health` -> gait service health
- `GET /api/therapy/health` -> therapy service health

## Docker

```bash
docker build -t cvacare-backend ./backend
docker run --env-file ./backend/.env -p 8080:8080 cvacare-backend
```

## GitHub Actions secrets

Create these repository secrets before enabling `.github/workflows/deploy-cloud-run.yml`:

- `GCP_SA_KEY`
- `CORS_ORIGINS`
- `MONGODB_URI`
- `DB_NAME`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`

## Required manual security action

Rotate any existing credentials that were ever stored in local `.env` files or `config/serviceAccountKey.json` before deploying publicly.
