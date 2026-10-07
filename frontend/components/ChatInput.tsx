import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Paperclip, 
  Mic, 
  Globe, 
  Image as ImageIcon, 
  X, 
  Monitor, 
  LayoutTemplate, 
  BookOpen, 
  Headphones, 
  MessageSquare, 
  Microscope, 
  Code2,
  ChevronDown, 
  Check 
} from 'lucide-react';
import { Attachment, ModelType, OutputMode, AIProvider, AppSettings } from '../types';
import { getProviderModelList } from '../services/geminiService';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  model: ModelType;
  setModel: (m: ModelType) => void;
  enableGrounding: boolean;
  setEnableGrounding: (v: boolean) => void;
  outputMode: OutputMode;
  setOutputMode: (mode: OutputMode) => void;
  onOpenVoice: () => void;
  currentProvider?: AIProvider;
  settings?: AppSettings;
}

const OUTPUT_MODE_OPTIONS: {
  id: OutputMode;
  label: string;
  desc: string;
  model: ModelType;
  needsGrounding?: boolean;
}[] = [
  {
    id: 'architect',
    label: 'Code Architect',
    desc: 'System architecture, project refactoring & module design',
    model: 'gemini-3.8-flash'
  },
  {
    id: 'canvas',
    label: 'Canvas Co-work',
    desc: 'Live interactive workspace for code, UI & documents',
    model: 'gemini-3.8-flash'
  },
  {
    id: 'research',
    label: 'Deep Research',
    desc: 'Multi-step web investigation, verification & dossier',
    model: 'gemini-3.7-flash',
    needsGrounding: true
  },
  {
    id: 'notebook',
    label: 'NotebookLM Guide',
    desc: 'Structured study briefs, key insights & FAQs',
    model: 'gemini-3.7-flash'
  },
  {
    id: 'audio',
    label: 'Audio Podcast',
    desc: 'Two-host conversational spoken overview',
    model: 'gemini-3.7-flash'
  },
  {
    id: 'image',
    label: 'Image Studio',
    desc: 'High-fidelity visual generation with Gemini Image',
    model: 'gemini-3.1-flash-image'
  },
  {
    id: 'chat',
    label: 'Standard Chat',
    desc: 'Conversational chat response',
    model: 'gemini-3.8-flash'
  }
];

