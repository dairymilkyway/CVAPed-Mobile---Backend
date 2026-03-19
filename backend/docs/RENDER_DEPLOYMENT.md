# Render Deployment Guide

## Recommended service type

Use a single **Web Service** with Docker.

This backend runs three processes inside one container via `node start.js`:
- Node API on `PORT`
- Gait Flask service on `GAIT_ANALYSIS_PORT`
- Therapy Flask service on `THERAPY_PORT`

## 1. Rotate secrets first

Before deploying publicly, rotate these if they were ever stored in local files:

- MongoDB Atlas database user password / connection string
- Firebase service account key
- JWT secret
- Cloudinary API secret
- Azure Speech key

After rotating, update your local `.env` and use only the new values.

## 2. Prepare Firebase secret for Render

Render env vars work best if you store the Firebase service account JSON as base64.

PowerShell:

```powershell
$bytes = [System.IO.File]::ReadAllBytes("backend\config\serviceAccountKey.json")
[Convert]::ToBase64String($bytes)
```

Copy the output and use it as `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`.

## 3. Create the Render service

### Option A: Blueprint

1. Push this repo to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Select your repo.
4. Render will detect `render.yaml`.
5. Update the repo URL inside `render.yaml` after your first push.

### Option B: Manual Web Service

1. In Render, click **New +** -> **Web Service**.
2. Connect your GitHub repo.
3. Root Directory: leave blank.
4. Environment: **Docker**.
5. Dockerfile Path: `./backend/Dockerfile`
6. Docker Context: `./backend`
7. Instance Type: **Starter** recommended.
8. Health Check Path: `/readyz`

## 4. Required Render environment variables

Set these in the Render dashboard:

- `NODE_ENV=production`
- `FLASK_ENV=production`
- `USE_GLOBAL_PYTHON=true`
- `PORT=8080`
- `GAIT_ANALYSIS_PORT=5001`
- `THERAPY_PORT=5002`
- `DB_NAME=CVACare`
- `MONGODB_URI=<new rotated atlas uri>`
- `JWT_SECRET=<new long random secret>`
- `SECRET_KEY=<same value as JWT_SECRET>`
- `CORS_ORIGINS=https://your-frontend-domain.com`
- `GOOGLE_CLIENT_ID=<google oauth client id>`
- `CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>`
- `CLOUDINARY_API_KEY=<cloudinary api key>`
- `CLOUDINARY_API_SECRET=<cloudinary api secret>`
- `AZURE_SPEECH_KEY=<azure speech key>`
- `AZURE_SPEECH_REGION=<azure speech region>`
- `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=<base64 service account json>`

## 5. Deploy

After saving env vars, trigger a deploy in Render.

Render will build `backend/Dockerfile`, start the container, and expose port `8080`.

## 6. Live smoke tests

Replace `<render-url>` with your Render public URL.

```bash
curl https://<render-url>/readyz
curl https://<render-url>/
```

Expected:
- `/readyz` returns `ready: true`
- `/` returns API metadata

## 7. Functional smoke tests

After health checks pass, verify these flows from your frontend or API client:

1. Register/login
2. Google login
3. Success story image upload
4. Articulation audio assessment
5. Fluency audio assessment
6. Gait analysis submission
7. Therapy prediction endpoints

## 8. Important Render note

This is a multi-process container. Render can run it, but **Starter** is safer than free-style small instances because your therapy Python service uses ML libraries and more memory.

## 9. Monthly cost expectation on Render

- Web Service Starter: about `$7/mo`
- MongoDB Atlas M0: `$0`
- Cloudinary free tier: `$0`
- Azure Speech: usage-based

## 10. Production done criteria

You are production-ready when all of these are true:

- Old secrets rotated
- New secrets added in Render
- Deploy succeeds
- `/readyz` passes
- Core auth/upload/assessment flows succeed against the live URL
