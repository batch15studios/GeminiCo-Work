import React, { useState, useRef } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Pin, 
  Trash2, 
  Menu, 
  FolderTree, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  Upload, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Settings as SettingsIcon,
  RefreshCw,
  HardDrive,
  Search
} from 'lucide-react';
import { ChatSession, Gem, WorkspaceFile } from '../types';
import { User } from 'firebase/auth';
import { fetchWorkspaceFiles, readWorkspaceFile, openLocalFolderWithPicker } from '../services/filesystemService';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
  workspaceFiles: WorkspaceFile[];
  onToggleFileSelection: (id: string) => void;
  onSelectAllFiles: (select: boolean) => void;
  onOpenFileInCanvas: (file: WorkspaceFile) => void;
  onImportFiles: (files: WorkspaceFile[]) => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onTogglePinSession,
  isOpen,
  setIsOpen,
  onOpenSettings,
  onOpenCommandPalette,
  workspaceFiles,
  onToggleFileSelection,
  onSelectAllFiles,
  onOpenFileInCanvas,
  onImportFiles,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'files'>('files');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/components': true
  });
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const [isSyncingDisk, setIsSyncingDisk] = useState(false);

  const selectedCount = workspaceFiles.filter(f => f.isSelected).length;

  const handleSyncLocalDisk = async () => {
    setIsSyncingDisk(true);
    try {
      const res = await fetchWorkspaceFiles();
      const diskFiles: WorkspaceFile[] = [];
      for (const item of res.items) {
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
              isSelected: true
            });
          } catch (e) {
            console.warn('Could not read file:', item.path);
          }
        }
      }
      if (diskFiles.length > 0) {
        onImportFiles(diskFiles);
      }
    } catch (err) {
      console.warn('Could not sync local disk:', err);
    } finally {
      setIsSyncingDisk(false);
    }
  };

  const handlePickFolder = async () => {
    try {
      const picked = await openLocalFolderWithPicker();
      if (picked.length > 0) {
        onImportFiles(picked);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') console.warn(e);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imported: WorkspaceFile[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const relativePath = (file as any).webkitRelativePath || file.name;
      const extension = file.name.split('.').pop() || 'txt';

      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          imported.push({
            id: 'file-' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            path: relativePath,
            extension,
            size: file.size,
            isSelected: true,
            content: text
          });

          if (imported.length === files.length) {
            onImportFiles(imported);
          }
        }
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  const buildTree = () => {
    const folders: Record<string, WorkspaceFile[]> = { '': [] };
    workspaceFiles.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        const folder = parts.slice(0, parts.length - 1).join('/');
        if (!folders[folder]) folders[folder] = [];
        folders[folder].push(file);
      } else {
        folders[''].push(file);
      }
    });
    return folders;
  };

  const fileTree = buildTree();

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <FileCode className="w-3.5 h-3.5 text-[#60cdff]" />;
      case 'json':
        return <FileJson className="w-3.5 h-3.5 text-[#ffb86c]" />;
      case 'md':
      case 'txt':
        return <FileText className="w-3.5 h-3.5 text-[#bb86fc]" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-[#a0a0a0]" />;
    }
  };

  const isAnonymous = currentUser?.isAnonymous ?? true;

  // Collapsed Rail View
  if (!isOpen) {
    return (
      <div className="w-11 bg-[#1c1c1c] border-r border-[#2e2e2e] flex flex-col items-center py-2 justify-between flex-shrink-0 z-20">
        <div className="flex flex-col items-center space-y-3 w-full">
          <button
            onClick={() => setIsOpen(true)}
            title="Open Navigation Pane (Ctrl+B)"
            className="p-2 text-[#a0a0a0] hover:text-white hover:bg-[#2c2c2c] rounded-[4px] transition"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setIsOpen(true); setActiveTab('files'); }}
            title={`File Explorer (${selectedCount} selected)`}
            className={`p-2 rounded-[4px] border transition relative ${
              activeTab === 'files'
                ? 'bg-[#1b3449] border-[#295679] text-[#60cdff]'
                : 'bg-[#2d2d2d] border-[#3a3a3a] text-[#a0a0a0] hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            {selectedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#60cdff] text-black font-bold text-[9px] rounded-full flex items-center justify-center">
                {selectedCount}
              </span>
            )}
          </button>
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Search Workspace & Commands (Ctrl+K)"
              className="p-2 text-[#a0a0a0] hover:text-white hover:bg-[#2c2c2c] rounded-[4px] transition"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onNewChat}
            title="New Chat (Ctrl+N)"
            className="p-2 bg-[#2d2d2d] hover:bg-[#383838] text-white rounded-[4px] border border-[#3a3a3a] transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Dedicated Bottom-Left Settings Spot (Collapsed) */}
        <div className="w-full flex justify-center pb-1">
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 text-[#999999] hover:text-white hover:bg-[#2c2c2c] rounded-[4px] transition relative"
          >
            <SettingsIcon className="w-4 h-4 text-[#60cdff]" />
            {!isAnonymous && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#58d68d] absolute top-1.5 right-1.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  const pinnedSessions = sessions.filter(s => s.isPinned);
  const recentSessions = sessions.filter(s => !s.isPinned);

  return (
    <aside className="w-64 bg-[#1c1c1c] border-r border-[#2e2e2e] flex flex-col h-full flex-shrink-0 select-none z-20 font-sans">
      {/* Top Header & Navigation Switcher */}
      <div className="p-2 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsOpen(false)}
            title="Collapse Pane"
            className="p-1.5 text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] rounded-[4px] transition"
          >
            <Menu className="w-4 h-4" />
          </button>
          
          {/* Tab Switcher: Files vs Chats */}
          <div className="flex bg-[#242424] p-0.5 rounded-[4px] border border-[#333333] text-xs">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                activeTab === 'files'
                  ? 'bg-[#2b2b2b] text-[#60cdff] font-medium shadow-sm'
                  : 'text-[#909090] hover:text-white'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span>Explorer</span>
              {selectedCount > 0 && (
                <span className="text-[10px] bg-[#1a3850] px-1 rounded text-[#60cdff] font-mono">
                  {selectedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                activeTab === 'chats'
                  ? 'bg-[#2b2b2b] text-white font-medium shadow-sm'
                  : 'text-[#909090] hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Chats</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Search Workspace & Commands (Ctrl+K)"
              className="p-1.5 text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] rounded-[4px] border border-transparent hover:border-[#383838] transition"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onNewChat}
            title="New Conversation (Ctrl+N)"
            className="p-1.5 bg-[#282828] hover:bg-[#333333] active:bg-[#202020] text-white rounded-[4px] border border-[#383838] transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#60cdff]" />
          </button>
        </div>
      </div>

      {/* TAB 1: FILE EXPLORER TREE VIEW */}
      {activeTab === 'files' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-2.5 py-1.5 border-b border-[#262626] flex items-center justify-between text-xs text-[#8c8c8c]">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#757575]">
              Project Scope ({workspaceFiles.length})
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleSyncLocalDisk}
                disabled={isSyncingDisk}
                title="Sync from real local disk (/api/fs)"
                className="p-1 hover:text-white hover:bg-[#282828] rounded-[3px] transition flex items-center space-x-1 text-[11px] text-[#60cdff]"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingDisk ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>

              <button
                onClick={handlePickFolder}
                title="Open local folder from computer..."
                className="p-1 hover:text-white hover:bg-[#282828] rounded-[3px] transition flex items-center space-x-1 text-[11px] text-[#ffb86c]"
              >
                <FolderOpen className="w-3 h-3" />
              </button>

              <input
                type="file"
                ref={fileUploadInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileUploadInputRef.current?.click()}
                title="Add local files to project"
                className="p-1 hover:text-white hover:bg-[#282828] rounded-[3px] transition flex items-center space-x-1 text-[11px]"
              >
                <Upload className="w-3 h-3 text-[#aaaaaa]" />
              </button>

              <button
                onClick={() => onSelectAllFiles(selectedCount < workspaceFiles.length)}
                title={selectedCount === workspaceFiles.length ? 'Deselect all' : 'Select all files for Gemini context'}
                className="p-1 hover:text-white hover:bg-[#282828] rounded-[3px] transition text-[11px] text-[#888888]"
              >
                {selectedCount === workspaceFiles.length ? 'None' : 'All'}
              </button>
            </div>
          </div>

          <div className="px-2.5 py-1 bg-[#192633]/60 border-b border-[#25405a]/60 flex items-center justify-between text-[11px] text-[#89b3d9]">
            <span className="truncate">
              {selectedCount === 0 
                ? 'Check files to feed into Co-work context'
                : `${selectedCount} file${selectedCount > 1 ? 's' : ''} active in Co-work context`}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {Object.entries(fileTree).map(([folderPath, files]) => {
              if (folderPath === '') {
                return files.map(file => (
                  <FileTreeRow
                    key={file.id}
                    file={file}
                    onToggleSelect={() => onToggleFileSelection(file.id)}
                    onOpenCanvas={() => onOpenFileInCanvas(file)}
                    getFileIcon={getFileIcon}
                  />
                ));
              }

              const isExpanded = expandedFolders[folderPath] !== false;

              return (
                <div key={folderPath} className="space-y-0.5">
                  <div
                    onClick={() => toggleFolder(folderPath)}
                    className="flex items-center justify-between px-1.5 py-1 rounded-[3px] hover:bg-[#242424] cursor-pointer text-xs text-[#a0a0a0] hover:text-white transition group"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-[#707070]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[#707070]" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="w-3.5 h-3.5 text-[#ffb86c]" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-[#ffb86c]" />
                      )}
                      <span className="font-mono text-[11px] text-[#cccccc]">{folderPath}</span>
                    </div>
                    <span className="text-[10px] text-[#606060] font-mono group-hover:text-[#909090]">
                      {files.length}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 space-y-0.5 border-l border-[#292929] ml-2">
                      {files.map(file => (
                        <FileTreeRow
                          key={file.id}
                          file={file}
                          onToggleSelect={() => onToggleFileSelection(file.id)}
                          onOpenCanvas={() => onOpenFileInCanvas(file)}
                          getFileIcon={getFileIcon}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB 2: CHATS & SESSIONS */
        <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-3">
          {pinnedSessions.length > 0 && (
            <div>
              <div className="flex items-center space-x-1 px-2 py-1 text-[10px] font-semibold text-[#787878] tracking-wider uppercase">
                <Pin className="w-2.5 h-2.5 text-[#e0a544]" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {pinnedSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    onSelect={() => onSelectSession(session.id)}
                    onDelete={() => onDeleteSession(session.id)}
                    onTogglePin={() => onTogglePinSession(session.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="px-2 py-1 text-[10px] font-semibold text-[#787878] tracking-wider uppercase">
              <span>Conversations</span>
            </div>
            <div className="space-y-0.5 mt-0.5">
              {recentSessions.length === 0 && (
                <div className="px-2 py-3 text-xs text-[#666666] italic text-center">No history yet</div>
              )}
              {recentSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => onSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                  onTogglePin={() => onTogglePinSession(session.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED BOTTOM-LEFT SETTINGS & ACCOUNT SPOT */}
      <div className="h-10 border-t border-[#2a2a2a] bg-[#191919] px-2 flex items-center justify-between text-xs">
        <button
          onClick={onOpenSettings}
          title={currentUser && !isAnonymous ? `Settings (${currentUser.email || currentUser.displayName})` : 'Open Settings'}
          className="flex items-center space-x-2 px-2 py-1.5 w-full rounded-[4px] hover:bg-[#252525] text-[#cccccc] hover:text-white transition overflow-hidden"
        >
          {currentUser && !isAnonymous ? (
            <>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#1b3449] border border-[#275374] flex items-center justify-center text-[9px] text-[#60cdff] font-bold flex-shrink-0">
                  {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium text-xs text-[#e0e0e0] truncate flex-1 text-left" title={currentUser.email || ''}>
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#58d68d] flex-shrink-0" title="Google Account Connected" />
            </>
          ) : (
            <>
              <SettingsIcon className="w-4 h-4 text-[#60cdff]" />
              <span className="font-medium text-xs">Settings</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

interface FileTreeRowProps {
  file: WorkspaceFile;
  onToggleSelect: () => void;
  onOpenCanvas: () => void;
  getFileIcon: (ext: string) => React.ReactNode;
}

const FileTreeRow: React.FC<FileTreeRowProps> = ({
  file,
  onToggleSelect,
  onOpenCanvas,
  getFileIcon
}) => {
  return (
    <div
      className={`group flex items-center justify-between px-1.5 py-1 rounded-[3px] text-xs cursor-pointer transition ${
        file.isSelected
          ? 'bg-[#1b2f3e]/70 text-[#f0f0f0] border-l-2 border-l-[#60cdff]'
          : 'text-[#a5a5a5] hover:bg-[#252525] hover:text-[#e0e0e0]'
      }`}
    >
      <div className="flex items-center space-x-2 truncate mr-1 flex-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          title={file.isSelected ? 'Exclude from context' : 'Include in Co-work context'}
          className="text-[#606060] hover:text-[#60cdff] p-0.5"
        >
          {file.isSelected ? (
            <CheckSquare className="w-3 h-3 text-[#60cdff]" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        {getFileIcon(file.extension)}
        <span
          onClick={onOpenCanvas}
          title={`Click to view/open ${file.name} in Canvas`}
          className="truncate font-mono text-[11px] hover:text-white hover:underline flex-1"
        >
          {file.name}
        </span>
      </div>

      <button
        onClick={onOpenCanvas}
        title="Open in Canvas Workspace"
        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#888888] hover:text-[#60cdff] transition"
      >
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
  onTogglePin
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2 py-1.5 rounded-[4px] text-xs cursor-pointer transition ${
        isActive
          ? 'bg-[#292929] text-white font-normal'
          : 'text-[#a5a5a5] hover:bg-[#252525] hover:text-[#e0e0e0]'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#60cdff] rounded-r"></span>
      )}

      <div className="flex items-center space-x-2 truncate mr-1 pl-1">
        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#60cdff]' : 'text-[#707070]'}`} />
        <span className="truncate text-[11px]">{session.title || 'Untitled Session'}</span>
      </div>

      <div className="hidden group-hover:flex items-center space-x-1 opacity-90 pr-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          title={session.isPinned ? 'Unpin' : 'Pin'}
          className="p-1 hover:text-[#e0a544] transition"
        >
          <Pin className={`w-3 h-3 ${session.isPinned ? 'text-[#e0a544] fill-[#e0a544]' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
          className="p-1 hover:text-[#e81123] transition"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
