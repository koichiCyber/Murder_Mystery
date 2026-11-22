@echo off
cd /d "%~dp0"
title An Mang Dinh Thu - Launcher (keep this window open)
set "NODE=node"
if exist "%~dp0node\node.exe" set "NODE=%~dp0node\node.exe"
"%NODE%" --version >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js was not found.
  echo  Install the LTS version from https://nodejs.org  then run start.bat again.
  echo  Chua co Node.js. Tai ban LTS tai https://nodejs.org roi chay lai start.bat.
  echo.
  start "" https://nodejs.org
  pause
  exit /b 1
)
"%NODE%" launcher.js
if errorlevel 1 pause
