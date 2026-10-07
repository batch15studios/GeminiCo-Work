import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { CommandPalette } from './components/CommandPalette';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { SettingsModal, SettingsTab } from './components/SettingsModal';
import { 
  ChatSession, 
  Gem, 
  Message, 
  ModelType, 
  Attachment, 
  CanvasArtifact, 
  OutputMode, 
  ResearchStep, 
  WorkspaceFile, 
  AppSettings,
  Skill,
  MCPServer,
  GoogleWorkspaceIntegration,
  GoogleWorkspaceItem
} from './types';
import { 
  DEFAULT_GEMS, 
  INITIAL_CHAT, 
  PROMPT_SUGGESTIONS, 
  DEFAULT_WORKSPACE_FILES, 
  DEFAULT_SKILLS, 
  DEFAULT_MCP_SERVERS,
  DEFAULT_GOOGLE_WORKSPACE_INTEGRATIONS 
} from './constants';
import { generateGeminiResponse, setActiveApiKey } from './services/geminiService';
import { initAuthSession, syncUserDataToCloud } from './services/firebaseService';
import { fetchWorkspaceFiles, readWorkspaceFile } from './services/filesystemService';
import { User } from 'firebase/auth';
import { ArrowRight, LayoutTemplate, BookOpen, Headphones, Microscope, FileCode2 } from 'lucide-react';

