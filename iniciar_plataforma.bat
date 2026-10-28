@echo off
title Fonbienes Inmuebles - Inteligencia Comercial
echo ==========================================================
echo    INICIANDO PLATAFORMA FONBIENES INMUEBLES (FBP010)
echo ==========================================================
echo.
if not exist "dist\index.html" (
  echo Compilando version optimizada React + Tailwind...
  call npm run build
)
echo Abriendo navegador en http://localhost:3000/ ...
start http://localhost:3000/
node server.js
pause
