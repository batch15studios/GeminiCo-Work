@echo off
title Gemini Co-Work v1.2.0 Installer
color 0A
echo ========================================================
echo             Gemini Co-Work v1.2.0 Setup
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install_Gemini_CoWork.ps1"
if %ERRORLEVEL% equ 0 (
    echo.
    echo Setup completed successfully!
    echo Launching Gemini Co-Work...
    timeout /t 2 >nul
    start "" "%LOCALAPPDATA%\Programs\Gemini Co-Work\Launch_Gemini_CoWork.bat"
) else (
    echo.
    echo Setup encountered an error. Please see the output above.
)
pause