const STORAGE_CHATS_KEY = 'gemini_cowork_chats_v1';
const STORAGE_GEMS_KEY = 'gemini_cowork_gems_v1';
const STORAGE_FILES_KEY = 'gemini_cowork_files_v1';
const STORAGE_SETTINGS_KEY = 'gemini_cowork_settings_v1';
const STORAGE_SKILLS_KEY = 'gemini_cowork_skills_v1';
const STORAGE_MCP_KEY = 'gemini_cowork_mcp_v1';
const STORAGE_GOOGLE_KEY = 'gemini_cowork_google_v1';

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'User',
  theme: 'dark',
  autoGrounding: false,
  voiceGender: 'male',
  soundEffects: true,
  autoCloudSync: true,
  aiProvider: 'grok',
  grokApiKey: '',
  grokModel: 'grok-2-latest',
  groqModel: 'llama-3.3-70b-versatile',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'gemma2:2b',
  customBaseUrl: 'http://127.0.0.1:11434/v1',
  customModel: 'gemma2:2b'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        grokApiKey: parsed.grokApiKey || DEFAULT_SETTINGS.grokApiKey,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CHATS_KEY);
      return stored ? JSON.parse(stored) : [INITIAL_CHAT];
    } catch {
      return [INITIAL_CHAT];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || INITIAL_CHAT.id;
  });

  const [gems, setGems] = useState<Gem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_GEMS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_GEMS;
    } catch {
      return DEFAULT_GEMS;
    }
  });

  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_FILES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_WORKSPACE_FILES;
    } catch {
      return DEFAULT_WORKSPACE_FILES;
    }
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SKILLS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SKILLS;
    } catch {
      return DEFAULT_SKILLS;
    }
  });

  const [mcpServers, setMcpServers] = useState<MCPServer[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MCP_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_MCP_SERVERS;
    } catch {
      return DEFAULT_MCP_SERVERS;
    }
  });

  const [googleIntegrations, setGoogleIntegrations] = useState<GoogleWorkspaceIntegration[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_GOOGLE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_GOOGLE_WORKSPACE_INTEGRATIONS;
    } catch {
      return DEFAULT_GOOGLE_WORKSPACE_INTEGRATIONS;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTab>('google');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeResearchSteps, setActiveResearchSteps] = useState<ResearchStep[] | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || INITIAL_CHAT;
  const activeGem = gems.find((g) => g.id === activeSession.gemId) || gems[0];

  const activeArtifact = activeSession.artifacts?.find((a) => a.id === activeSession.activeArtifactId) 
    || activeSession.artifacts?.[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Firebase Auth Session
  useEffect(() => {
    const unsubscribe = initAuthSession((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Auto-sync initial workspace files from local disk
  useEffect(() => {
    fetchWorkspaceFiles().then(async (res) => {
      if (res && res.items && res.items.length > 0) {
        const diskFiles: WorkspaceFile[] = [];
        for (const item of res.items.slice(0, 20)) {
          if (!item.isDirectory) {
            try {
              const fileData = await readWorkspaceFile(item.path);
              diskFiles.push({
                id: 'fs-' + item.relativePath.replace(/[^a-zA-Z0-9_-]/g, '_'),
                name: item.name,
                path: item.relativePath,
                extension: item.extension,
                size: item.size,
                content: fileData.content,
                isSelected: false
              });
            } catch {}
          }
        }
        if (diskFiles.length > 0) {
          setWorkspaceFiles(prev => {
            const map = new Map(prev.map(f => [f.path, f]));
            diskFiles.forEach(df => map.set(df.path, df));
            return Array.from(map.values());
          });
        }
      }
    }).catch(() => {});

    // Sync API key from backend if present
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg && cfg.apiKey) {
          setActiveApiKey(cfg.apiKey);
          setSettings(prev => ({ ...prev, apiKey: prev.apiKey || cfg.apiKey }));
        }
      })
      .catch(() => {});
  }, []);

  // Local storage persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GEMS_KEY, JSON.stringify(gems));
    } catch (e) {
      console.warn('LocalStorage gems save error:', e);
    }
  }, [gems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(workspaceFiles));
    } catch (e) {
      console.warn('LocalStorage files save error:', e);
    }
  }, [workspaceFiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SKILLS_KEY, JSON.stringify(skills));
    } catch (e) {
      console.warn('LocalStorage skills save error:', e);
    }
  }, [skills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MCP_KEY, JSON.stringify(mcpServers));
    } catch (e) {
      console.warn('LocalStorage mcp save error:', e);
    }
  }, [mcpServers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GOOGLE_KEY, JSON.stringify(googleIntegrations));
    } catch (e) {
      console.warn('LocalStorage google save error:', e);
    }
  }, [googleIntegrations]);

  // Background Cloud Sync
  useEffect(() => {
    if (currentUser && !currentUser.isAnonymous && settings.autoCloudSync) {
      const timer = setTimeout(() => {
        syncUserDataToCloud(currentUser.uid, {
          settings,
          sessions,
          gems,
          workspaceFiles,
          skills,
          mcpServers
        }).catch((err) => console.warn('Background sync warning:', err));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, settings, sessions, gems, workspaceFiles, skills, mcpServers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading, activeResearchSteps]);

  // Global hotkeys
  useEffect(() => {
    const handleHotkeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsCanvasOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleHotkeys);
    return () => window.removeEventListener('keydown', handleHotkeys);
  }, []);

  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New conversation',
      gemId: activeGem.id,
      model: 'gemini-3.8-flash',
      enableGrounding: true,
      defaultOutputMode: 'canvas',
      updatedAt: Date.now(),
      messages: [],
      artifacts: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        return [INITIAL_CHAT];
      }
      return remaining;
    });
    if (activeSessionId === id) {
      setActiveSessionId(sessions.find((s) => s.id !== id)?.id || INITIAL_CHAT.id);
    }
  };

  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleUpdateActiveSession = (updates: Partial<ChatSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, ...updates, updatedAt: Date.now() } : s))
    );
  };

  const handleUpdateArtifact = (updated: CanvasArtifact) => {
    const currentArtifacts = activeSession.artifacts || [];
    const exists = currentArtifacts.some((a) => a.id === updated.id);

    const newArtifacts = exists
      ? currentArtifacts.map((a) => (a.id === updated.id ? updated : a))
      : [updated, ...currentArtifacts];

    handleUpdateActiveSession({
      artifacts: newArtifacts,
      activeArtifactId: updated.id,
    });
  };

  const handleToggleFileSelection = (fileId: string) => {
    setWorkspaceFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, isSelected: !f.isSelected } : f)
    );
  };

  const handleSelectAllFiles = (select: boolean) => {
    setWorkspaceFiles(prev => prev.map(f => ({ ...f, isSelected: select })));
  };

  const handleImportFiles = (newFiles: WorkspaceFile[]) => {
    setWorkspaceFiles(prev => [...newFiles, ...prev]);
  };

  const handleToggleGoogleIntegration = (appType: string) => {
    setGoogleIntegrations(prev =>
      prev.map(item => item.appType === appType ? { ...item, isConnected: !item.isConnected } : item)
    );
  };

  const handleToggleAllGoogleIntegrations = (connectAll: boolean) => {
    setGoogleIntegrations(prev =>
      prev.map(item => ({ ...item, isConnected: connectAll }))
    );
  };

  const handleToggleGoogleItem = (itemId: string) => {
    setGoogleIntegrations(prev =>
      prev.map(app => ({
        ...app,
        items: app.items.map(item => item.id === itemId ? { ...item, isSelected: !item.isSelected } : item)
      }))
    );
  };

  const handleOpenFileInCanvas = async (file: WorkspaceFile) => {
    let content = file.content;
    if (!content && file.path) {
      try {
        const disk = await readWorkspaceFile(file.path);
        content = disk.content;
      } catch (e) {
        console.warn('Could not read file from disk:', e);
      }
    }

    const newArtifact: CanvasArtifact = {
      id: 'file-artifact-' + file.id,
      title: file.name,
      type: file.extension === 'html' ? 'html' : file.extension === 'tsx' || file.extension === 'jsx' ? 'react' : 'code',
      language: file.extension,
      content: content || '',
      currentVersion: 1,
      versions: [{
        version: 1,
        timestamp: Date.now(),
        content: content || '',
        description: `Opened from ${file.path}`
      }]
    };
    handleUpdateArtifact(newArtifact);
    setIsCanvasOpen(true);
  };

  const handleOpenInCanvas = (code?: string, language?: string) => {
    if (code) {
      const newArtifact: CanvasArtifact = {
        id: 'artifact-' + Date.now(),
        title: `${(language || 'code').toUpperCase()} Document`,
        type: language === 'html' ? 'html' : language === 'tsx' || language === 'jsx' ? 'react' : 'code',
        language: language || 'code',
        content: code,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: code,
          description: 'Loaded into Canvas'
        }]
      };
      handleUpdateArtifact(newArtifact);
    }
    setIsCanvasOpen(true);
  };

  const handleOpenNotebook = (artifact: CanvasArtifact) => {
    handleUpdateArtifact(artifact);
    setIsCanvasOpen(true);
  };

  const handleSendMessage = async (
    text: string, 
    attachments: Attachment[] = [], 
    forcedMode?: OutputMode
  ) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    const currentMode = forcedMode || activeSession.defaultOutputMode || 'canvas';
    const activeProjectFiles = workspaceFiles.filter(f => f.isSelected);
    const activeSkillsList = skills.filter(s => s.isEnabled);
    const activeMcpList = mcpServers.filter(s => s.isEnabled);

    const activeGoogleItems: GoogleWorkspaceItem[] = [];
    googleIntegrations.forEach(app => {
      if (app.isConnected) {
        app.items.forEach(item => {
          if (item.isSelected) {
            activeGoogleItems.push(item);
          }
        });
      }
    });

    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      outputMode: currentMode,
      attachments,
    };

    const shouldUpdateTitle = activeSession.messages.length === 0;
    const computedTitle = shouldUpdateTitle ? text.slice(0, 32) || 'Co-work Task' : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMessage];
    handleUpdateActiveSession({
      title: computedTitle,
      messages: updatedMessages,
    });

    setIsLoading(true);
    if (currentMode === 'research') {
      setActiveResearchSteps([
        { id: '1', title: 'Formulating investigative queries', status: 'in_progress' }
      ]);
    }
    const startTime = Date.now();

    try {
      const result = await generateGeminiResponse({
        model: activeSession.model,
        outputMode: currentMode,
        prompt: text || 'Work with project context and tools',
        history: activeSession.messages.map(m => ({ role: m.role, text: m.content })),
        systemInstruction: activeGem.systemPrompt,
        enableGrounding: activeSession.enableGrounding || currentMode === 'research',
        attachments,
        currentCanvasContent: isCanvasOpen && activeArtifact ? activeArtifact.content : undefined,
        projectContextFiles: activeProjectFiles,
        activeSkills: activeSkillsList,
        activeMcpServers: activeMcpList,
        selectedGoogleItems: activeGoogleItems,
        onResearchProgress: (steps) => {
          setActiveResearchSteps(steps);
        }
      });

      const elapsedSec = (Date.now() - startTime) / 1000;

      let createdArtifact = result.createdArtifact;
      if (createdArtifact) {
        handleUpdateArtifact(createdArtifact);
        setIsCanvasOpen(true);
      }

      const aiMessage: Message = {
        id: 'msg-model-' + Date.now(),
        role: 'model',
        content: result.text,
        timestamp: Date.now(),
        outputMode: currentMode,
        groundingSources: result.groundingSources,
        generatedImageUrl: result.generatedImageUrl,
        thinkingTimeSec: elapsedSec,
        artifactId: createdArtifact?.id,
        artifactSnapshot: createdArtifact,
        researchSteps: result.researchSteps,
        referencedFiles: result.referencedFiles,
        invokedSkills: result.invokedSkills,
        invokedMcpTools: result.invokedMcpTools,
        invokedGoogleApps: result.invokedGoogleApps
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, aiMessage], updatedAt: Date.now() }
            : s
        )
      );
    } catch (err: any) {
      let displayError = err.message || 'Unable to generate response. Please try again.';
      if (displayError.includes('RESOURCE_EXHAUSTED') || displayError.includes('429') || displayError.toLowerCase().includes('quota')) {
        displayError = '⚠️ **Google Gemini API Quota Exhausted (429)**\n\nYour Gemini API prepaid quota has run out.\n\n⚡ **Switch to Groq Cloud (500+ tok/sec — 100% Free)** or **Local AI (Ollama)** in Settings (⚙️) to continue with zero limits!\n\n1. Open **Settings (⚙️) > Preferences**\n2. Select **Groq Cloud**\n3. Paste your free key from [console.groq.com/keys](https://console.groq.com/keys) (Takes 10 seconds, no credit card)';
        openSettingsOnTab('preferences');
      } else if (displayError.includes('GROQ_KEY_REQUIRED')) {
        displayError = '⚡ **Groq API Key Required (100% Free)**\n\nTo use Groq ultra-fast LPU inference (500+ tokens/sec):\n\n1. Get your free key instantly at [console.groq.com/keys](https://console.groq.com/keys) (No credit card needed)\n2. Paste it in **Settings (⚙️) > Preferences > Groq Cloud**\n\n*(Opening Settings for you now)*';
        openSettingsOnTab('preferences');
      } else if (displayError.includes('OPENROUTER_KEY_REQUIRED')) {
        displayError = '🔀 **OpenRouter API Key Required**\n\nPlease enter your OpenRouter API key in **Settings (⚙️) > Preferences** to access free cloud models.\n\n👉 [Get an OpenRouter API Key](https://openrouter.ai/keys)';
        openSettingsOnTab('preferences');
      } else if (displayError.includes('GEMINI_KEY_REQUIRED') || displayError.includes('API Key is required') || displayError.includes('Authentication Required')) {
        displayError = '🔑 **Gemini API Key Required**\n\nTo begin chatting with Gemini 3 models, please enter your Gemini API key in Settings (⚙️) or switch to Groq / Local AI.\n\n👉 [Get a free Gemini API Key from Google AI Studio](https://aistudio.google.com/apikey)\n\n*(Click the Settings button at the bottom left to paste your key)*';
        openSettingsOnTab('general');
      } else if (displayError.includes('Bad Gateway') || displayError.includes('502')) {
        displayError = '⚠️ **API Gateway Error (502)**\n\nPlease verify your model credentials in Settings (⚙️). Note: Live Voice is accessible via the dedicated **Live Voice** button in the chat toolbar or title bar!';
      }
      const errorMessage: Message = {
        id: 'msg-err-' + Date.now(),
        role: 'model',
        content: displayError,
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, errorMessage], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsLoading(false);
      setActiveResearchSteps(null);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (newSettings.apiKey) {
      setActiveApiKey(newSettings.apiKey);
      fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newSettings.apiKey })
      }).catch(() => {});
    }
  };

  const handleCoworkPrompt = (coworkPromptText: string) => {
    handleSendMessage(`[Canvas Co-work Refinement] ${coworkPromptText}`, [], 'canvas');
  };

  const handleMigrateCloudData = (cloudData: {
    settings?: AppSettings;
    sessions?: ChatSession[];
    gems?: Gem[];
    workspaceFiles?: WorkspaceFile[];
    skills?: Skill[];
    mcpServers?: MCPServer[];
  }) => {
    if (cloudData.settings) setSettings(cloudData.settings);
    if (cloudData.sessions && cloudData.sessions.length > 0) {
      setSessions(cloudData.sessions);
      setActiveSessionId(cloudData.sessions[0].id);
    }
    if (cloudData.gems && cloudData.gems.length > 0) setGems(cloudData.gems);
    if (cloudData.workspaceFiles && cloudData.workspaceFiles.length > 0) {
      setWorkspaceFiles(cloudData.workspaceFiles);
    }
    if (cloudData.skills && cloudData.skills.length > 0) setSkills(cloudData.skills);
    if (cloudData.mcpServers && cloudData.mcpServers.length > 0) setMcpServers(cloudData.mcpServers);
  };

  const openSettingsOnTab = (tab: SettingsTab) => {
    setSettingsModalTab(tab);
    setSettingsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#202020] text-[#f3f3f3] overflow-hidden font-sans border border-[#333333]">
      {/* Native Windows 11 TitleBar without top-bar settings buttons */}
      <TitleBar
        outputMode={activeSession.defaultOutputMode || 'canvas'}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        isCanvasOpen={isCanvasOpen}
        onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
        activeArtifact={activeArtifact}
        onOpenVoice={() => setVoiceModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative bg-[#181818]">
        {/* Navigation Pane with dedicated Bottom-Left Settings Spot */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSession.id}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewChat={handleCreateNewChat}
          onDeleteSession={handleDeleteSession}
          onTogglePinSession={handleTogglePinSession}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onOpenSettings={() => openSettingsOnTab('google')}
          workspaceFiles={workspaceFiles}
          onToggleFileSelection={handleToggleFileSelection}
          onSelectAllFiles={handleSelectAllFiles}
          onOpenFileInCanvas={handleOpenFileInCanvas}
          onImportFiles={handleImportFiles}
          currentUser={currentUser}
        />

        {/* Central Workstation Stage */}
        <main className="flex-1 flex flex-col h-full bg-[#181818] relative overflow-hidden transition-all duration-150">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-[6px] bg-[#222222] border border-[#383838] flex items-center justify-center shadow-sm">
                  <FileCode2 className="w-6 h-6 text-[#60cdff]" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white tracking-normal">
                    Gemini Co-work
                  </h1>
                  <p className="text-xs text-[#8e8e8e] mt-1">
                    Manage your Google Workspaces, Skills, and MCP tools via the Settings button at the bottom-left
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                  {PROMPT_SUGGESTIONS.map((item: any, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        let targetMode: OutputMode = 'chat';
                        if (item.isResearch) targetMode = 'research';
                        else if (item.isCanvas) targetMode = 'canvas';
                        else if (item.isNotebook) targetMode = 'notebook';
                        else if (item.isAudio) targetMode = 'audio';
                        else if (item.isImage) {
                          targetMode = 'image';
                          handleUpdateActiveSession({ model: 'gemini-3.1-flash-image' });
                        }
                        handleUpdateActiveSession({ defaultOutputMode: targetMode });
                        handleSendMessage(item.prompt, [], targetMode);
                      }}
                      className="flex items-center justify-between p-3 bg-[#242424] hover:bg-[#2b2b2b] border border-[#333333] hover:border-[#404040] rounded-[6px] text-left transition group shadow-sm"
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center space-x-1.5 text-xs font-medium text-[#e0e0e0]">
                          {item.isResearch ? (
                            <Microscope className="w-3.5 h-3.5 text-[#58d68d]" />
                          ) : item.isCanvas ? (
                            <LayoutTemplate className="w-3.5 h-3.5 text-[#60cdff]" />
                          ) : item.isNotebook ? (
                            <BookOpen className="w-3.5 h-3.5 text-[#bb86fc]" />
                          ) : item.isAudio ? (
                            <Headphones className="w-3.5 h-3.5 text-[#ff79c6]" />
                          ) : (
                            <FileCode2 className="w-3.5 h-3.5 text-[#ffb86c]" />
                          )}
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[11px] text-[#808080] line-clamp-1">{item.prompt}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#666666] group-hover:text-white transition flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-3 pb-6">
                {activeSession.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onOpenInCanvas={handleOpenInCanvas}
                    onOpenNotebook={handleOpenNotebook}
                    onRegenerate={
                      message.role === 'model'
                        ? () => {
                            const lastUser = [...activeSession.messages]
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (lastUser) {
                              handleSendMessage(lastUser.content, lastUser.attachments);
                            }
                          }
                        : undefined
                    }
                  />
                ))}

                {/* Deep Research Live Phase Tracker */}
                {isLoading && activeResearchSteps && (
                  <div className="my-3 mx-4 sm:mx-8 p-3 rounded-[6px] bg-[#1a241f] border border-[#276e4c] shadow-sm max-w-3xl sm:mx-auto">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#58d68d] uppercase tracking-wider mb-2">
                      <Microscope className="w-3.5 h-3.5 animate-spin" />
                      <span>Deep Research Engine Executing Investigation...</span>
                    </div>
                    <div className="space-y-1.5">
                      {activeResearchSteps.map((step) => (
                        <div key={step.id} className="flex items-center space-x-2 text-xs">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center border text-[8px] ${
                            step.status === 'completed'
                              ? 'bg-[#58d68d] border-[#44b071] text-black font-bold'
                              : step.status === 'in_progress'
                              ? 'bg-[#1b3d2f] border-[#58d68d] text-[#58d68d] animate-pulse'
                              : 'bg-[#292929] border-[#383838] text-[#666666]'
                          }`}>
                            {step.status === 'completed' ? '✓' : ''}
                          </div>
                          <span className={`text-[11px] ${
                            step.status === 'in_progress' ? 'text-[#58d68d] font-medium' : 'text-[#a0a0a0]'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && !activeResearchSteps && (
                  <div className="py-3 px-6 max-w-3xl mx-auto flex items-center space-x-2.5">
                    <div className="w-4 h-4 border-2 border-[#555555] border-t-[#60cdff] rounded-full animate-spin" />
                    <span className="text-xs text-[#8e8e8e]">
                      Gemini Co-work is synthesizing response...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Active Provider & Key Status Banner */}
          {settings.aiProvider === 'gemini' && !settings.apiKey && (
            <div className="mx-4 mb-2 p-2 bg-[#2a1c0d] border border-[#d97706]/40 rounded-[6px] flex items-center justify-between text-xs text-[#fcd34d]">
              <div className="flex items-center space-x-2">
                <span className="text-sm">🔑</span>
                <span>
                  <strong>Gemini API Key Required:</strong> To enable Gemini cloud models, please enter your API key or switch to Local AI (Ollama).
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ ...settings, aiProvider: 'ollama', ollamaModel: settings.ollamaModel || 'gemma2:2b' })}
                  className="px-2 py-0.5 bg-[#1b3d2b] hover:bg-[#275a3e] text-[#58d68d] border border-[#276e4c] rounded-[3px] text-[11px] transition font-medium"
                >
                  Switch to Free Local AI (Ollama)
                </button>
                <button
                  type="button"
                  onClick={() => openSettingsOnTab('preferences')}
                  className="px-2 py-0.5 bg-[#d97706] hover:bg-[#b45309] text-black font-semibold rounded-[3px] text-[11px] transition"
                >
                  Enter Key in Settings
                </button>
              </div>
            </div>
          )}

          {settings.aiProvider !== 'gemini' && (
            <div className="mx-4 mb-2 px-3 py-1.5 bg-[#122218] border border-[#1b432c] rounded-[6px] flex items-center justify-between text-xs text-[#58d68d]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#58d68d] animate-pulse" />
                <span>
                  <strong>Active Engine:</strong> {
                    settings.aiProvider === 'grok' ? `xAI Grok (${settings.grokModel || 'grok-2-latest'})` :
                    settings.aiProvider === 'groq' ? `Groq Cloud LPU (${settings.groqModel || 'llama-3.3-70b-versatile'} • 500+ tok/s Free)` :
                    settings.aiProvider === 'openrouter' ? `OpenRouter (${settings.openrouterModel || 'Llama 3.3 70B'})` :
                    settings.aiProvider === 'ollama' ? `Local Ollama (${settings.ollamaModel || 'gemma2:2b'})` :
                    settings.aiProvider === 'lmstudio' ? 'LM Studio (Local)' : 'Custom API'
                  }
                </span>
              </div>
              <button
                type="button"
                onClick={() => openSettingsOnTab('preferences')}
                className="text-[11px] text-[#a3e9b9] hover:underline"
              >
                Change Provider ⚙️
              </button>
            </div>
          )}

          {/* Minimalist Communications Capsule with integrated Mode Menu */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            model={activeSession.model}
            setModel={(m) => handleUpdateActiveSession({ model: m })}
            enableGrounding={activeSession.enableGrounding}
            setEnableGrounding={(val) => handleUpdateActiveSession({ enableGrounding: val })}
            outputMode={activeSession.defaultOutputMode || 'canvas'}
            setOutputMode={(mode) => handleUpdateActiveSession({ defaultOutputMode: mode })}
            onOpenVoice={() => setVoiceModalOpen(true)}
            currentProvider={settings.aiProvider || (settings.apiKey ? 'gemini' : 'grok')}
            settings={settings}
          />
        </main>

        {/* Side-by-Side Co-work Canvas */}
        {isCanvasOpen && activeArtifact && (
          <CanvasWorkspace
            artifact={activeArtifact}
            onUpdateArtifact={handleUpdateArtifact}
            onCoworkPrompt={handleCoworkPrompt}
            isLoading={isLoading}
            onClose={() => setIsCanvasOpen(false)}
          />
        )}
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleCreateNewChat}
        setModel={(m) => handleUpdateActiveSession({ model: m })}
        setEnableGrounding={(val) => handleUpdateActiveSession({ enableGrounding: val })}
        onOpenGems={() => openSettingsOnTab('gems')}
        onOpenVoice={() => setVoiceModalOpen(true)}
      />

      {/* Unified Windows 11 Settings Modal with clean vertical left sidebar */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialTab={settingsModalTab}
        currentUser={currentUser}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        sessions={sessions}
        gems={gems}
        activeGemId={activeSession.gemId}
        onSelectGem={(gemId) => handleUpdateActiveSession({ gemId })}
        onCreateCustomGem={(newGem) => {
          setGems((prev) => [...prev, newGem]);
          handleUpdateActiveSession({ gemId: newGem.id });
        }}
        skills={skills}
        onUpdateSkills={setSkills}
        mcpServers={mcpServers}
        onUpdateMcpServers={setMcpServers}
        workspaceFiles={workspaceFiles}
        googleIntegrations={googleIntegrations}
        onToggleGoogleIntegration={handleToggleGoogleIntegration}
        onToggleAllGoogleIntegrations={handleToggleAllGoogleIntegrations}
        onToggleGoogleItem={handleToggleGoogleItem}
        onMigrateCloudData={handleMigrateCloudData}
      />

      <LiveVoiceOverlay
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTranscriptReceived={(userText, modelText) => {
          const userMsg: Message = {
            id: 'msg-voice-user-' + Date.now(),
            role: 'user',
            content: `🎤 [Spoken] ${userText}`,
            timestamp: Date.now(),
          };
          const modelMsg: Message = {
            id: 'msg-voice-model-' + Date.now(),
            role: 'model',
            content: modelText,
            timestamp: Date.now() + 100,
          };
          handleUpdateActiveSession({
            messages: [...activeSession.messages, userMsg, modelMsg],
          });
        }}
      />
    </div>
  );
}