export const MODEL_OPTIONS: { id: ModelType; label: string; badge: string }[] = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', badge: 'Flagship Agent' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', badge: 'Thinking & Code' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', badge: 'Multimodal' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', badge: 'High Throughput' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', badge: 'Frontier Reasoning' },
  { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Image', badge: 'Nano Banana 2' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: 'Legacy Pro' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Legacy Flash' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  model,
  setModel,
  enableGrounding,
  setEnableGrounding,
  outputMode,
  setOutputMode,
  onOpenVoice,
  currentProvider,
  settings
}) => {
  const availableModels = getProviderModelList(currentProvider || 'gemini', settings);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setIsModeMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          const newAtt: Attachment = {
            id: 'att-' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: result,
          };
          setAttachments((prev) => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCaptureScreenContext = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#202020');
      grad.addColorStop(1, '#111827');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#60cdff';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('Windows Desktop Window Snapshot', 40, 60);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(`Active Process Context • ${new Date().toLocaleTimeString()}`, 40, 95);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 120, 560, 180);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('[Code Editor Buffer + Terminal Context Attached]', 60, 155);
    }
    const dataUrl = canvas.toDataURL('image/png');
    const screenAtt: Attachment = {
      id: 'screen-' + Date.now(),
      name: 'Windows Window Snapshot.png',
      mimeType: 'image/png',
      dataUrl,
    };
    setAttachments((prev) => [...prev, screenAtt]);
  };

  const selectMode = (opt: typeof OUTPUT_MODE_OPTIONS[0]) => {
    setOutputMode(opt.id);
    if (!currentProvider || currentProvider === 'gemini') {
      setModel(opt.model);
    }
    if (opt.needsGrounding) {
      setEnableGrounding(true);
    }
    setIsModeMenuOpen(false);
  };

  const renderModeIcon = (mode: OutputMode, className = "w-3.5 h-3.5") => {
    switch (mode) {
      case 'architect':
        return <Code2 className={`${className} text-[#60cdff]`} />;
      case 'canvas':
        return <LayoutTemplate className={`${className} text-[#60cdff]`} />;
      case 'research':
        return <Microscope className={`${className} text-[#58d68d]`} />;
      case 'notebook':
        return <BookOpen className={`${className} text-[#bb86fc]`} />;
      case 'audio':
        return <Headphones className={`${className} text-[#ff79c6]`} />;
      case 'image':
        return <ImageIcon className={`${className} text-[#ffb86c]`} />;
      default:
        return <MessageSquare className={`${className} text-[#cccccc]`} />;
    }
  };

  const getModeLabel = (mode: OutputMode) => {
    return OUTPUT_MODE_OPTIONS.find((o) => o.id === mode)?.label || 'Chat';
  };

  const getPlaceholderText = () => {
    switch (outputMode) {
      case 'architect':
        return 'Ask Code Architect to analyze project files, refactor, or design modules...';
      case 'canvas':
        return 'Describe web app, React component, or document to co-work in Canvas...';
      case 'research':
        return 'Ask a research question or topic for Gemini Deep Research...';
      case 'notebook':
        return 'Enter topic for NotebookLM study guide, key takeaways, and FAQ...';
      case 'audio':
        return 'Topic for two AI co-hosts to discuss in an Audio Overview podcast...';
      case 'image':
        return 'Describe a visual scene to render in Image Studio...';
      default:
        return enableGrounding
          ? 'Ask Gemini anything (Google Search Grounding active)...'
          : 'Ask Gemini Co-work (Type a question or press Ctrl+K)...';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-3 pt-1 flex-shrink-0 font-sans">
      {/* Self-contained Minimalist Communication Block */}
      <div className={`relative bg-[#222222] hover:bg-[#252525] focus-within:bg-[#1f1f1f] border rounded-[6px] p-2 transition-all shadow-sm ${
        outputMode === 'research'
          ? 'border-[#276e4c] focus-within:border-[#58d68d]'
          : outputMode === 'architect'
          ? 'border-[#1e527a] focus-within:border-[#60cdff]'
          : 'border-[#383838] focus-within:border-[#60cdff]'
      }`}>
        
        {/* Attachments preview embedded inside communication block */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 pb-1.5 border-b border-[#2e2e2e]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1.5 bg-[#181818] border border-[#383838] rounded-[4px] px-2 py-0.5 text-xs text-[#dddddd]"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img src={att.dataUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                ) : (
                  <Paperclip className="w-3 h-3 text-[#60cdff]" />
                )}
                <span className="truncate max-w-[130px] text-[11px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-[#888888] hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          rows={1}
          className="w-full bg-transparent text-xs text-[#f1f1f1] placeholder-[#707070] focus:outline-none resize-none px-1 py-1 max-h-40 leading-relaxed font-sans"
        />

        {/* Integrated Communications Toolbar */}
        <div className="flex items-center justify-between pt-1.5 border-t border-[#2a2a2a] mt-1 select-none">
          {/* Left: Mode Picker Dropdown + File/Screen/Grounding Tools */}
          <div className="flex items-center space-x-1.5">
            {/* Embedded Output Mode Selector Pill & Flyout Menu */}
            <div className="relative" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                title="Select Output Mode"
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-[4px] border text-[11px] transition ${
                  outputMode === 'architect'
                    ? 'bg-[#142d42] border-[#1e527a] text-[#60cdff] hover:bg-[#1a3854]'
                    : outputMode === 'canvas'
                    ? 'bg-[#192f42] border-[#255275] text-[#60cdff] hover:bg-[#1e3c54]'
                    : outputMode === 'research'
                    ? 'bg-[#1b3426] border-[#276e4c] text-[#58d68d] hover:bg-[#204230]'
                    : outputMode === 'notebook'
                    ? 'bg-[#2b1f3d] border-[#4b336d] text-[#bb86fc] hover:bg-[#34244a]'
                    : outputMode === 'audio'
                    ? 'bg-[#361a2c] border-[#63294f] text-[#ff79c6] hover:bg-[#421e36]'
                    : outputMode === 'image'
                    ? 'bg-[#332213] border-[#5d3c1a] text-[#ffb86c] hover:bg-[#3e2815]'
                    : 'bg-[#2b2b2b] border-[#383838] text-[#cccccc] hover:bg-[#323232]'
                }`}
              >
                {renderModeIcon(outputMode)}
                <span className="font-medium">{getModeLabel(outputMode)}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Windows 11 Fluent Flyout Popover */}
              {isModeMenuOpen && (
                <div className="absolute bottom-full left-0 mb-1.5 w-64 bg-[#232323] border border-[#383838] rounded-[6px] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-[#808080] tracking-wider uppercase border-b border-[#2d2d2d] mb-1">
                    Select Output Mode
                  </div>
                  <div className="space-y-0.5 px-1">
                    {OUTPUT_MODE_OPTIONS.map((opt) => {
                      const isSelected = outputMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => selectMode(opt)}
                          className={`w-full flex items-start space-x-2 px-2 py-1.5 rounded-[4px] text-left transition ${
                            isSelected
                              ? 'bg-[#2c2c2c] text-white'
                              : 'text-[#b0b0b0] hover:bg-[#2a2a2a] hover:text-[#f0f0f0]'
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {renderModeIcon(opt.id, "w-3.5 h-3.5")}
                          </div>
                          <div className="flex-1 truncate">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{opt.label}</span>
                              {isSelected && <Check className="w-3 h-3 text-[#60cdff]" />}
                            </div>
                            <p className="text-[10px] text-[#787878] leading-tight truncate">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Model Selector Dropdown */}
            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center space-x-1.5 px-2 py-1 bg-[#282828] hover:bg-[#303030] border border-[#3c3c3c] rounded-[4px] text-xs text-[#d0d0d0] hover:text-white transition"
              >
                <span className="font-medium text-[11px] truncate max-w-[120px]">
                  {availableModels.find(m => m.id === model)?.label || model}
                </span>
                <ChevronDown className="w-3 h-3 text-[#888888]" />
              </button>

              {isModelMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#232323] border border-[#3c3c3c] rounded-[6px] shadow-2xl p-1.5 z-50">
                  <div className="px-2 py-1 text-[10px] font-semibold text-[#808080] uppercase tracking-wider">
                    Select Model ({(currentProvider || 'gemini').toUpperCase()})
                  </div>
                  <div className="space-y-1">
                    {availableModels.map((opt) => {
                      const isSelected = model === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setModel(opt.id);
                            setIsModelMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] text-left transition ${
                            isSelected ? 'bg-[#1b3449] text-[#60cdff]' : 'hover:bg-[#2d2d2d] text-[#cccccc] hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-medium">{opt.label}</div>
                            <span className="text-[10px] text-[#808080] font-mono">{opt.badge}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#60cdff]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="h-3 w-[1px] bg-[#353535]" />

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.txt,.js,.ts,.tsx,.json,.py,.md,.csv"
              className="hidden"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach File"
              className="p-1 text-[#8c8c8c] hover:text-white hover:bg-[#2b2b2b] rounded-[4px] transition"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>

            {/* Screen Context Button */}
            <button
              type="button"
              onClick={handleCaptureScreenContext}
              title="Capture Active Window Context"
              className="p-1 text-[#8c8c8c] hover:text-[#60cdff] hover:bg-[#2b2b2b] rounded-[4px] transition"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            {/* Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableGrounding(!enableGrounding)}
              title={`Google Search Grounding: ${enableGrounding ? 'Active' : 'Disabled'}`}
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-[4px] text-[11px] transition ${
                enableGrounding
                  ? 'bg-[#1b3449] text-[#60cdff] border border-[#275374]'
                  : 'text-[#8c8c8c] hover:bg-[#2b2b2b]'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span className="hidden sm:inline">Web</span>
            </button>
          </div>

          {/* Right: Dedicated Live Voice Co-work Button + Send Button */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenVoice}
              title="Start Bidirectional Real-time Gemini Live Voice"
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-gradient-to-r from-[#38204d] to-[#1a3250] hover:from-[#4c2b69] hover:to-[#22446d] text-[#e0b0ff] hover:text-white rounded-[4px] border border-[#7b42bc]/40 transition text-xs font-medium shadow-sm group"
            >
              <Mic className="w-3.5 h-3.5 text-[#bb86fc] group-hover:scale-110 transition-transform" />
              <span>Live Voice</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#58d68d] animate-pulse" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!text.trim() && attachments.length === 0) || isLoading}
              className={`px-3 py-1 rounded-[4px] transition flex items-center space-x-1 text-xs ${
                (text.trim() || attachments.length > 0) && !isLoading
                  ? outputMode === 'research'
                    ? 'bg-[#1b5e3f] hover:bg-[#237750] text-white border border-[#2c885c]'
                    : 'bg-[#0078d4] hover:bg-[#106ebe] text-white border border-[#2886ce]'
                  : 'bg-[#2a2a2a] text-[#555555] border border-[#333333] cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-[#888888] border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-[11px] font-normal">Send</span>
                  <ArrowUp className="w-3 h-3 stroke-[2]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-1 text-[10px] text-[#666666]">
        Gemini Co-work • Enter to send • Shift+Enter for newline
      </div>
    </div>
  );
};
