@echo off
title Gemini Co-Work - AI Workstation
color 0B
echo ========================================================
echo               GEMINI CO-WORK v1.5.0
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
        echo Starting local Ollama engine with GPU acceleration in background...
        set OLLAMA_IGPU_ENABLE=1
        start "Ollama Engine" /min cmd /c "set OLLAMA_IGPU_ENABLE=1 && \"%LocalAppData%\Programs\Ollama\ollama.exe\" serve"
    )
)

set APP_PORT=5000
if exist "frontend\dist\index.html" (
    echo [2/4] Starting Gemini Co-Work production server on port 5000...
    start "Gemini Co-Work Server" /min cmd /c "cd backend && node --env-file=.env.local server.js"
) else (
    set APP_PORT=5173
    echo [2/4] Starting Gemini Co-Work development servers...
    start "Gemini Co-Work Server" /min cmd /c "npm run dev"
)

echo [3/4] Waiting for workstation interface on port %APP_PORT%...
powershell -Command "for ($i=0; $i -lt 40; $i++) { try { $r = [System.Net.WebRequest]::Create('http://localhost:' + $env:APP_PORT); $res = $r.GetResponse(); if ($res.StatusCode -eq 200) { exit 0 } } catch {} Start-Sleep -Milliseconds 250 }; exit 0" >nul 2>nul

echo [4/4] Launching desktop workstation window...
:: Launch in native desktop app window mode using Edge or Chrome if available
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:%APP_PORT% --window-size=1400,900
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:%APP_PORT% --window-size=1400,900
    exit
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:%APP_PORT% --window-size=1400,900
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=http://localhost:%APP_PORT% --window-size=1400,900
    exit
)

:: Default browser fallback
start http://localhost:%APP_PORT%
exit
