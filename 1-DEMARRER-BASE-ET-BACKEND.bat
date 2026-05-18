@echo off
title SomePharm - Base de donnees & Backend
echo ======================================================
echo   1. DEMARRAGE DE LA BASE DE DONNEES (POSTGRESQL)
echo ======================================================
docker-compose up -d

echo.
echo ======================================================
echo   2. DEMARRAGE DU BACKEND (SPRING BOOT - PORT 8080)
echo ======================================================
cd somepharm-backend-main
java -cp "target/classes;target/dependency/*" com.somepharm.hrportal.HrportalApplication
pause
