import React, { useState } from 'react';
import { 
  Search, 
  LayoutTemplate, 
  Minus, 
  Square, 
  Copy as RestoreIcon, 
  X, 
  FileCode2 
} from 'lucide-react';
import { CanvasArtifact, OutputMode } from '../types';

interface TitleBarProps {
  outputMode: OutputMode;
  onOpenCommandPalette: () => void;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  activeArtifact?: CanvasArtifact;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  outputMode,
  onOpenCommandPalette,
  isCanvasOpen,
  onToggleCanvas,
  activeArtifact
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="h-9 bg-[#202020] border-b border-[#303030] flex items-center justify-between select-none flex-shrink-0 z-30 pl-3">
      {/* Native Windows 11 App Title */}
      <div className="flex items-center space-x-2 min-w-[160px]">
        <img src="/app-icon.png" alt="Gemini Co-work" className="w-4 h-4 rounded-[3px] object-contain" />
        <span className="font-semibold text-white text-xs tracking-normal">Gemini Co-work</span>
      </div>

      {/* Center Search Pill */}
      <div className="flex items-center justify-center flex-1 max-w-sm mx-2">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-2.5 py-1 bg-[#282828] hover:bg-[#2f2f2f] active:bg-[#252525] border border-[#3c3c3c] rounded-[4px] text-xs text-[#a0a0a0] hover:text-[#e0e0e0] transition-colors"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="w-3 h-3 text-[#888888]" />
            <span className="truncate text-[11px]">Search commands, files, or past chats...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-[#1c1c1c] px-1.5 py-0.2 rounded border border-[#383838] text-[#8e8e8e]">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Window Controls: Optional Canvas Toggle & Caption Buttons (Settings removed from top bar) */}
      <div className="flex items-center h-full">
        {/* Canvas Split Button - ONLY rendered when canvas output mode is selected */}
        {outputMode === 'canvas' && (
          <button
            onClick={onToggleCanvas}
            title={isCanvasOpen ? 'Hide Canvas' : 'Show Canvas'}
            className={`flex items-center space-x-1.5 text-[11px] px-2 py-0.5 rounded-[4px] border transition mr-2 ${
              isCanvasOpen
                ? 'bg-[#1b3a53] border-[#2d5f87] text-[#60cdff] font-medium'
                : 'bg-[#282828] border-[#383838] text-[#b0b0b0] hover:text-white'
            }`}
          >
            <LayoutTemplate className="w-3 h-3 text-[#60cdff]" />
            <span>Canvas</span>
            {activeArtifact && <span className="w-1.5 h-1.5 rounded-full bg-[#60cdff]"></span>}
          </button>
        )}

        {/* Windows 11 Caption Buttons */}
        <div className="flex items-center h-full">
          <button
            title="Minimize"
            className="w-11 h-full flex items-center justify-center text-[#cccccc] hover:bg-[#333333] active:bg-[#2a2a2a] transition-colors"
          >
            <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          <button
            onClick={toggleMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="w-11 h-full flex items-center justify-center text-[#cccccc] hover:bg-[#333333] active:bg-[#2a2a2a] transition-colors"
          >
            {isMaximized ? (
              <RestoreIcon className="w-3 h-3 stroke-[1.5]" />
            ) : (
              <Square className="w-3 h-3 stroke-[1.5]" />
            )}
          </button>

          <button
            onClick={() => window.close()}
            title="Close"
            className="w-11 h-full flex items-center justify-center text-[#cccccc] hover:bg-[#e81123] hover:text-white active:bg-[#bf0f1d] transition-colors"
          >
            <X className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
