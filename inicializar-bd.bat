@echo off
REM Inicializador en 1 comando de PostgreSQL local (BD2 + Vento RBAC)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0inicializar-bd.ps1" %*
