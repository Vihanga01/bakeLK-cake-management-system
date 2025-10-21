@echo off
echo Starting Bake.lk Cake Management System...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd Backend && npm start"

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd Frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul

