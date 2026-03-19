param(
    [string]$ProjectId = "project-75d04eb0-a4d7-4d9c-849",
    [string]$Region = "us-central1",
    [string]$ServiceName = "cvacare-backend",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

function Read-DotEnv {
    param([string]$Path)

    $values = @{}

    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()

        if (-not $trimmed -or $trimmed.StartsWith("#")) {
            continue
        }

        $index = $trimmed.IndexOf("=")
        if ($index -lt 1) {
            continue
        }

        $key = $trimmed.Substring(0, $index).Trim()
        $value = $trimmed.Substring($index + 1)
        $values[$key] = $value
    }

    return $values
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $scriptDir ".env"

if (-not (Test-Path $envPath)) {
    throw "Missing .env file at $envPath"
}

$envMap = Read-DotEnv -Path $envPath

$requiredKeys = @(
    "MONGODB_URI",
    "DB_NAME",
    "JWT_SECRET",
    "SECRET_KEY",
    "GOOGLE_CLIENT_ID",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "AZURE_SPEECH_KEY",
    "AZURE_SPEECH_REGION",
    "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64"
)

$missingKeys = $requiredKeys | Where-Object { -not $envMap.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envMap[$_]) }
if ($missingKeys.Count -gt 0) {
    throw "Missing required .env keys: $($missingKeys -join ', ')"
}

$deployEnv = [ordered]@{
    NODE_ENV = "production"
    FLASK_ENV = "production"
    USE_GLOBAL_PYTHON = "true"
    GAIT_ANALYSIS_PORT = if ($envMap.ContainsKey("GAIT_ANALYSIS_PORT")) { $envMap["GAIT_ANALYSIS_PORT"] } else { "5001" }
    THERAPY_PORT = if ($envMap.ContainsKey("THERAPY_PORT")) { $envMap["THERAPY_PORT"] } else { "5002" }
    DB_NAME = $envMap["DB_NAME"]
    JWT_SECRET = $envMap["JWT_SECRET"]
    SECRET_KEY = $envMap["SECRET_KEY"]
    MONGODB_URI = $envMap["MONGODB_URI"]
    CORS_ORIGINS = if ($envMap.ContainsKey("CORS_ORIGINS")) { $envMap["CORS_ORIGINS"] } else { "" }
    GOOGLE_CLIENT_ID = $envMap["GOOGLE_CLIENT_ID"]
    CLOUDINARY_CLOUD_NAME = $envMap["CLOUDINARY_CLOUD_NAME"]
    CLOUDINARY_API_KEY = $envMap["CLOUDINARY_API_KEY"]
    CLOUDINARY_API_SECRET = $envMap["CLOUDINARY_API_SECRET"]
    AZURE_SPEECH_KEY = $envMap["AZURE_SPEECH_KEY"]
    AZURE_SPEECH_REGION = $envMap["AZURE_SPEECH_REGION"]
    FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = $envMap["FIREBASE_SERVICE_ACCOUNT_JSON_BASE64"]
}

$tempEnvFile = Join-Path ([System.IO.Path]::GetTempPath()) ("cloudrun-env-" + [System.Guid]::NewGuid().ToString() + ".yaml")
$yamlLines = @()
foreach ($item in $deployEnv.GetEnumerator()) {
    $escaped = $item.Value.Replace("'", "''")
    $yamlLines += "$($item.Key): '$escaped'"
}
Set-Content -Path $tempEnvFile -Value ($yamlLines -join [Environment]::NewLine) -Encoding UTF8

$image = "$Region-docker.pkg.dev/$ProjectId/backend-images/$ServiceName`:$ImageTag"

Write-Host "Deploying $ServiceName to Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $ProjectId" -ForegroundColor DarkGray
Write-Host "Region:  $Region" -ForegroundColor DarkGray
Write-Host "Image:   $image" -ForegroundColor DarkGray
Write-Host "EnvFile: $tempEnvFile" -ForegroundColor DarkGray

try {
    gcloud run deploy $ServiceName `
      --image $image `
      --region $Region `
      --platform managed `
      --allow-unauthenticated `
      --port 8080 `
      --memory 2Gi `
      --cpu 1 `
      --timeout 300 `
      --max-instances 3 `
      --env-vars-file $tempEnvFile
}
finally {
    if (Test-Path $tempEnvFile) {
        Remove-Item $tempEnvFile -Force
    }
}
