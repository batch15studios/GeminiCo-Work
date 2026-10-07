# Gemini Co-Work v1.2.0 Installer Script
# Performs installation to %LOCALAPPDATA%\Programs\Gemini Co-Work
# Configures desktop icons, start menu entries, and uninstall hooks

[CmdletBinding()]
param(
    [string]$TargetDir = "$env:LOCALAPPDATA\Programs\Gemini Co-Work"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         Gemini Co-Work v1.2.0 - Windows Setup            " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$SourceDir = (Get-Item $PSScriptRoot).Parent.FullName

Write-Host "[1/5] Target installation directory: $TargetDir" -ForegroundColor Yellow
if (!(Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

Write-Host "[2/5] Copying application files..." -ForegroundColor Yellow
# Exclude node_modules during copy, install fresh or copy lightweight files
$ExcludeList = @("node_modules", ".git", "dist-installer")

Get-ChildItem -Path $SourceDir -Recurse | Where-Object {
    $item = $_
    $skip = $false
    foreach ($exclude in $ExcludeList) {
        if ($item.FullName -match "\\$exclude(\\.*)?$") {
            $skip = $true
            break
        }
    }
    !$skip
} | ForEach-Object {
    $relPath = $_.FullName.Substring($SourceDir.Length).TrimStart('\', '/')
    $destPath = Join-Path $TargetDir $relPath
    if ($_.PSIsContainer) {
        if (!(Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
    } else {
        Copy-Item -Path $_.FullName -Destination $destPath -Force
    }
}

Write-Host "[3/5] Verifying dependencies in installation folder..." -ForegroundColor Yellow
Push-Location $TargetDir
try {
    npm install --silent
    npm install --prefix frontend --silent
    npm run build --prefix frontend --silent
} catch {
    Write-Warning "npm install had warnings, continuing..."
}
Pop-Location

Write-Host "[4/5] Creating Desktop and Start Menu Shortcuts..." -ForegroundColor Yellow
$WshShell = New-Object -ComObject WScript.Shell

# Desktop shortcut
$DesktopPaths = @(
    [Environment]::GetFolderPath("Desktop"),
    "$env:USERPROFILE\OneDrive\Desktop"
)

$IconPath = Join-Path $TargetDir "resources\app-icon-clean.ico"
if (!(Test-Path $IconPath)) {
    $IconPath = Join-Path $TargetDir "resources\app-icon.ico"
}
$TargetExe = Join-Path $TargetDir "Launch_Gemini_CoWork.bat"

foreach ($dPath in $DesktopPaths) {
    if (Test-Path $dPath) {
        $ShortcutFile = Join-Path $dPath "Gemini Co-Work.lnk"
        $Shortcut = $WshShell.CreateShortcut($ShortcutFile)
        $Shortcut.TargetPath = $TargetExe
        $Shortcut.WorkingDirectory = $TargetDir
        $Shortcut.Description = "Gemini Co-Work AI Workstation v1.2"
        if (Test-Path $IconPath) {
            $Shortcut.IconLocation = "$IconPath, 0"
        }
        $Shortcut.Save()
        Write-Host "  -> Created desktop shortcut at: $ShortcutFile" -ForegroundColor Green
    }
}

# Start Menu shortcut
$StartMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Gemini Co-Work"
if (!(Test-Path $StartMenuDir)) {
    New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
}
$StartMenuShortcut = Join-Path $StartMenuDir "Gemini Co-Work.lnk"
$SMShortcut = $WshShell.CreateShortcut($StartMenuShortcut)
$SMShortcut.TargetPath = $TargetExe
$SMShortcut.WorkingDirectory = $TargetDir
$SMShortcut.Description = "Gemini Co-Work AI Workstation v1.2"
if (Test-Path $IconPath) {
    $SMShortcut.IconLocation = "$IconPath, 0"
}
$SMShortcut.Save()
Write-Host "  -> Created Start Menu shortcut at: $StartMenuShortcut" -ForegroundColor Green

# Create Uninstaller Script
$UninstallScript = @"
@echo off
title Gemini Co-Work Uninstaller
echo Uninstalling Gemini Co-Work...
echo Removing shortcuts...
del "%USERPROFILE%\Desktop\Gemini Co-Work.lnk" 2>nul
del "%USERPROFILE%\OneDrive\Desktop\Gemini Co-Work.lnk" 2>nul
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Gemini Co-Work" 2>nul
echo Removing installed program directory...
cd /d "%TEMP%"
rmdir /s /q "$TargetDir" 2>nul
echo Gemini Co-Work has been successfully uninstalled.
pause
"@

Set-Content -Path (Join-Path $TargetDir "Uninstall_Gemini_CoWork.bat") -Value $UninstallScript -Encoding ASCII

Write-Host "[5/5] Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Gemini Co-Work v1.2.0 is now ready to use!" -ForegroundColor Cyan
Write-Host "You can launch it from your Desktop, Start Menu, or by running:" -ForegroundColor White
Write-Host "  $TargetExe" -ForegroundColor Yellow
Write-Host ""
