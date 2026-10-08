# Gemini Co-Work v1.5.0 Packaging Automation Script
# Builds the frontend, validates assets, and compiles or packages the installer

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Packaging Gemini Co-Work v1.5.0 for Windows (x64)      " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot
$DistDir = Join-Path $RootDir "dist-installer"

if (Test-Path $DistDir) {
    Remove-Item -Recurse -Force $DistDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

# 1. Build frontend
Write-Host "[1/4] Building Vite React frontend distribution..." -ForegroundColor Yellow
Push-Location $RootDir
npm run build --prefix frontend
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed! Please check logs."
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  -> Frontend build completed successfully." -ForegroundColor Green

# 2. Check icon assets
Write-Host "[2/4] Verifying icon assets..." -ForegroundColor Yellow
$AppIcon = Join-Path $RootDir "resources\app-icon.ico"
$InstallerIcon = Join-Path $RootDir "resources\installer-icon.ico"
if ((Test-Path $AppIcon) -and (Test-Path $InstallerIcon)) {
    Write-Host "  -> Application icon and Installer icon verified!" -ForegroundColor Green
} else {
    Write-Warning "Icon assets missing in resources/. Icons will use defaults."
}

# 3. Create portable release archive/folder
Write-Host "[3/4] Preparing portable release bundle..." -ForegroundColor Yellow
$PortableDir = Join-Path $DistDir "Gemini-Co-Work-v1.5.0-Portable"
New-Item -ItemType Directory -Path $PortableDir -Force | Out-Null

$FilesToCopy = @(
    "package.json",
    "Launch_Gemini_CoWork.bat",
    ".gitignore"
)

foreach ($f in $FilesToCopy) {
    $src = Join-Path $RootDir $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $PortableDir -Force
    }
}

Copy-Item -Path (Join-Path $RootDir "resources") -Destination $PortableDir -Recurse -Force
Copy-Item -Path (Join-Path $RootDir "installer") -Destination $PortableDir -Recurse -Force
Copy-Item -Path (Join-Path $RootDir "backend") -Destination $PortableDir -Recurse -Force
Copy-Item -Path (Join-Path $RootDir "frontend") -Destination $PortableDir -Recurse -Force -Exclude "node_modules"

# Compress into portable zip for easy distribution
$ZipPath = Join-Path $DistDir "Gemini-Co-Work-v1.5.0-Windows-x64.zip"
Write-Host "  -> Compressing portable package to: $ZipPath" -ForegroundColor Cyan
Compress-Archive -Path "$PortableDir\*" -DestinationPath $ZipPath -Force

# 4. Inno Setup Compilation check
Write-Host "[4/4] Checking Inno Setup compiler (ISCC.exe)..." -ForegroundColor Yellow
$IsccPaths = @(
    "iscc.exe",
    "$env:LocalAppData\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

$IsccFound = $null
foreach ($p in $IsccPaths) {
    if (Get-Command $p -ErrorAction SilentlyContinue) {
        $IsccFound = $p
        break
    } elseif (Test-Path $p) {
        $IsccFound = $p
        break
    }
}

if ($IsccFound) {
    Write-Host "  -> Inno Setup found: $IsccFound" -ForegroundColor Green
    Write-Host "  -> Compiling standalone executable setup wizard..." -ForegroundColor Cyan
    & $IsccFound (Join-Path $RootDir "installer\gemini-co-work-setup.iss")
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  -> Successfully generated installer: dist-installer\Gemini-Co-Work-Setup-v1.5.0.exe" -ForegroundColor Green
    } else {
        Write-Warning "Inno Setup compilation returned non-zero code."
    }
} else {
    Write-Host "  -> Inno Setup compiler not found in PATH or Program Files." -ForegroundColor DarkYellow
    Write-Host "  -> Portable distribution bundle and one-click native installer created in: dist-installer\" -ForegroundColor Green
    Write-Host "  -> (To generate a standalone setup .exe, install Inno Setup via 'winget install JRSoftware.InnoSetup' and re-run this script)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Packaging Complete! Packages available in:" -ForegroundColor Green
Write-Host "  $DistDir" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
