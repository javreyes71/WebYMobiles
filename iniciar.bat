@echo off
REM ============================================================================
REM Lanzador rapido para Windows (evita bloqueos de ExecutionPolicy en PowerShell)
REM Uso:
REM   iniciar.bat                      -> Levanta Backend (:5000) + Frontend (:5173)
REM   iniciar.bat -Modo Frontend       -> Levanta solo Frontend (:5173)
REM   iniciar.bat -Modo Backend        -> Levanta solo Backend (:5000)
REM   iniciar.bat -ConectarApi         -> Levanta ambos conectando VITE_API_URL
REM ============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1" %*
