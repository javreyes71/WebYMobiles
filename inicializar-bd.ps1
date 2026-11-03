param(
    [string]$DbName = "vento_bd2",
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$AdminUser = "postgres",
    [string]$AppPassword = "VentoApp2026_Local!"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SqlDir = Join-Path $RepoRoot "backend\database"
$DevSettings = Join-Path $RepoRoot "backend\Vento.Api\appsettings.Development.json"

function Resolve-PsqlPath {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $candidates = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending
    if ($candidates) { return $candidates[0].FullName }
    return $null
}

$psql = Resolve-PsqlPath
if (-not $psql) {
    Write-Host "[ERROR] No se encontro psql.exe en PATH ni en C:\Program Files\PostgreSQL." -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " INICIALIZADOR DE POSTGRESQL LOCAL (BD2 + VENTO RBAC)       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " psql detectado : $psql" -ForegroundColor Gray
Write-Host " Base destino   : $DbName ($HostName`:$Port)" -ForegroundColor Gray
Write-Host ""

$secPwd = Read-Host "Ingresa la contrasena local del superusuario '$AdminUser'" -AsSecureString
$plainAdminPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPwd)
)
$env:PGPASSWORD = $plainAdminPwd
$env:PGCLIENTENCODING = "UTF8"

try {
    Write-Host "[1/3] Verificando base de datos '$DbName' y rol 'vento_app'..." -ForegroundColor Cyan
    $exists = & $psql -h $HostName -p $Port -U $AdminUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName';"
    if ($exists -notmatch "1") {
        & $psql -h $HostName -p $Port -U $AdminUser -d postgres -c "CREATE DATABASE `"$DbName`" ENCODING 'UTF8';"
    }

    Write-Host "[2/3] Ejecutando scripts SQL 00..05 (49 tablas BD2, 23 triggers, vistas y RBAC)..." -ForegroundColor Cyan
    $scripts = @(
        "00_setup_usuario_bd.sql",
        "01_bd2_tablas_restricciones_indices.sql",
        "02_bd2_triggers.sql",
        "03_bd2_funciones_y_vistas.sql",
        "04_extension_vento_rbac.sql",
        "05_seed_vento_demo.sql"
    )
    foreach ($s in $scripts) {
        $fullPath = Join-Path $SqlDir $s
        Write-Host "   -> $s" -ForegroundColor Gray
        & $psql -h $HostName -p $Port -U $AdminUser -d $DbName -v ON_ERROR_STOP=1 -f $fullPath | Out-Null
    }

    & $psql -h $HostName -p $Port -U $AdminUser -d $DbName -c "ALTER ROLE vento_app WITH LOGIN PASSWORD '$AppPassword';" | Out-Null

    Write-Host "[3/3] Actualizando appsettings.Development.json local (ignorado en Git)..." -ForegroundColor Cyan
    $devJson = @{
        Logging = @{ LogLevel = @{ Default = "Information"; "Microsoft.AspNetCore" = "Warning" } }
        ConnectionStrings = @{
            DefaultConnection = "Host=$HostName;Port=$Port;Database=$DbName;Username=vento_app;Password=$AppPassword"
        }
        Jwt = @{
            Key = "Clave_Desarrollo_Local_Vento_Marketplace_2026_Segura!"
            Issuer = "Vento.Api"
            Audience = "Vento.Frontend"
            ExpireHours = 12
        }
        Cors = @{
            AllowedOrigins = @("http://localhost:5173", "http://127.0.0.1:5173")
        }
    } | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($DevSettings, $devJson, [System.Text.Encoding]::UTF8)

    Write-Host ""
    Write-Host "[OK] Base '$DbName' lista y conectada con rol 'vento_app'!" -ForegroundColor Green
    Write-Host "     Ahora ejecuta: .\iniciar.bat -ConectarApi" -ForegroundColor Yellow
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
