param(
    [ValidateSet("Full", "Frontend", "Backend", "Docker")]
    [string]$Modo = "Full",

    [switch]$ConectarApi,

    [switch]$AbrirNavegador
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $RepoRoot "frontend"
$BackendProj = Join-Path $RepoRoot "backend\Vento.Api\Vento.Api.csproj"
$DevSettings = Join-Path $RepoRoot "backend\Vento.Api\appsettings.Development.json"
$ExampleSettings = Join-Path $RepoRoot "backend\Vento.Api\appsettings.Example.json"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VENTO MARKETPLACE (WYM) - INICIADOR DE ENTORNO LOCAL     " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Modo seleccionado : $Modo" -ForegroundColor Gray

if ($Modo -eq "Docker") {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] Docker Desktop no esta instalado o no esta en PATH." -ForegroundColor Red
        Write-Host "        Instala Docker Desktop o usa '.\iniciar.bat' para modo nativo." -ForegroundColor Yellow
        exit 1
    }
    Push-Location $RepoRoot
    try {
        Write-Host "[DOCKER] Levantando PostgreSQL BD2 + Vento.Api (.NET 8) + Frontend (Vite)..." -ForegroundColor Cyan
        docker compose up --build
    } finally {
        Pop-Location
    }
    exit 0
}

# 1. Resolver ejecutable de .NET 8 SDK (global o instalado en perfil de usuario)
function Resolve-DotnetPath {
    $cmd = Get-Command dotnet -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $userDotnet = Join-Path $env:USERPROFILE ".dotnet\dotnet.exe"
    if (Test-Path $userDotnet) {
        $env:DOTNET_ROOT = Join-Path $env:USERPROFILE ".dotnet"
        $env:PATH = "$env:DOTNET_ROOT;$env:PATH"
        return $userDotnet
    }
    return $null
}

# 2. Verificar si un puerto TCP local ya está en uso
function Test-PortInUse([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

$backendProc = $null
$frontendProc = $null

try {
    # -------------------- PREPARAR Y LEVANTAR BACKEND (.NET 8) --------------------
    if ($Modo -eq "Full" -or $Modo -eq "Backend") {
        $dotnetExe = Resolve-DotnetPath
        if (-not $dotnetExe) {
            Write-Host "[ERROR] No se encontro .NET 8 SDK instalado en PATH ni en ~/.dotnet." -ForegroundColor Red
            Write-Host "        Ejecuta con '-Modo Frontend' o instala .NET 8 SDK." -ForegroundColor Yellow
            exit 1
        }

        if ((-not (Test-Path $DevSettings)) -and (Test-Path $ExampleSettings)) {
            Copy-Item $ExampleSettings $DevSettings
            Write-Host "[INFO] Creado backend/Vento.Api/appsettings.Development.json desde plantilla." -ForegroundColor Yellow
        }

        if (Test-PortInUse 5000) {
            Write-Host "[OK] El puerto 5000 ya tiene un servicio escuchando (Backend activo)." -ForegroundColor Green
        } else {
            Write-Host "[1/2] Compilando e iniciando Backend Vento.Api en http://localhost:5000 ..." -ForegroundColor Cyan
            $backendProc = Start-Process -FilePath $dotnetExe `
                -ArgumentList "run --project `"$BackendProj`" --urls http://0.0.0.0:5000" `
                -WorkingDirectory (Join-Path $RepoRoot "backend") `
                -NoNewWindow -PassThru
            Start-Sleep -Seconds 3
        }
    }

    # -------------------- PREPARAR Y LEVANTAR FRONTEND (REACT + VITE) --------------------
    if ($Modo -eq "Full" -or $Modo -eq "Frontend") {
        $npmCmd = if ($IsWindows -or $env:OS -match "Windows") { "npm.cmd" } else { "npm" }
        if (-not (Get-Command $npmCmd -ErrorAction SilentlyContinue)) {
            Write-Host "[ERROR] No se encontro Node.js / npm instalado en el sistema." -ForegroundColor Red
            exit 1
        }

        $nodeModules = Join-Path $FrontendDir "node_modules"
        if (-not (Test-Path $nodeModules)) {
            Write-Host "[INFO] Instalando dependencias npm en /frontend por primera vez..." -ForegroundColor Yellow
            Push-Location $FrontendDir
            & $npmCmd install
            Pop-Location
        }

        if ($ConectarApi) {
            $env:VITE_API_URL = "http://localhost:5000/api"
            Write-Host "[INFO] VITE_API_URL activado hacia http://localhost:5000/api" -ForegroundColor Green
        }

        if (Test-PortInUse 5173) {
            Write-Host "[OK] El puerto 5173 ya tiene un servidor Vite activo: http://localhost:5173" -ForegroundColor Green
        } else {
            Write-Host "[2/2] Iniciando Frontend React + Vite en http://localhost:5173 ..." -ForegroundColor Cyan
            $frontendProc = Start-Process -FilePath $npmCmd `
                -ArgumentList "run dev" `
                -WorkingDirectory $FrontendDir `
                -NoNewWindow -PassThru
            Start-Sleep -Seconds 2
        }
    }

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " SERVICIOS DISPONIBLES:" -ForegroundColor Green
    if ($Modo -eq "Full" -or $Modo -eq "Frontend") {
        Write-Host "   Frontend (React + Vite) : http://localhost:5173" -ForegroundColor White
    }
    if ($Modo -eq "Full" -or $Modo -eq "Backend") {
        Write-Host "   Backend  (.NET 8 API)   : http://localhost:5000/api/health" -ForegroundColor White
    }
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host " Presiona Ctrl + C para detener los servidores iniciados." -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""

    if ($AbrirNavegador -and ($Modo -eq "Full" -or $Modo -eq "Frontend")) {
        Start-Process "http://localhost:5173"
    }

    # Mantener el script vivo mientras alguno de los procesos lanzados siga corriendo
    while (
        ($null -ne $backendProc -and -not $backendProc.HasExited) -or
        ($null -ne $frontendProc -and -not $frontendProc.HasExited)
    ) {
        Start-Sleep -Seconds 1
    }
}
finally {
    if ($null -ne $frontendProc -and -not $frontendProc.HasExited) {
        Write-Host "`nDeteniendo Frontend Vite (PID $($frontendProc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($null -ne $backendProc -and -not $backendProc.HasExited) {
        Write-Host "Deteniendo Backend Vento.Api (PID $($backendProc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
}
