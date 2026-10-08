# Gemini Co-Work v1.5.0 - Desktop AI Workstation

A native desktop pair-programming and co-working workstation inspired by Claude Co-work, GPT Desktop, and Google Antigravity. Built for rapid iterative development, multi-file code editing, deep empirical research, and live Google Workspace integration.

## ✨ Highlights & Architecture (v1.5.0)

- **Frontier Multi-Provider AI**:
  - **Google Gemini**: Gemini 3.8 Flash, 3.7 Flash Thinking, Gemini Live Voice, and Imagen 3.1.
  - **xAI Grok**: Grok 2 & Grok 2 Vision integration via official xAI API.
  - **Groq Cloud**: 500+ tok/s inference with Llama 3.3 70B, Qwen 2.5 Coder, and GPT-OSS.
  - **Local Offline AI**: Ollama and LM Studio (Port 11434 / 1234) with GPU acceleration and 0 API credits required.
- **Interactive Canvas & Code Studio**:
  - Live preview for React, HTML, Markdown, and code artifacts.
  - Iterative version history and direct disk sync.
- **Live Google Workspace OAuth Ecosystem**:
  - Direct read integration for Google Drive, Gmail, Google Calendar, and Google Docs.
  - User-driven Google OAuth authorization with automatic prompt context injection.
- **Deep Research Engine**:
  - Multi-step inquiry decomposition, web search grounding, and comprehensive dossier synthesis.
- **Unified Single-Port Express Server**:
  - High-performance production serving on `http://localhost:5000` with sub-second boot times.

## 🚀 Quick Launch

### 1. Launch with One Click
Double-click `Launch_Gemini_CoWork.bat` in the root folder.
The launcher automatically initializes the background server, launches Ollama GPU acceleration if installed, and opens the application in a native borderless desktop window.

### 2. Manual Development
```bash
npm install
npm run dev
```

### 3. Build & Package Windows Installer
Run the automated packaging script in PowerShell:
```powershell
.\package-installer.ps1
```
This generates:
- Standalone Windows Setup Wizard: `dist-installer/Gemini-Co-Work-Setup-v1.5.0.exe`
- Portable Distribution Archive: `dist-installer/Gemini-Co-Work-v1.5.0-Windows-x64.zip`

## ⚙️ Configuration & Environment
- Environment settings are stored locally in `.env.local` (never committed to git).
- Cloud sync and preferences can be managed directly in the Windows 11 Fluent Settings Hub inside the app.
