@echo off
title Push to GitHub - Meteor Blaster
cd /d "%~dp0"

echo ======================================================
echo   Pushing Meteor Blaster to GitHub...
echo   Repo: https://github.com/azaraelsantoso/Meteor-Blast.git
echo ======================================================

set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
  echo [SUCCESS] Berhasil diupload ke GitHub!
) else (
  echo.
  echo [INFO] Jika gagal autentikasi:
  echo 1. Pastikan Anda sudah login akun GitHub di browser.
  echo 2. Jika diminta Password, gunakan GitHub Personal Access Token (PAT):
  echo    https://github.com/settings/tokens
)
echo.
pause
