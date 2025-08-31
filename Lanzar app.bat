@echo off
setlocal

:: Obtener la ruta del directorio donde está el script
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

:: Abrir la primera ventana de CMD, cambiar al directorio y ejecutar npm start
start "Servidor" cmd /k "cd /d %BACKEND_DIR% && node server.js"

:: Abrir la segunda ventana de CMD, cambiar al directorio y ejecutar npm start
start "Servidor" cmd /k "cd /d %SCRIPT_DIR% && npm start"

:: Abrir la tercera ventana de CMD, cambiar al directorio y ejecutar npm run electron-start
start "Electron" cmd /k "cd /d %SCRIPT_DIR% && npm run electron-start"

endlocal
