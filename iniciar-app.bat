@echo off
setlocal
cd /d "%~dp0"

set "CODEX_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "PORT=4173"

if exist "%CODEX_PY%" (
  set "PYTHON_CMD=%CODEX_PY%"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set "PYTHON_CMD=python"
  )
)

if not defined PYTHON_CMD (
  echo No encontre Python para levantar el servidor.
  echo Instala Python o subi la carpeta a un hosting HTTPS como Netlify, Vercel o GitHub Pages.
  pause
  exit /b 1
)

echo Usando: %PYTHON_CMD%
start "VozSenias server" /min "%PYTHON_CMD%" -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%"

echo App abierta en http://127.0.0.1:%PORT%
echo Para apagar el servidor, cerra la ventana "VozSenias server".
pause
