import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  User as UserIcon, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  AlertCircle, 
  LogOut, 
  FolderCheck, 
  FileText, 
  Mail, 
  Calendar, 
  Layers, 
  HelpCircle, 
  Zap, 
  Server, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  Table, 
  Presentation, 
  Video, 
  BookmarkCheck, 
  CheckCheck,
  Key,
  Shield,
  Globe,
  Lock,
  Download,
  ExternalLink,
  Cpu,
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  AppSettings, 
  ChatSession, 
  Gem, 
  WorkspaceFile, 
  GoogleWorkspaceIntegration, 
  Skill, 
  MCPServer, 
  MCPAuthType,
  AIProvider,
  OAuthConfig,
  UpdateInfo 
} from '../types';
import { checkLocalModelStatus, startLocalOllamaServer, pullLocalModel } from '../services/geminiService';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle,
  logoutUser, 
  syncUserDataToCloud, 
  fetchUserDataFromCloud,
  getStoredGoogleToken
} from '../services/firebaseService';
import { 
  fetchLiveGoogleDriveFiles, 
  fetchLiveGmailMessages, 
  fetchLiveCalendarEvents 
} from '../services/googleWorkspaceService';
import { checkForUpdates, pullLatestUpdate } from '../services/updateService';

export type SettingsTab = 'google' | 'gems' | 'skills' | 'mcp' | 'account' | 'sync' | 'preferences' | 'updates';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  currentUser: User | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  sessions: ChatSession[];
  gems: Gem[];
  activeGemId?: string;
  onSelectGem: (gemId: string) => void;
  onCreateCustomGem: (gem: Gem) => void;
  skills: Skill[];
  onUpdateSkills: (skills: Skill[]) => void;
  mcpServers: MCPServer[];
  onUpdateMcpServers: (servers: MCPServer[]) => void;
  workspaceFiles: WorkspaceFile[];
  googleIntegrations: GoogleWorkspaceIntegration[];
  onUpdateGoogleIntegrations?: (integrations: GoogleWorkspaceIntegration[]) => void;
  onToggleGoogleIntegration: (appType: string) => void;
  onToggleAllGoogleIntegrations: (connectAll: boolean) => void;
  onToggleGoogleItem: (itemId: string) => void;
  onUserChange?: (user: User | any) => void;
  onMigrateCloudData: (cloudData: {
    settings?: AppSettings;
    sessions?: ChatSession[];
    gems?: Gem[];
    workspaceFiles?: WorkspaceFile[];
    skills?: Skill[];
    mcpServers?: MCPServer[];
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'google',
  currentUser,
  onUserChange,
  settings,
  onUpdateSettings,
  sessions,
  gems,
  activeGemId,
  onSelectGem,
  onCreateCustomGem,
  skills,
  onUpdateSkills,
  mcpServers,
  onUpdateMcpServers,
  workspaceFiles,
  googleIntegrations,
  onUpdateGoogleIntegrations,
  onToggleGoogleIntegration,
  onToggleAllGoogleIntegrations,
  onToggleGoogleItem,
  onMigrateCloudData
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [googleSyncMessage, setGoogleSyncMessage] = useState<string | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState<boolean>(() => !!getStoredGoogleToken());
  const [customGoogleToken, setCustomGoogleToken] = useState<string>(() => getStoredGoogleToken() || '');

  // New Gem Form state
  const [isAddingGem, setIsAddingGem] = useState(false);
  const [newGemName, setNewGemName] = useState('');
  const [newGemTagline, setNewGemTagline] = useState('');
  const [newGemPrompt, setNewGemPrompt] = useState('');

  // New Skill Form state
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<Skill['category']>('Code Analysis');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillPrompt, setNewSkillPrompt] = useState('');
  const [newSkillTags, setNewSkillTags] = useState('');

  // New MCP Server Form state - dynamic fields for OAuth, Bearer, API Key, and Direct HTTPS
  const [isAddingMcp, setIsAddingMcp] = useState(false);
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpEndpoint, setNewMcpEndpoint] = useState('');
  const [newMcpAuthType, setNewMcpAuthType] = useState<MCPAuthType>('bearer');

  // Bearer Token state
  const [bearerToken, setBearerToken] = useState('');

  // API Key state
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('');

  // OAuth state
  const [oauthToken, setOauthToken] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [oauthScope, setOauthScope] = useState('');

  // HTTPS No-Auth custom header (optional)
  const [customHeaderKey, setCustomHeaderKey] = useState('');
  const [customHeaderVal, setCustomHeaderVal] = useState('');

  const [testingId, setTestingId] = useState<string | null>(null);

  // Local Models & Multi-Provider state
  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; models: Array<{ name: string; size?: number }> }>({ online: false, models: [] });
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [pullStatus, setPullStatus] = useState<string | null>(null);

  const fetchOllamaStatus = async () => {
    setIsCheckingOllama(true);
    try {
      const res = await checkLocalModelStatus(settings.ollamaBaseUrl);
      setOllamaStatus({ online: res.online, models: res.models });
      if (res.online && res.models.length > 0 && !settings.ollamaModel) {
        onUpdateSettings({ ...settings, ollamaModel: res.models[0].name });
      }
    } catch {}
    setIsCheckingOllama(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchOllamaStatus();
    }
  }, [isOpen, activeTab]);

  const handleStartOllama = async () => {
    setIsStartingOllama(true);
    await startLocalOllamaServer();
    setTimeout(async () => {
      await fetchOllamaStatus();
      setIsStartingOllama(false);
    }, 2500);
  };

  const handlePullModel = async (modelToPull?: string) => {
    const target = (modelToPull || pullModelName).trim();
    if (!target) return;
    setPullStatus(`Downloading ${target} via Ollama...`);
    const ok = await pullLocalModel(target);
    if (ok) {
      setPullStatus(`Pull initiated for ${target}. It will appear once finished.`);
      setTimeout(fetchOllamaStatus, 6000);
    } else {
      setPullStatus(`Failed to initiate model download.`);
    }
  };

  // GitHub Updates state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isPullingUpdate, setIsPullingUpdate] = useState(false);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    setStatusMessage(null);
    try {
      const info = await checkForUpdates();
      setUpdateInfo(info);
      if (info.updateAvailable) {
        setStatusMessage({ type: 'info', text: `New update available: ${info.latestVersion}! Release: ${info.name || ''}` });
      } else {
        setStatusMessage({ type: 'success', text: `You are on the latest version of Gemini Co-work (v${info.currentVersion}).` });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Update check failed: ${e.message}` });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handlePullUpdate = async () => {
    setIsPullingUpdate(true);
    setStatusMessage({ type: 'info', text: 'Checking, downloading, and applying latest update from GitHub...' });
    try {
      const res: any = await pullLatestUpdate();
      if (res.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `Update applied successfully (${res.version || 'v1.5.1'})! ${res.message || ''} Please reload or restart the app to apply.` 
        });
      } else {
        setStatusMessage({ type: 'info', text: res.message || 'Update status checked.' });
        if (res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        }
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Failed to pull update: ${e.message}` });
    } finally {
      setIsPullingUpdate(false);
    }
  };


  const handleGoogleSignIn = async () => {
    setStatusMessage({ type: 'info', text: 'Connecting Google credentials & AI credits...' });
    try {
      const res = await loginWithGoogle(true);
      if (res.user) {
        onUserChange?.(res.user);
        setHasGoogleAuth(true);
        if (res.accessToken) {
          setCustomGoogleToken(res.accessToken);
        }
        setStatusMessage({ 
          type: 'success', 
          text: `✓ Successfully verified and connected as ${res.user.email}! Profile, AI credits, and Workspace attached.` 
        });
        if (res.accessToken) {
          await handleSyncAllGoogleWorkspace(res.accessToken);
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Google sign-in failed.' });
    }
  };

  if (!isOpen) return null;

  const isAnonymous = currentUser?.isAnonymous ?? true;

  // Authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setStatusMessage({ type: 'info', text: 'Authenticating...' });

    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password, displayName || undefined);
        setStatusMessage({ type: 'success', text: 'Account registered and profile created successfully!' });
      } else {
        await loginWithEmail(email, password);
        setStatusMessage({ type: 'success', text: 'Signed in successfully. Syncing your profile...' });
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('Auth error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Authentication failed. Please verify credentials.' });
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setStatusMessage({ type: 'info', text: 'Signed out. Restored guest session.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error signing out.' });
    }
  };

  const handleCloudBackup = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      await syncUserDataToCloud(currentUser.uid, {
        settings: {
          ...settings,
          lastSyncedTimestamp: Date.now()
        },
        sessions,
        gems,
        workspaceFiles,
        skills,
        mcpServers
      });
      onUpdateSettings({
        ...settings,
        lastSyncedTimestamp: Date.now()
      });
      setStatusMessage({ type: 'success', text: 'All settings, chats, and workspace files successfully backed up to cloud!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Cloud backup failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const data = await fetchUserDataFromCloud(currentUser.uid);
      if (!data) {
        setStatusMessage({ type: 'info', text: 'No existing cloud backup found for this account.' });
      } else {
        onMigrateCloudData({
          settings: data.settings,
          sessions: data.sessions,
          gems: data.gems,
          workspaceFiles: data.workspaceFiles,
          skills: data.skills,
          mcpServers: data.mcpServers
        });
        setStatusMessage({ type: 'success', text: 'Workspace settings and project history restored from cloud!' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Restore failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleWorkspaceLogin = async () => {
    setIsGoogleSyncing(true);
    setGoogleSyncMessage('Connecting Google Account & Workspace permissions...');
    try {
      const { accessToken, user, isSystemFallback } = await loginWithGoogle(true);
      if (user) {
        onUserChange?.(user);
      }
      if (accessToken) {
        setHasGoogleAuth(true);
        setCustomGoogleToken(accessToken);
        setGoogleSyncMessage(
          isSystemFallback
            ? `Connected as ${user.email} (System Google Account). Testing live workspace connection...`
            : `Connected as ${user.email}. Syncing live files, emails, and events...`
        );
        await handleSyncAllGoogleWorkspace(accessToken);
      } else {
        setGoogleSyncMessage('Signed in, but access token was not returned. Please try entering a token manually.');
      }
    } catch (err: any) {
      console.error('Google Workspace Auth Error:', err);
      setGoogleSyncMessage(`Authentication notice: ${err.message || 'Failed to sign in with Google'}`);
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleConnectCustomToken = async () => {
    if (!customGoogleToken.trim()) {
      setGoogleSyncMessage('Please enter a valid Google OAuth access token.');
      return;
    }
    setStoredGoogleToken(customGoogleToken.trim());
    setHasGoogleAuth(true);
    setGoogleSyncMessage('Custom access token saved. Testing and syncing Google Workspace items...');
    await handleSyncAllGoogleWorkspace(customGoogleToken.trim());
  };

  const handleSyncAllGoogleWorkspace = async (token?: string) => {
    setIsGoogleSyncing(true);
    setGoogleSyncMessage('Syncing Google Drive, Gmail, and Calendar...');
    try {
      const activeToken = token || getStoredGoogleToken();
      if (!activeToken) {
        throw new Error('Please sign in with Google first.');
      }

      let driveItems: GoogleWorkspaceItem[] = [];
      let gmailItems: GoogleWorkspaceItem[] = [];
      let calendarItems: GoogleWorkspaceItem[] = [];

      try {
        driveItems = await fetchLiveGoogleDriveFiles(activeToken);
      } catch (e: any) {
        console.warn('Drive sync notice:', e);
      }

      try {
        gmailItems = await fetchLiveGmailMessages(activeToken);
      } catch (e: any) {
        console.warn('Gmail sync notice:', e);
      }

      try {
        calendarItems = await fetchLiveCalendarEvents(activeToken);
      } catch (e: any) {
        console.warn('Calendar sync notice:', e);
      }

      const updated = googleIntegrations.map(app => {
        if (app.appType === 'drive' && driveItems.length > 0) {
          return {
            ...app,
            isConnected: true,
            lastSyncedAt: Date.now(),
            items: driveItems
          };
        }
        if (app.appType === 'gmail' && gmailItems.length > 0) {
          return {
            ...app,
            isConnected: true,
            lastSyncedAt: Date.now(),
            items: gmailItems
          };
        }
        if (app.appType === 'calendar' && calendarItems.length > 0) {
          return {
            ...app,
            isConnected: true,
            lastSyncedAt: Date.now(),
            items: calendarItems
          };
        }
        return app;
      });

      if (onUpdateGoogleIntegrations) {
        onUpdateGoogleIntegrations(updated);
      }

      const totalItems = driveItems.length + gmailItems.length + calendarItems.length;
      if (totalItems > 0) {
        setGoogleSyncMessage(`Sync complete: ${driveItems.length} Drive files, ${gmailItems.length} emails, and ${calendarItems.length} calendar events loaded into Co-work scope.`);
      } else {
        setGoogleSyncMessage('Connected! Token verified. (If Drive or Gmail has restricted permissions on your account, paste a token with Drive/Gmail scopes from OAuth Playground below).');
      }
    } catch (err: any) {
      setGoogleSyncMessage(`Sync notice: ${err.message}`);
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleSyncSpecificGoogleApp = async (appType: string) => {
    setIsGoogleSyncing(true);
    setGoogleSyncMessage(`Syncing ${appType.toUpperCase()}...`);
    try {
      const token = getStoredGoogleToken();
      if (!token) {
        setGoogleSyncMessage('Please sign in with Google first.');
        return;
      }
      let items: GoogleWorkspaceItem[] = [];
      if (appType === 'drive') items = await fetchLiveGoogleDriveFiles(token);
      else if (appType === 'gmail') items = await fetchLiveGmailMessages(token);
      else if (appType === 'calendar') items = await fetchLiveCalendarEvents(token);

      const updated = googleIntegrations.map(app => {
        if (app.appType === appType && items.length > 0) {
          return {
            ...app,
            isConnected: true,
            lastSyncedAt: Date.now(),
            items
          };
        }
        return app;
      });

      if (onUpdateGoogleIntegrations) {
        onUpdateGoogleIntegrations(updated);
      }
      setGoogleSyncMessage(`Synced ${items.length} live items from ${appType.toUpperCase()}!`);
    } catch (err: any) {
      setGoogleSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleSaveGem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGemName.trim() || !newGemPrompt.trim()) return;

    const newGem: Gem = {
      id: 'gem-custom-' + Date.now(),
      name: newGemName.trim(),
      tagline: newGemTagline.trim() || 'Custom Persona',
      icon: 'Sparkles',
      systemPrompt: newGemPrompt.trim(),
      category: 'Productivity'
    };

    onCreateCustomGem(newGem);
    setIsAddingGem(false);
    setNewGemName('');
    setNewGemTagline('');
    setNewGemPrompt('');
  };

  const handleToggleSkill = (id: string) => {
    onUpdateSkills(skills.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  const handleDeleteSkill = (id: string) => {
    onUpdateSkills(skills.filter(s => s.id !== id));
  };

  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillPrompt.trim()) return;

    const newSkill: Skill = {
      id: 'skill-custom-' + Date.now(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      description: newSkillDesc.trim() || 'Custom skill directive',
      instructionPrompt: newSkillPrompt.trim(),
      tags: newSkillTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      isEnabled: true,
      isCustom: true
    };

    onUpdateSkills([newSkill, ...skills]);
    setIsAddingSkill(false);
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillPrompt('');
    setNewSkillTags('');
  };

  const handleToggleMcp = (id: string) => {
    onUpdateMcpServers(mcpServers.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  const handleDeleteMcp = (id: string) => {
    onUpdateMcpServers(mcpServers.filter(s => s.id !== id));
  };

  const handlePingMcp = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      onUpdateMcpServers(mcpServers.map(s => s.id === id ? { ...s, status: 'connected', lastPing: Date.now() } : s));
      setTestingId(null);
    }, 700);
  };

  // Save new MCP Server with selected auth fields
  const handleSaveMcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim() || !newMcpEndpoint.trim()) return;

    let authToken: string | undefined;
    let apiKeyHdr: string | undefined;
    let oauthConf: OAuthConfig | undefined;
    let customHeaders: Record<string, string> | undefined;

    if (newMcpAuthType === 'bearer') {
      authToken = bearerToken.trim();
    } else if (newMcpAuthType === 'api-key') {
      apiKeyHdr = apiKeyHeader.trim() || 'X-API-Key';
      authToken = apiKeyValue.trim();
    } else if (newMcpAuthType === 'oauth') {
      authToken = oauthToken.trim();
      oauthConf = {
        accessToken: oauthToken.trim(),
        clientId: oauthClientId.trim() || undefined,
        clientSecret: oauthClientSecret.trim() || undefined,
        scope: oauthScope.trim() || undefined
      };
    } else if (newMcpAuthType === 'none' && customHeaderKey.trim() && customHeaderVal.trim()) {
      customHeaders = {
        [customHeaderKey.trim()]: customHeaderVal.trim()
      };
    }

    const cleanName = newMcpName.trim();
    const cleanPrefix = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newServer: MCPServer = {
      id: 'mcp-custom-' + Date.now(),
      name: cleanName,
      endpointUrl: newMcpEndpoint.trim(),
      transport: 'https',
      authType: newMcpAuthType,
      authToken,
      apiKeyHeader: apiKeyHdr,
      oauthConfig: oauthConf,
      customHeaders,
      status: 'connected',
      isEnabled: true,
      lastPing: Date.now(),
      tools: [
        { name: `${cleanPrefix}_execute`, description: `Execute action via ${cleanName}` },
        { name: `${cleanPrefix}_query`, description: `Query resources and schemas from ${cleanName}` }
      ]
    };

    onUpdateMcpServers([newServer, ...mcpServers]);
    setIsAddingMcp(false);
    setNewMcpName('');
    setNewMcpEndpoint('');
    setBearerToken('');
    setApiKeyHeader('X-API-Key');
    setApiKeyValue('');
    setOauthToken('');
    setOauthClientId('');
    setOauthClientSecret('');
    setOauthScope('');
    setCustomHeaderKey('');
    setCustomHeaderVal('');
  };

  const getGoogleIcon = (type: string) => {
    switch (type) {
      case 'drive':
        return <FolderCheck className="w-4 h-4 text-[#ffb86c]" />;
      case 'docs':
        return <FileText className="w-4 h-4 text-[#60cdff]" />;
      case 'sheets':
        return <Table className="w-4 h-4 text-[#58d68d]" />;
      case 'slides':
        return <Presentation className="w-4 h-4 text-[#ffb86c]" />;
      case 'gmail':
        return <Mail className="w-4 h-4 text-[#ff79c6]" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-[#58d68d]" />;
      case 'meet':
        return <Video className="w-4 h-4 text-[#60cdff]" />;
      case 'keep':
        return <BookmarkCheck className="w-4 h-4 text-[#f1c40f]" />;
      default:
        return <Layers className="w-4 h-4 text-[#bb86fc]" />;
    }
  };

  const allConnected = googleIntegrations.every(g => g.isConnected);
  const connectedCount = googleIntegrations.filter(g => g.isConnected).length;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-[#202020] border border-[#383838] rounded-[8px] shadow-2xl overflow-hidden flex flex-col h-[82vh] font-sans">
        {/* Windows 11 Settings Header */}
        <div className="h-10 bg-[#1a1a1a] border-b border-[#2e2e2e] px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#60cdff]" />
            <h2 className="text-xs font-semibold text-white">Settings & Management</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#888888] hover:text-white hover:bg-[#e81123] rounded-[3px] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Message Banner if present */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs flex items-start space-x-2 border-b flex-shrink-0 ${
            statusMessage.type === 'success'
              ? 'bg-[#1b3d2b] border-[#29633e] text-[#58d68d]'
              : statusMessage.type === 'error'
              ? 'bg-[#3d1c1c] border-[#6b2525] text-[#ff7b7b]'
              : 'bg-[#1a2f42] border-[#294c6d] text-[#60cdff]'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1 text-[11px] leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Windows 11 Two-Column Layout: Left Sidebar + Right Detail Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Settings Navigation Menu */}
          <div className="w-56 bg-[#1a1a1a] border-r border-[#2e2e2e] p-2 flex flex-col justify-between flex-shrink-0">
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('google')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'google'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FolderCheck className="w-4 h-4 text-[#ffb86c]" />
                  <span>Google Workspace</span>
                </div>
                <span className="text-[10px] font-mono text-[#777777]">{connectedCount}/8</span>
              </button>

              <button
                onClick={() => setActiveTab('gems')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'gems'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-[#bb86fc]" />
                <span>Gems Personas</span>
              </button>

              <button
                onClick={() => setActiveTab('skills')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'skills'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 text-[#60cdff]" />
                <span>Skills Database</span>
              </button>

              <button
                onClick={() => setActiveTab('mcp')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'mcp'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <Server className="w-4 h-4 text-[#58d68d]" />
                <span>MCP Servers</span>
              </button>

              <div className="w-full h-[1px] bg-[#2a2a2a] my-1" />

              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'account'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4 text-[#cccccc]" />
                <span>Account Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'sync'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <Cloud className="w-4 h-4 text-[#60cdff]" />
                <span>Cloud Sync</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'preferences'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 text-[#a0a0a0]" />
                <span>Preferences</span>
              </button>

              <button
                onClick={() => setActiveTab('updates')}
                className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-[4px] text-xs transition text-left ${
                  activeTab === 'updates'
                    ? 'bg-[#292929] text-white font-medium border-l-2 border-l-[#60cdff]'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-[#58d68d]" />
                <span>Updates (v1.5)</span>
              </button>
            </div>

            <div className="p-2 border-t border-[#262626] text-[11px] text-[#707070] truncate">
              {isAnonymous ? 'Guest Local Session' : currentUser?.email || 'Cloud Account'}
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#202020] space-y-4">
            {/* TAB: GOOGLE WORKSPACE */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#172533] border border-[#234666] rounded-[6px] space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#60cdff]">
                    <HelpCircle className="w-4 h-4" />
                    <span>Google Workspace Ecosystem</span>
                  </div>
                  <p className="text-[11px] text-[#a4c3de] leading-relaxed">
                    All 8 Google Workspace services (Drive, Docs, Sheets, Slides, Gmail, Calendar, Meet, and Keep) can be connected here. Selected items are automatically injected into Gemini Co-work's prompt context for real-time reference.
                  </p>
                </div>

                {/* LIVE GOOGLE ACCOUNT & OAUTH SYNC CONTROLLER */}
                <div className="p-4 bg-[#1b232c] border border-[#2b4c6d] rounded-[6px] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm">
                        <svg className="w-full h-full" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-white">Google Workspace Account</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            hasGoogleAuth
                              ? 'bg-[#16291e] text-[#58d68d] border-[#276e4c]'
                              : 'bg-[#2a2a2a] text-[#888888] border-[#383838]'
                          }`}>
                            {hasGoogleAuth ? 'Authorized' : 'Not Connected'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#90a8bd] mt-0.5">
                          {hasGoogleAuth 
                            ? (currentUser?.email ? `Signed in as ${currentUser.email} with Drive, Gmail & Calendar scopes.` : 'OAuth token cached. Live REST API sync active.')
                            : 'Authenticate with Google to grant Gemini read access to your Drive files, Gmail inbox, and Calendar.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {hasGoogleAuth ? (
                        <>
                          <button
                            type="button"
                            disabled={isGoogleSyncing}
                            onClick={() => handleSyncAllGoogleWorkspace()}
                            className="px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] disabled:opacity-50 text-white rounded-[4px] text-xs font-medium transition flex items-center space-x-1.5 shadow-sm"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                            <span>{isGoogleSyncing ? 'Syncing...' : 'Sync Live Data'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGoogleWorkspaceLogin}
                            className="px-2.5 py-1.5 bg-[#292929] hover:bg-[#333333] border border-[#3e3e3e] text-[#cccccc] rounded-[4px] text-xs transition"
                            title="Re-authenticate or switch Google account"
                          >
                            Re-auth
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isGoogleSyncing}
                          onClick={handleGoogleWorkspaceLogin}
                          className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 rounded-[4px] text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin text-[#0078d4]' : 'hidden'}`} />
                          <span>{isGoogleSyncing ? 'Connecting...' : 'Sign In with Google'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {googleSyncMessage && (
                    <div className="p-2.5 bg-[#141d26] border border-[#234666] rounded-[4px] text-[11px] text-[#85bfe8] flex items-center justify-between">
                      <span>{googleSyncMessage}</span>
                      <button onClick={() => setGoogleSyncMessage(null)} className="text-[#888888] hover:text-white ml-2">✕</button>
                    </div>
                  )}

                  {/* Direct Token / OAuth Playground option */}
                  <div className="pt-2.5 border-t border-[#253e58] flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="password"
                      value={customGoogleToken}
                      onChange={(e) => setCustomGoogleToken(e.target.value)}
                      placeholder="Paste Google OAuth Token (ya29...) or Custom Token"
                      className="flex-1 bg-[#121921] border border-[#2b4c6d] rounded-[4px] px-2.5 py-1 text-xs text-white font-mono placeholder:text-[#5f7a93] focus:outline-none focus:border-[#60cdff]"
                    />
                    <button
                      type="button"
                      disabled={isGoogleSyncing}
                      onClick={handleConnectCustomToken}
                      className="px-3 py-1 bg-[#1e4466] hover:bg-[#285b8a] text-[#60cdff] rounded-[4px] text-xs font-medium transition whitespace-nowrap"
                    >
                      Connect Token
                    </button>
                    <a
                      href="https://developers.google.com/oauthplayground"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-[#19222c] hover:bg-[#24313f] text-[#8cb3d9] hover:text-white rounded-[4px] text-[11px] border border-[#2b4c6d] transition text-center whitespace-nowrap"
                      title="Open Google OAuth Playground to authorize Drive, Gmail & Calendar scopes"
                    >
                      OAuth Playground ↗
                    </a>
                  </div>
                </div>

                {/* Google AI Pro / AI Studio Credit Integration */}
                <div className="p-3 bg-[#19222e] border border-[#234668] rounded-[6px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#60cdff]" />
                      <span className="text-xs font-semibold text-white">Google AI Pro & Cloud Credits Integration</span>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#60cdff] hover:underline flex items-center space-x-1"
                    >
                      <span>Get Key from Google AI Studio</span>
                      <span>↗</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-[#90a8bd]">
                    Subscribed to Google AI Pro / Gemini Advanced? Your Google account includes Gemini API credits in Google AI Studio. Generate your key and paste it below to run Gemini 3.8 Flash, 3.7 Thinking, and 3.1 Pro Preview.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value={settings.apiKey || ''}
                      onChange={(e) => onUpdateSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="AIzaSy... (Paste Gemini API Key to use your Google AI credits)"
                      className="flex-1 bg-[#121921] border border-[#2b4c6d] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-[#5f7a93] focus:outline-none focus:border-[#60cdff]"
                    />
                    {settings.apiKey && (
                      <span className="text-[11px] text-[#58d68d] font-medium px-2 py-1 bg-[#16291e] border border-[#276e4c] rounded-[4px] whitespace-nowrap">
                        Key Active ✓
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#24292e] border border-[#2b4c6d] rounded-[6px] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center space-x-1.5">
                      <CheckCheck className="w-4 h-4 text-[#58d68d]" />
                      <span>Global Workspace Scope</span>
                    </h4>
                    <p className="text-[11px] text-[#90a8bd]">
                      {allConnected 
                        ? 'All 8 Google Workspace services are currently connected and active.'
                        : `${connectedCount} of 8 services active. Click to connect all workspaces.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleAllGoogleIntegrations(!allConnected)}
                    className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition ${
                      allConnected
                        ? 'bg-[#333333] hover:bg-[#3d3d3d] text-[#cccccc] border border-[#444444]'
                        : 'bg-[#0078d4] hover:bg-[#106ebe] text-white border border-[#2886ce] shadow-sm'
                    }`}
                  >
                    {allConnected ? 'Disconnect All' : 'Connect All Workspaces'}
                  </button>
                </div>

                <div className="space-y-2">
                  {googleIntegrations.map((app) => (
                    <div
                      key={app.appType}
                      className={`p-3 rounded-[6px] border transition space-y-2 ${
                        app.isConnected ? 'bg-[#24292e] border-[#2b4c6d]' : 'bg-[#222222] border-[#333333] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-1.5 rounded-[4px] bg-[#1a1a1a] border border-[#333333]">
                            {getGoogleIcon(app.appType)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-white">{app.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                app.isConnected
                                  ? 'bg-[#16291e] text-[#58d68d] border-[#276e4c]'
                                  : 'bg-[#2a2a2a] text-[#888888] border-[#383838]'
                              }`}>
                                {app.isConnected ? 'Connected' : 'Disconnected'}
                              </span>
                              {app.items.length > 0 && (
                                <span className="text-[9px] font-mono bg-[#142330] text-[#60cdff] px-1.5 py-0.2 rounded border border-[#204563]">
                                  {app.items.length} items
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#999999] mt-0.5">{app.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {hasGoogleAuth && (app.appType === 'drive' || app.appType === 'gmail' || app.appType === 'calendar') && (
                            <button
                              type="button"
                              disabled={isGoogleSyncing}
                              onClick={() => handleSyncSpecificGoogleApp(app.appType)}
                              className="px-2 py-0.5 bg-[#1a2b38] hover:bg-[#233a4c] border border-[#2b5478] text-[#60cdff] rounded-[3px] text-[10px] font-medium transition flex items-center space-x-1"
                              title={`Sync ${app.name} now`}
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                              <span>Sync</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleGoogleIntegration(app.appType)}
                            className={`w-9 h-4.5 rounded-full transition-colors relative flex-shrink-0 ${
                              app.isConnected ? 'bg-[#0078d4]' : 'bg-[#444444]'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              app.isConnected ? 'left-4.5' : 'left-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {app.isConnected && app.items.length > 0 && (
                        <div className="pt-2 border-t border-[#2d3a48] space-y-1.5">
                          <div className="text-[10px] font-semibold text-[#60cdff] uppercase tracking-wider">
                            Available in Co-work Scope:
                          </div>
                          <div className="space-y-1">
                            {app.items.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => onToggleGoogleItem(item.id)}
                                className={`p-1.5 rounded-[4px] border cursor-pointer transition flex items-center justify-between ${
                                  item.isSelected
                                    ? 'bg-[#182733] border-[#295679] text-white'
                                    : 'bg-[#1a1a1a] border-[#303030] text-[#a0a0a0] hover:text-[#dddddd]'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate pr-2">
                                  <input
                                    type="checkbox"
                                    checked={item.isSelected}
                                    onChange={() => onToggleGoogleItem(item.id)}
                                    className="rounded-[2px] bg-[#111111] border-[#444444] text-[#60cdff]"
                                  />
                                  <span className="text-[11px] font-medium truncate">{item.title}</span>
                                </div>
                                <span className="text-[10px] text-[#707070] font-mono flex-shrink-0">{item.updatedAt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GEMS PERSONAS */}
            {activeTab === 'gems' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Gemini Custom Gems Library</h3>
                    <p className="text-[11px] text-[#808080]">
                      Select or author specialized personas tailored for architecture, research, coding, or writing.
                    </p>
                  </div>
                  {!isAddingGem && (
                    <button
                      onClick={() => setIsAddingGem(true)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#282436] hover:bg-[#342e47] text-[#bb86fc] rounded-[4px] border border-[#4c3870] text-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Gem</span>
                    </button>
                  )}
                </div>

                {isAddingGem && (
                  <form onSubmit={handleSaveGem} className="p-3 bg-[#262626] border border-[#383838] rounded-[6px] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#333333] pb-1.5">
                      <span className="text-xs font-semibold text-white">Create New Custom Gem</span>
                      <button type="button" onClick={() => setIsAddingGem(false)} className="text-[#888888] hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Gem Name</label>
                      <input
                        type="text"
                        required
                        value={newGemName}
                        onChange={(e) => setNewGemName(e.target.value)}
                        placeholder="e.g. Distributed Systems Reviewer"
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bb86fc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Tagline</label>
                      <input
                        type="text"
                        value={newGemTagline}
                        onChange={(e) => setNewGemTagline(e.target.value)}
                        placeholder="e.g. Reviews sharding, consensus protocols & replication"
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bb86fc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#aaaaaa] mb-0.5">System Prompt Instructions</label>
                      <textarea
                        required
                        rows={3}
                        value={newGemPrompt}
                        onChange={(e) => setNewGemPrompt(e.target.value)}
                        placeholder="Specify domain rules, persona guidelines, and code standards..."
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bb86fc] resize-none font-mono"
                      />
                    </div>
                    <div className="flex justify-end space-x-1.5 pt-1">
                      <button type="button" onClick={() => setIsAddingGem(false)} className="px-2.5 py-1 text-[#888888] hover:text-white text-xs">
                        Cancel
                      </button>
                      <button type="submit" className="px-3 py-1 bg-[#7b2cbf] hover:bg-[#8a33d4] text-white rounded-[4px] text-xs font-medium transition">
                        Save Gem
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {gems.map((gem) => {
                    const isActive = activeGemId === gem.id;
                    return (
                      <div
                        key={gem.id}
                        onClick={() => onSelectGem(gem.id)}
                        className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                          isActive
                            ? 'bg-[#291e36] border-[#7b2cbf] text-white shadow-sm'
                            : 'bg-[#242424] hover:bg-[#282828] border-[#333333] text-[#cccccc]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-xs text-white flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#bb86fc]" />
                              <span>{gem.name}</span>
                            </span>
                            {isActive && (
                              <span className="text-[10px] bg-[#3a2054] text-[#bb86fc] px-1.5 py-0.2 rounded font-mono">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#909090] line-clamp-2 leading-relaxed">
                            {gem.tagline}
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-[#333333] flex items-center justify-between text-[10px] text-[#707070]">
                          <span>{gem.category}</span>
                          <span className="text-[#bb86fc] hover:underline">Select &rarr;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: SKILLS DATABASE */}
            {activeTab === 'skills' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Skills Database Directives</h3>
                    <p className="text-[11px] text-[#808080]">
                      Specialized audit, database, or testing directives injected into Co-work prompts.
                    </p>
                  </div>
                  {!isAddingSkill && (
                    <button
                      onClick={() => setIsAddingSkill(true)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#1a3850] hover:bg-[#204766] text-[#60cdff] rounded-[4px] border border-[#2b5d84] text-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Skill</span>
                    </button>
                  )}
                </div>

                {isAddingSkill && (
                  <form onSubmit={handleSaveSkill} className="p-3 bg-[#262626] border border-[#383838] rounded-[6px] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#333333] pb-1.5">
                      <span className="text-xs font-semibold text-white">Create New Directive Skill</span>
                      <button type="button" onClick={() => setIsAddingSkill(false)} className="text-[#888888] hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Skill Name</label>
                        <input
                          type="text"
                          required
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="e.g. Security Token Auditor"
                          className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#60cdff]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Category</label>
                        <select
                          value={newSkillCategory}
                          onChange={(e) => setNewSkillCategory(e.target.value as any)}
                          className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#60cdff]"
                        >
                          <option value="Code Analysis">Code Analysis</option>
                          <option value="DevOps">DevOps</option>
                          <option value="Database">Database</option>
                          <option value="Security">Security</option>
                          <option value="Documentation">Documentation</option>
                          <option value="Testing">Testing</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Summary</label>
                      <input
                        type="text"
                        value={newSkillDesc}
                        onChange={(e) => setNewSkillDesc(e.target.value)}
                        placeholder="e.g. Scrutinizes token expiry and refresh rotation"
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#60cdff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Directive Instructions</label>
                      <textarea
                        required
                        rows={3}
                        value={newSkillPrompt}
                        onChange={(e) => setNewSkillPrompt(e.target.value)}
                        placeholder="Specify rules, constraints, edge cases, and code standards..."
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#60cdff] resize-none font-mono"
                      />
                    </div>
                    <div className="flex justify-end space-x-1.5 pt-1">
                      <button type="button" onClick={() => setIsAddingSkill(false)} className="px-2.5 py-1 text-[#888888] hover:text-white text-xs">
                        Cancel
                      </button>
                      <button type="submit" className="px-3 py-1 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-[4px] text-xs font-medium transition">
                        Save Skill
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1.5">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className={`p-3 rounded-[6px] border transition flex items-start justify-between ${
                        skill.isEnabled ? 'bg-[#22292f] border-[#294c6d]' : 'bg-[#242424] border-[#333333] opacity-60'
                      }`}
                    >
                      <div className="space-y-1 flex-1 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-white">{skill.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181818] border border-[#333333] text-[#8e8e8e]">
                            {skill.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a0a0a0] leading-relaxed">{skill.description}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSkill(skill.id)}
                          className={`w-9 h-4.5 rounded-full transition-colors relative ${
                            skill.isEnabled ? 'bg-[#0078d4]' : 'bg-[#444444]'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            skill.isEnabled ? 'left-4.5' : 'left-0.5'
                          }`} />
                        </button>

                        {skill.isCustom && (
                          <button onClick={() => handleDeleteSkill(skill.id)} className="p-1 text-[#888888] hover:text-[#e81123] rounded transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MCP SERVERS WITH DYNAMIC INPUTS */}
            {activeTab === 'mcp' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Model Context Protocol (MCP) Servers</h3>
                    <p className="text-[11px] text-[#808080]">
                      Connect MCP tool providers over Direct HTTPS, Bearer Tokens, API Key Headers, or OAuth.
                    </p>
                  </div>
                  {!isAddingMcp && (
                    <button
                      onClick={() => setIsAddingMcp(true)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#163827] hover:bg-[#1d4732] text-[#58d68d] rounded-[4px] border border-[#276e4c] text-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect Server</span>
                    </button>
                  )}
                </div>

                {/* Add MCP Server Form with DYNAMIC INPUT FIELDS depending on auth type */}
                {isAddingMcp && (
                  <form onSubmit={handleSaveMcp} className="p-3.5 bg-[#262626] border border-[#383838] rounded-[6px] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#333333] pb-1.5">
                      <span className="text-xs font-semibold text-white">Register MCP Server Endpoint</span>
                      <button type="button" onClick={() => setIsAddingMcp(false)} className="text-[#888888] hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Server Name</label>
                        <input
                          type="text"
                          required
                          value={newMcpName}
                          onChange={(e) => setNewMcpName(e.target.value)}
                          placeholder="e.g. Sentry Error MCP"
                          className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58d68d]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Authentication Type</label>
                        <select
                          value={newMcpAuthType}
                          onChange={(e) => setNewMcpAuthType(e.target.value as MCPAuthType)}
                          className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58d68d]"
                        >
                          <option value="oauth">OAuth / Token</option>
                          <option value="bearer">Bearer Token (Authorization Header)</option>
                          <option value="api-key">Custom API Key Header</option>
                          <option value="none">Direct HTTPS (No Auth / Localhost)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#aaaaaa] mb-0.5">HTTPS / SSE Endpoint URL</label>
                      <input
                        type="url"
                        required
                        value={newMcpEndpoint}
                        onChange={(e) => setNewMcpEndpoint(e.target.value)}
                        placeholder="https://mcp-server.yourdomain.com/v1"
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58d68d]"
                      />
                    </div>

                    {/* DYNAMIC FORM SECTION 1: OAUTH / TOKEN */}
                    {newMcpAuthType === 'oauth' && (
                      <div className="p-3 bg-[#1e2320] border border-[#2d4737] rounded-[5px] space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#58d68d]">
                          <Shield className="w-3.5 h-3.5" />
                          <span>OAuth 2.0 Credentials & Token</span>
                        </div>
                        <p className="text-[10px] text-[#8ea89a]">
                          Enter an active OAuth Access Token or your Client ID and Secret to authenticate tool executions.
                        </p>

                        <div>
                          <label className="block text-[10px] text-[#aaaaaa] mb-0.5">OAuth Access Token / Session Token (Required)</label>
                          <input
                            type="password"
                            required
                            value={oauthToken}
                            onChange={(e) => setOauthToken(e.target.value)}
                            placeholder="ya29.a0AfH6SMB... or gho_xxxxxxxxxxxx"
                            className="w-full bg-[#141815] border border-[#383838] rounded-[4px] px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#58d68d]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#aaaaaa] mb-0.5">OAuth Client ID (Optional)</label>
                            <input
                              type="text"
                              value={oauthClientId}
                              onChange={(e) => setOauthClientId(e.target.value)}
                              placeholder="7281928471-xxx.apps.googleusercontent.com"
                              className="w-full bg-[#141815] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58d68d]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Client Secret (Optional)</label>
                            <input
                              type="password"
                              value={oauthClientSecret}
                              onChange={(e) => setOauthClientSecret(e.target.value)}
                              placeholder="GOCSPX-xxxxxxxxxxxx"
                              className="w-full bg-[#141815] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58d68d]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Scopes (Optional)</label>
                          <input
                            type="text"
                            value={oauthScope}
                            onChange={(e) => setOauthScope(e.target.value)}
                            placeholder="repo, read:org, https://www.googleapis.com/auth/..."
                            className="w-full bg-[#141815] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white font-mono text-[11px] focus:outline-none focus:border-[#58d68d]"
                          />
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC FORM SECTION 2: BEARER TOKEN */}
                    {newMcpAuthType === 'bearer' && (
                      <div className="p-3 bg-[#1d262b] border border-[#2b4c5e] rounded-[5px] space-y-2">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#60cdff]">
                          <Key className="w-3.5 h-3.5" />
                          <span>Bearer Token Authorization</span>
                        </div>
                        <p className="text-[10px] text-[#8fb5c7]">
                          Will be sent as <code className="bg-[#12191d] px-1 py-0.2 rounded text-white font-mono">Authorization: Bearer &lt;token&gt;</code> on every JSON-RPC request.
                        </p>

                        <div>
                          <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Bearer Token Secret (Required)</label>
                          <input
                            type="password"
                            required
                            value={bearerToken}
                            onChange={(e) => setBearerToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx or sk-ant-mcp-xxxxxxxx"
                            className="w-full bg-[#131b20] border border-[#383838] rounded-[4px] px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#60cdff]"
                          />
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC FORM SECTION 3: CUSTOM API KEY HEADER */}
                    {newMcpAuthType === 'api-key' && (
                      <div className="p-3 bg-[#26241b] border border-[#52492a] rounded-[5px] space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#ffb86c]">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Custom API Key Header</span>
                        </div>
                        <p className="text-[10px] text-[#c9b78a]">
                          Configure the exact header name and key required by your custom MCP service.
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Header Name</label>
                            <input
                              type="text"
                              required
                              value={apiKeyHeader}
                              onChange={(e) => setApiKeyHeader(e.target.value)}
                              placeholder="X-API-Key or X-DB-Token"
                              className="w-full bg-[#1a1811] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#ffb86c]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Header Value / Key</label>
                            <input
                              type="password"
                              required
                              value={apiKeyValue}
                              onChange={(e) => setApiKeyValue(e.target.value)}
                              placeholder="sec_live_xxxxxxxxxxxx"
                              className="w-full bg-[#1a1811] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#ffb86c]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC FORM SECTION 4: DIRECT HTTPS / NO AUTH */}
                    {newMcpAuthType === 'none' && (
                      <div className="p-3 bg-[#1e2024] border border-[#343a46] rounded-[5px] space-y-2">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#cccccc]">
                          <Globe className="w-3.5 h-3.5 text-[#60cdff]" />
                          <span>Direct HTTPS Connection (No Authentication)</span>
                        </div>
                        <p className="text-[10px] text-[#8c94a3]">
                          Suitable for localhost endpoints (e.g. <code className="bg-[#141517] px-1 py-0.2 rounded font-mono text-white">http://localhost:8000/sse</code>) or public MCP servers that require no credentials.
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Optional Custom Header</label>
                            <input
                              type="text"
                              value={customHeaderKey}
                              onChange={(e) => setCustomHeaderKey(e.target.value)}
                              placeholder="e.g. X-Tenant-Id"
                              className="w-full bg-[#141517] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#60cdff]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#aaaaaa] mb-0.5">Optional Header Value</label>
                            <input
                              type="text"
                              value={customHeaderVal}
                              onChange={(e) => setCustomHeaderVal(e.target.value)}
                              placeholder="e.g. production_workspace"
                              className="w-full bg-[#141517] border border-[#383838] rounded-[4px] px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#60cdff]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-1.5 pt-1">
                      <button type="button" onClick={() => setIsAddingMcp(false)} className="px-2.5 py-1 text-[#888888] hover:text-white text-xs">
                        Cancel
                      </button>
                      <button type="submit" className="px-3.5 py-1 bg-[#237750] hover:bg-[#2c885c] text-white rounded-[4px] text-xs font-medium transition shadow-sm">
                        Connect & Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {mcpServers.map((server) => (
                    <div
                      key={server.id}
                      className={`p-3 rounded-[6px] border transition space-y-2 ${
                        server.isEnabled ? 'bg-[#1b2621] border-[#276e4c]' : 'bg-[#242424] border-[#333333] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-white">{server.name}</span>
                            <span className="text-[9px] font-mono bg-[#16291e] text-[#58d68d] px-1.5 py-0.2 rounded border border-[#276e4c]">
                              {server.status}
                            </span>
                            <span className="text-[10px] font-mono text-[#808080] uppercase">
                              Auth: {server.authType}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[#89b39b]">{server.endpointUrl}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button onClick={() => handlePingMcp(server.id)} disabled={testingId === server.id} className="p-1 text-[#888888] hover:text-white rounded transition">
                            <RefreshCw className={`w-3 h-3 ${testingId === server.id ? 'animate-spin text-[#58d68d]' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleMcp(server.id)}
                            className={`w-9 h-4.5 rounded-full transition-colors relative ${
                              server.isEnabled ? 'bg-[#237750]' : 'bg-[#444444]'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              server.isEnabled ? 'left-4.5' : 'left-0.5'
                            }`} />
                          </button>
                          <button onClick={() => handleDeleteMcp(server.id)} className="p-1 text-[#888888] hover:text-[#e81123] rounded transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ACCOUNT PROFILE */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#262626] border border-[#333333] rounded-[6px] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[#2b5478]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1e3448] border border-[#2b5478] flex items-center justify-center text-[#60cdff]">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">
                          {currentUser?.displayName || currentUser?.email || 'Guest User (Anonymous)'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isAnonymous ? 'bg-[#333333] text-[#909090]' : 'bg-[#1e3e2b] text-[#58d68d] border border-[#276e4c]'
                        }`}>
                          {isAnonymous ? 'Local Session' : '✓ Google Verified'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#808080] mt-0.5">
                        {currentUser?.email ? currentUser.email : `UID: ${currentUser?.uid?.slice(0, 16)}...`}
                      </p>
                      {!isAnonymous && (
                        <p className="text-[10px] text-[#58d68d] font-medium mt-0.5">
                          Google Credentials & AI Pro credits attached to workspace
                        </p>
                      )}
                    </div>
                  </div>

                  {!isAnonymous && (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#2e2e2e] hover:bg-[#383838] text-[#ff7b7b] rounded-[4px] border border-[#3f3f3f] text-xs transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>

                {isAnonymous && (
                  <div className="p-4 bg-[#262626] border border-[#333333] rounded-[6px] space-y-3">
                    <h3 className="text-xs font-semibold text-white">
                      {isRegisterMode ? 'Create Account & Sync Settings' : 'Sign in to Migrate Your Settings'}
                    </h3>

                    {/* Google Account Sign-In (AI Pro Credits & Cloud Auth) */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-900 rounded-[4px] text-xs font-medium flex items-center justify-center space-x-2 transition shadow-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Sign in with Google (AI Pro / Cloud Credits)</span>
                    </button>

                    <div className="flex items-center space-x-2 my-2">
                      <div className="flex-1 h-[1px] bg-[#333333]" />
                      <span className="text-[10px] text-[#777777]">OR WITH EMAIL</span>
                      <div className="flex-1 h-[1px] bg-[#333333]" />
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-2.5">
                      {isRegisterMode && (
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      )}
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(!isRegisterMode)}
                          className="text-[11px] text-[#60cdff] hover:underline"
                        >
                          {isRegisterMode ? 'Already have an account? Sign in' : "Register new account"}
                        </button>
                        <button type="submit" className="px-4 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-[4px] text-xs font-medium transition shadow-sm">
                          {isRegisterMode ? 'Register & Sync' : 'Sign In'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CLOUD SYNC */}
            {activeTab === 'sync' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#262626] border border-[#333333] rounded-[6px] space-y-3">
                  <h3 className="text-xs font-semibold text-white flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-[#60cdff]" />
                    <span>Cloud Migration & Backup</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCloudBackup}
                      disabled={isSyncing}
                      className="flex flex-col items-start p-3 bg-[#1e2d3d] hover:bg-[#25394d] border border-[#2a4d6e] rounded-[4px] text-left transition"
                    >
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#60cdff]">
                        <CloudUpload className="w-4 h-4" />
                        <span>Backup to Cloud</span>
                      </div>
                      <span className="text-[10px] text-[#89a8c4] mt-1">
                        Save {sessions.length} chats, {skills.length} skills & {workspaceFiles.length} files
                      </span>
                    </button>

                    <button
                      onClick={handleCloudRestore}
                      disabled={isSyncing}
                      className="flex flex-col items-start p-3 bg-[#2a243d] hover:bg-[#342c4d] border border-[#4a396d] rounded-[4px] text-left transition"
                    >
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#bb86fc]">
                        <CloudDownload className="w-4 h-4" />
                        <span>Restore from Cloud</span>
                      </div>
                      <span className="text-[10px] text-[#a998c9] mt-1">
                        Restore workspace onto this machine
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PREFERENCES & AI ENGINE */}
            {activeTab === 'preferences' && (
              <div className="p-4 bg-[#262626] border border-[#333333] rounded-[6px] space-y-4 overflow-y-auto max-h-[68vh]">
                <div>
                  <h3 className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-[#60cdff]" />
                    <span>AI Model Provider & Engine</span>
                  </h3>
                  <p className="text-[11px] text-[#888888] mt-0.5">
                    Choose your AI provider. Run free offline local models (Ollama / LM Studio) with zero API credits, OpenCode models, or Google Gemini.
                  </p>
                </div>

                {/* Provider Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Groq Cloud Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'groq' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      settings.aiProvider === 'groq'
                        ? 'bg-[#2b1f3d]/70 border-[#7b42bc] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">⚡</span>
                        <span className="text-xs font-semibold text-white">Groq Cloud</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#321a4f] text-[#e0b0ff] border border-[#6b28b5]">
                        500+ tok/s
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Ultra-fast free cloud LPU. Llama 3.3 70B & Qwen 2.5 Coder. 100% free with key.
                    </p>
                  </div>

                  {/* OpenRouter Free Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'openrouter' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      settings.aiProvider === 'openrouter'
                        ? 'bg-[#1a2936]/70 border-[#235882] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🔀</span>
                        <span className="text-xs font-semibold text-white">OpenRouter</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#132c42] text-[#60cdff] border border-[#204a6b]">
                        Free Tier
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Free cloud models (Llama 3.3 70B, DeepSeek R1, Gemini 2.0 Flash).
                    </p>
                  </div>

                  {/* Ollama Local Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'ollama' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      (settings.aiProvider === 'ollama' || (!settings.aiProvider && !settings.apiKey && !settings.groqApiKey))
                        ? 'bg-[#1b3d2b]/60 border-[#276e4c] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🦙</span>
                        <span className="text-xs font-semibold text-white">Local Ollama</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#163827] text-[#58d68d] border border-[#276e4c]">
                        Offline PC
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Runs on local PC. Zero internet or keys needed.
                    </p>
                  </div>

                  {/* LM Studio Local Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'lmstudio' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      settings.aiProvider === 'lmstudio'
                        ? 'bg-[#192f42]/60 border-[#255275] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">💻</span>
                        <span className="text-xs font-semibold text-white">LM Studio</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#142838] text-[#60cdff] border border-[#204a6b]">
                        Port 1234
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Connects to LM Studio on port 1234. Load any GGUF model locally.
                    </p>
                  </div>

                  {/* OpenCode / Custom Endpoint Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'opencode' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      (settings.aiProvider === 'opencode' || settings.aiProvider === 'custom')
                        ? 'bg-[#2b1f3d]/60 border-[#4b336d] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🌐</span>
                        <span className="text-xs font-semibold text-white">OpenCode</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2b1b42] text-[#bb86fc] border border-[#482875]">
                        Custom API
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Any custom OpenAI-compatible API gateway or local endpoint.
                    </p>
                  </div>

                  {/* Google Gemini Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'gemini' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      settings.aiProvider === 'gemini'
                        ? 'bg-[#2a2412]/60 border-[#6b541d] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🌟</span>
                        <span className="text-xs font-semibold text-white">Gemini</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#332512] text-[#ffb86c] border border-[#63441a]">
                        Cloud Pro
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Gemini 3.8/3.7 models via Google AI Studio API key.
                    </p>
                  </div>

                  {/* xAI Grok Card */}
                  <div
                    onClick={() => onUpdateSettings({ ...settings, aiProvider: 'grok' })}
                    className={`p-3 rounded-[6px] border cursor-pointer transition flex flex-col justify-between ${
                      settings.aiProvider === 'grok'
                        ? 'bg-[#182333]/80 border-[#3b82f6] text-white shadow-sm'
                        : 'bg-[#1e1e1e] border-[#333333] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🚀</span>
                        <span className="text-xs font-semibold text-white">xAI Grok</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1e3a5f] text-[#60a5fa] border border-[#2563eb]">
                        Grok 2
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-tight">
                      Official xAI Grok 2 & Grok Vision. Frontier reasoning, coding & analysis.
                    </p>
                  </div>
                </div>

                {/* PROVIDER DETAIL SECTIONS */}

                {/* 0. xAI GROK SETTINGS */}
                {settings.aiProvider === 'grok' && (
                  <div className="p-3 bg-[#131d2a] border border-[#2563eb]/60 rounded-[6px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">🚀</span>
                        <span className="text-xs font-semibold text-white">xAI Grok 2 API Engine</span>
                      </div>
                      <a
                        href="https://console.x.ai"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#60a5fa] hover:underline flex items-center space-x-1"
                      >
                        <span>xAI Console ↗</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-[#a0a0a0] leading-relaxed">
                      Powered by xAI Grok 2. Full support for Co-work conversations, Canvas interactive generation, Code Architect, and Vision.
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-[#cccccc] font-medium">xAI Grok API Key</label>
                        <span className="text-[10px] text-[#888888]">Saved securely</span>
                      </div>
                      <input
                        type="password"
                        value={settings.grokApiKey || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, grokApiKey: e.target.value })}
                        placeholder="xai-..."
                        className="w-full bg-[#0d1520] border border-[#1e3a5f] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#60a5fa]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#cccccc] mb-1 font-medium">Model Selection</label>
                      <select
                        value={settings.grokModel || 'grok-2-latest'}
                        onChange={(e) => onUpdateSettings({ ...settings, grokModel: e.target.value })}
                        className="w-full bg-[#0d1520] border border-[#1e3a5f] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="grok-2-latest">grok-2-latest (Flagship Grok 2 - Best for Code, Canvas & Reasoning)</option>
                        <option value="grok-2">grok-2 (Frontier Model)</option>
                        <option value="grok-2-mini">grok-2-mini (Fast & Lightweight)</option>
                        <option value="grok-vision-beta">grok-vision-beta (Multimodal Vision)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 1. GROQ CLOUD SETTINGS */}
                {settings.aiProvider === 'groq' && (
                  <div className="p-3 bg-[#1e1a29] border border-[#5d3f8c] rounded-[6px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">⚡</span>
                        <span className="text-xs font-semibold text-white">Groq Cloud LPU Engine (500+ tok/sec)</span>
                      </div>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#bb86fc] hover:underline flex items-center space-x-1"
                      >
                        <span>Get Free Key (10s) ↗</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-[#a0a0a0] leading-relaxed">
                      Groq delivers blazing fast 500+ tokens/second inference completely free with zero credit card required. Perfect for Canvas, Code Architect, and Live Voice!
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-[#cccccc] font-medium">Groq API Key</label>
                        <span className="text-[10px] text-[#888888]">Stored locally on your device</span>
                      </div>
                      <input
                        type="password"
                        value={settings.groqApiKey || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, groqApiKey: e.target.value })}
                        placeholder="gsk_..."
                        className="w-full bg-[#15121e] border border-[#482875] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#bb86fc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#cccccc] mb-1 font-medium">Model Selection</label>
                      <select
                        value={settings.groqModel || 'openai/gpt-oss-20b'}
                        onChange={(e) => onUpdateSettings({ ...settings, groqModel: e.target.value })}
                        className="w-full bg-[#15121e] border border-[#482875] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (20B Ultra Fast - 800+ tok/sec - Recommended)</option>
                        <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (120B Flagship Frontier - Deep Reasoning & Code)</option>
                        <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (27B Qwen Coder Specialist)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 2. OPENROUTER SETTINGS */}
                {settings.aiProvider === 'openrouter' && (
                  <div className="p-3 bg-[#17222b] border border-[#235882] rounded-[6px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">🔀</span>
                        <span className="text-xs font-semibold text-white">OpenRouter Free Tier Models</span>
                      </div>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#60cdff] hover:underline flex items-center space-x-1"
                      >
                        <span>Get API Key ↗</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-[#a0a0a0] leading-relaxed">
                      Connect to OpenRouter to access free tier cloud models including Llama 3.3 70B, DeepSeek R1, and Gemini 2.0 Flash.
                    </p>
                    <div>
                      <label className="block text-[11px] text-[#cccccc] mb-1 font-medium">OpenRouter API Key</label>
                      <input
                        type="password"
                        value={settings.openrouterApiKey || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, openrouterApiKey: e.target.value })}
                        placeholder="sk-or-..."
                        className="w-full bg-[#101921] border border-[#1f4a6e] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#60cdff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#cccccc] mb-1 font-medium">Model Selection</label>
                      <select
                        value={settings.openrouterModel || 'meta-llama/llama-3.3-70b-instruct:free'}
                        onChange={(e) => onUpdateSettings({ ...settings, openrouterModel: e.target.value })}
                        className="w-full bg-[#101921] border border-[#1f4a6e] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free (Llama 3.3 70B Free)</option>
                        <option value="deepseek/deepseek-r1:free">deepseek/deepseek-r1:free (DeepSeek R1 Free)</option>
                        <option value="google/gemini-2.0-flash-exp:free">google/gemini-2.0-flash-exp:free (Gemini 2.0 Free)</option>
                        <option value="qwen/qwen-2.5-coder-32b-instruct:free">qwen/qwen-2.5-coder-32b-instruct:free (Qwen Coder Free)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 3. OLLAMA SETTINGS */}
                {(settings.aiProvider === 'ollama' || (!settings.aiProvider && !settings.apiKey && !settings.groqApiKey)) && (
                  <div className="p-3 bg-[#1c241f] border border-[#276e4c]/50 rounded-[6px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${ollamaStatus.online ? 'bg-[#58d68d]' : 'bg-[#e74c3c]'}`} />
                        <span className="text-xs font-semibold text-white">
                          Ollama Status: {ollamaStatus.online ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!ollamaStatus.online && (
                          <button
                            type="button"
                            onClick={handleStartOllama}
                            disabled={isStartingOllama}
                            className="px-2 py-1 bg-[#276e4c] hover:bg-[#1f573c] text-white text-[11px] font-medium rounded-[4px] transition flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>{isStartingOllama ? 'Starting...' : 'Start Ollama'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={fetchOllamaStatus}
                          disabled={isCheckingOllama}
                          className="px-2 py-1 bg-[#28382e] hover:bg-[#344a3c] text-[#a0c8af] text-[11px] rounded-[4px] transition flex items-center space-x-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isCheckingOllama ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>

                    {/* Installed Models Select */}
                    <div>
                      <label className="block text-[11px] text-[#cccccc] mb-1 font-medium">
                        Active Local Model ({ollamaStatus.models.length} installed on disk)
                      </label>
                      {ollamaStatus.models.length > 0 ? (
                        <select
                          value={settings.ollamaModel || ollamaStatus.models[0].name}
                          onChange={(e) => onUpdateSettings({ ...settings, ollamaModel: e.target.value })}
                          className="w-full bg-[#141b16] border border-[#276e4c] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          {ollamaStatus.models.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.name} {m.size ? `(${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={settings.ollamaModel || 'gemma2:2b'}
                          onChange={(e) => onUpdateSettings({ ...settings, ollamaModel: e.target.value })}
                          placeholder="e.g. gemma2:2b, llama3:latest"
                          className="w-full bg-[#141b16] border border-[#276e4c] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Download / Pull Model */}
                    <div className="pt-2 border-t border-[#276e4c]/30">
                      <label className="block text-[11px] text-[#888888] mb-1">
                        Download / Pull Additional Model:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={pullModelName}
                          onChange={(e) => setPullModelName(e.target.value)}
                          placeholder="e.g. qwen2.5-coder:1.5b, deepseek-r1:1.5b"
                          className="flex-1 bg-[#141b16] border border-[#276e4c]/50 rounded-[4px] px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handlePullModel()}
                          className="px-2.5 py-1 bg-[#276e4c] hover:bg-[#1f573c] text-white text-[11px] font-medium rounded-[4px] transition flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Pull</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-2">
                        <span className="text-[10px] text-[#777777]">Quick add:</span>
                        <button
                          type="button"
                          onClick={() => handlePullModel('qwen2.5-coder:1.5b')}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#16291e] hover:bg-[#203d2c] text-[#58d68d] border border-[#276e4c]/40 font-mono"
                        >
                          + qwen2.5-coder:1.5b
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePullModel('deepseek-r1:1.5b')}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#16291e] hover:bg-[#203d2c] text-[#58d68d] border border-[#276e4c]/40 font-mono"
                        >
                          + deepseek-r1:1.5b
                        </button>
                      </div>
                      {pullStatus && (
                        <p className="text-[10px] text-[#58d68d] mt-1 font-mono">{pullStatus}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. LM STUDIO SETTINGS */}
                {settings.aiProvider === 'lmstudio' && (
                  <div className="p-3 bg-[#16232e] border border-[#204a6b] rounded-[6px] space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                      <span>💻</span>
                      <span>LM Studio Local Server</span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-relaxed">
                      Make sure the <strong>Local Server</strong> tab is running in LM Studio (default: port 1234). Any loaded model will respond.
                    </p>
                    <div>
                      <label className="block text-[11px] text-[#aaaaaa] mb-1">LM Studio Endpoint</label>
                      <input
                        type="text"
                        value={settings.customBaseUrl || 'http://127.0.0.1:1234/v1'}
                        onChange={(e) => onUpdateSettings({ ...settings, customBaseUrl: e.target.value })}
                        placeholder="http://127.0.0.1:1234/v1"
                        className="w-full bg-[#111c26] border border-[#255275] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. OPENCODE / CUSTOM SETTINGS */}
                {(settings.aiProvider === 'opencode' || settings.aiProvider === 'custom') && (
                  <div className="p-3 bg-[#261c36] border border-[#482875] rounded-[6px] space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                      <span>🌐</span>
                      <span>OpenCode & OpenAI-Compatible Endpoint</span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-relaxed">
                      Connect to OpenCode contributor models, OpenRouter free models, or any OpenAI-compatible API gateway.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#aaaaaa] mb-1">Base Endpoint URL</label>
                        <input
                          type="text"
                          value={settings.customBaseUrl || 'http://127.0.0.1:11434/v1'}
                          onChange={(e) => onUpdateSettings({ ...settings, customBaseUrl: e.target.value })}
                          placeholder="http://localhost:11434/v1 or https://openrouter.ai/api/v1"
                          className="w-full bg-[#1a1326] border border-[#482875] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#aaaaaa] mb-1">Model Name / ID</label>
                        <input
                          type="text"
                          value={settings.customModel || 'nemotron-3.5-lightning-free'}
                          onChange={(e) => onUpdateSettings({ ...settings, customModel: e.target.value })}
                          placeholder="nemotron-3.5-lightning-free or gemma2:2b"
                          className="w-full bg-[#1a1326] border border-[#482875] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#aaaaaa] mb-1">API Key (Optional for local)</label>
                      <input
                        type="password"
                        value={settings.customApiKey || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, customApiKey: e.target.value })}
                        placeholder="sk-... (Leave empty for local models)"
                        className="w-full bg-[#1a1326] border border-[#482875] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. GOOGLE GEMINI SETTINGS */}
                {settings.aiProvider === 'gemini' && (
                  <div className="p-3 bg-[#241e17] border border-[#63441a] rounded-[6px] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#ffb86c]">
                        Google Gemini API Key
                      </label>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#ffb86c] hover:underline"
                      >
                        Get key from Google AI Studio ↗
                      </a>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-relaxed">
                      Powers Gemini 3.8 Flash, 3.7 Flash, and Live Voice directly.
                    </p>
                    <input
                      type="password"
                      value={settings.apiKey || ''}
                      onChange={(e) => onUpdateSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#1c1813] border border-[#63441a] rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                )}

                {/* GENERAL PREFERENCES */}
                <div className="pt-3 border-t border-[#333333] space-y-3">
                  <div>
                    <label className="block text-[11px] text-[#aaaaaa] mb-1">User Display Name</label>
                    <input
                      type="text"
                      value={settings.userName}
                      onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
                      className="w-full bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {settings.aiProvider === 'gemini' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-white block">Auto Grounding with Google Search</span>
                        <span className="text-[10px] text-[#888888]">Enable web citations by default on research queries</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ ...settings, autoGrounding: !settings.autoGrounding })}
                        className={`w-9 h-4.5 rounded-full transition-colors relative ${
                          settings.autoGrounding ? 'bg-[#0078d4]' : 'bg-[#444444]'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          settings.autoGrounding ? 'left-4.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: UPDATES & RELEASES (v1.2.0) */}
            {activeTab === 'updates' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#232323] border border-[#333333] rounded-[6px] space-y-3">
                  <div className="flex items-center space-x-3 pb-3 border-b border-[#303030]">
                    <img src="/app-icon.png" alt="App Icon" className="w-10 h-10 rounded-[6px] object-contain shadow-md" />
                    <div>
                      <h3 className="text-xs font-semibold text-white flex items-center space-x-2">
                        <span>Gemini Co-work Desktop</span>
                        <span className="px-1.5 py-0.2 bg-[#1b3449] text-[#60cdff] text-[10px] font-mono rounded border border-[#275374]">
                          v1.5.1
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                        Native AI co-working workstation with File Explorer context, Canvas, and Deep Research.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-xs text-white font-medium">GitHub Repository Sync</div>
                      <p className="text-[10px] text-[#888888]">
                        Tracks repository: <a href="https://github.com/batch15studios/GeminiCo-Work" target="_blank" rel="noreferrer" className="text-[#60cdff] hover:underline">batch15studios/GeminiCo-Work</a>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCheckUpdates}
                        disabled={isCheckingUpdate}
                        className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] border border-[#3c3c3c] text-white rounded-[4px] text-xs font-medium transition flex items-center space-x-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-[#60cdff]' : ''}`} />
                        <span>{isCheckingUpdate ? 'Checking...' : 'Check for Updates'}</span>
                      </button>

                      <button
                        onClick={handlePullUpdate}
                        disabled={isPullingUpdate}
                        className="px-3 py-1.5 bg-[#1b5e3f] hover:bg-[#237750] border border-[#2c885c] text-white rounded-[4px] text-xs font-medium transition flex items-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isPullingUpdate ? 'Updating...' : 'Update App Now'}</span>
                      </button>
                    </div>
                  </div>

                  {updateInfo && (
                    <div className="p-3 bg-[#191919] border border-[#2e2e2e] rounded-[5px] space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          Latest Release: {updateInfo.latestVersion || updateInfo.latestCommit}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          updateInfo.updateAvailable ? 'bg-[#5c2a1e] text-[#ff8c69]' : 'bg-[#183925] text-[#58d68d]'
                        }`}>
                          {updateInfo.updateAvailable ? 'Update Waiting' : 'Up to Date'}
                        </span>
                      </div>

                      {updateInfo.name && (
                        <div className="text-xs text-[#60cdff] font-medium">{updateInfo.name}</div>
                      )}

                      {updateInfo.notes && (
                        <div className="text-[11px] text-[#aaaaaa] bg-[#141414] p-2 rounded border border-[#282828] font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {updateInfo.notes}
                        </div>
                      )}

                      {updateInfo.downloadUrl && (
                        <a
                          href={updateInfo.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs text-[#60cdff] hover:underline pt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Download Release Package</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Package Installer Information Box */}
                <div className="p-4 bg-[#19232c] border border-[#234259] rounded-[6px] flex items-start space-x-3">
                  <img src="/installer-icon.png" alt="Package Installer" className="w-12 h-12 rounded-[6px] object-contain flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-[#60cdff]">Windows Installer Packaging (v1.5.1)</h4>
                    <p className="text-[11px] text-[#a0c2db] leading-relaxed">
                      You can compile a standalone Windows Setup installer (<code className="font-mono text-white">GeminiCoWork-Setup-v1.5.1.exe</code>) using Inno Setup or run the automated script <code className="font-mono text-white">package-installer.ps1</code> in the workspace root.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-10 bg-[#1a1a1a] border-t border-[#2e2e2e] px-4 flex items-center justify-between text-[11px] text-[#808080] flex-shrink-0">
          <span>Gemini Co-work Settings Hub</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#2e2e2e] hover:bg-[#383838] text-white rounded-[4px] transition text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
