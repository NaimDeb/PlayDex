@echo off
set "ROOT=%~dp0"

if not exist "%ROOT%backend" (
    echo Dossier backend introuvable : "%ROOT%backend"
    pause
    exit /b
)

if not exist "%ROOT%frontend" (
    echo Dossier frontend introuvable : "%ROOT%frontend"
    pause
    exit /b
)

start "Backend" cmd /k "cd /d ""%ROOT%backend"" && symfony server:start"
start "Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"