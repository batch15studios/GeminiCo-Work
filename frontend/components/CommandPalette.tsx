import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Globe, 
  Image as ImageIcon, 
  Layers, 
  X,
  Mic
} from 'lucide-react';
import { ChatSession, Gem, ModelType } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  setModel: (m: ModelType) => void;
  setEnableGrounding: (v: boolean) => void;
  onOpenGems: () => void;
  onOpenVoice: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewChat,
  setModel,
  setEnableGrounding,
  onOpenGems,
  onOpenVoice
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-[#1e1f20] border border-[#3c4043] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#282a2c]">
          <Search className="w-5 h-5 text-neutral-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search past chats..."
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="space-y-1 mt-1">
              <button
                onClick={() => { onNewChat(); onClose(); }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-[#282a2c] hover:text-white transition text-left"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                <span className="font-medium">Create New Chat</span>
              </button>

              <button
                onClick={() => { setModel('gemini-3.1-flash-image'); onClose(); }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-[#282a2c] hover:text-white transition text-left"
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Switch to Image Generation Studio</span>
              </button>

              <button
                onClick={() => { setEnableGrounding(true); onClose(); }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-[#282a2c] hover:text-white transition text-left"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Enable Google Web Search Grounding</span>
              </button>

              <button
                onClick={() => { onOpenVoice(); onClose(); }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-[#282a2c] hover:text-white transition text-left"
              >
                <Mic className="w-4 h-4 text-pink-400" />
                <span>Open Gemini Live Voice Mode</span>
              </button>

              <button
                onClick={() => { onOpenGems(); onClose(); }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-[#282a2c] hover:text-white transition text-left"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Manage Custom Gems & Instructions</span>
              </button>
            </div>
          </div>

          {/* Past Chats */}
          {filteredSessions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Chats
              </div>
              <div className="space-y-1 mt-1">
                {filteredSessions.slice(0, 5).map(session => (
                  <button
                    key={session.id}
                    onClick={() => { onSelectSession(session.id); onClose(); }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-[#282a2c] hover:text-white transition text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-neutral-500" />
                    <span className="truncate flex-1">{session.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#282a2c] bg-[#1a1b1c] flex items-center justify-between text-[11px] text-neutral-500">
          <span>Navigation: Esc to exit</span>
          <span>Gemini Desktop Quick Navigation</span>
        </div>
      </div>
    </div>
  );
};
