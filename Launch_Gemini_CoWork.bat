@echo off
title Gemini Co-Work - AI Workstation
color 0B
echo ========================================================
echo               GEMINI CO-WORK v1.2.0
echo             Desktop AI Pair Programmer
echo ========================================================
echo.

:: Ensure we run from the project root directory
cd /d "%~dp0"

echo [1/4] Checking environment...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your PATH. Please install Node.js 18+ to run Gemini Co-Work.
    pause
    exit /b 1
)

:: Check and start local Ollama server if available for 100% free offline AI
if exist "%LocalAppData%\Programs\Ollama\ollama.exe" (
    tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
    if %ERRORLEVEL% neq 0 (
        echo Starting local Ollama engine in background...
        start "Ollama Engine" /min "%LocalAppData%\Programs\Ollama\ollama.exe" serve
    )
)

echo [2/4] Starting Gemini Co-Work backend & frontend services...
start "Gemini Co-Work Server" /min cmd /c "npm run dev"

echo [3/4] Launching Gemini Co-Work Desktop Application...
timeout /t 3 /nobreak >nul

:: Launch in native desktop app window mode using Edge or Chrome if available
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1400,900
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1400,900
    exit
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1400,900
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1400,900
    exit
)

:: Default browser fallback
start http://localhost:5173
exit
