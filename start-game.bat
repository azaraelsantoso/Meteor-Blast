@echo off
title Meteor Blaster (Node.js + Supabase)
cd /d "%~dp0"

echo ==============================================
echo   🚀 Starting Meteor Blaster Game Server...
echo ==============================================

if exist "%~dp0node.exe" (
  set "NODE_BIN=%~dp0node.exe"
) else (
  set "NODE_BIN=node"
)

echo Starting browser at http://localhost:3000 ...
start "" "http://localhost:3000"

"%NODE_BIN%" server.js
pause
