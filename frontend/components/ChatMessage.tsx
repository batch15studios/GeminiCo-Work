import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Globe, 
  Volume2, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  Code2, 
  BrainCircuit, 
  LayoutTemplate, 
  BookOpen, 
  Compass, 
  ArrowRight,
  FolderTree,
  FileCode2,
  Zap,
  Server
} from 'lucide-react';
import { CanvasArtifact, Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onOpenInCanvas?: (code?: string, language?: string) => void;
  onOpenNotebook?: (artifact: CanvasArtifact) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRegenerate,
  onOpenInCanvas,
  onOpenNotebook
}) => {
  const isModel = message.role === 'model';
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.'));
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`py-3 px-4 sm:px-6 transition flex flex-col font-sans ${
      isModel 
        ? 'bg-transparent' 
        : 'bg-[#232323] rounded-[6px] mx-2 sm:mx-8 my-1.5 border border-[#333333]'
    }`}>
      <div className="max-w-3xl w-full mx-auto flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isModel ? (
            <div className="w-6 h-6 rounded-[3px] bg-[#1a3850] border border-[#2b5d84] flex items-center justify-center shadow-sm">
              <FileCode2 className="w-3.5 h-3.5 text-[#60cdff]" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-[3px] bg-[#333333] border border-[#444444] flex items-center justify-center text-[10px] font-medium text-[#dddddd]">
              You
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header Role */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#e1e1e1]">
              {isModel ? 'Gemini Co-work' : 'You'}
            </span>
            <span className="text-[11px] text-[#787878]">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Mode Tag */}
            {message.outputMode && message.outputMode !== 'chat' && (
              <span className="text-[10px] font-mono bg-[#1f3040] text-[#60cdff] px-1.5 py-0.2 rounded border border-[#2b4c66]">
                {message.outputMode.toUpperCase()}
              </span>
            )}

            {/* Reasoning Time */}
            {isModel && message.thinkingTimeSec && (
              <div className="flex items-center space-x-1 text-[10px] bg-[#222222] text-[#909090] px-1.5 py-0.2 rounded border border-[#333333]">
                <BrainCircuit className="w-2.5 h-2.5 text-[#60cdff]" />
                <span>{message.thinkingTimeSec.toFixed(1)}s</span>
              </div>
            )}
          </div>

          {/* Context Indicators: Project Files, Skills, MCP Servers */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {message.referencedFiles && message.referencedFiles.length > 0 && (
              <div className="flex items-center space-x-1.5 text-[11px] text-[#8ea8be] bg-[#1a2835]/60 px-2 py-0.5 rounded-[3px] border border-[#25425a]">
                <FolderTree className="w-3 h-3 text-[#60cdff]" />
                <span>Files:</span>
                <span className="font-mono text-[#60cdff]">{message.referencedFiles.join(', ')}</span>
              </div>
            )}

            {message.invokedSkills && message.invokedSkills.length > 0 && (
              <div className="flex items-center space-x-1 text-[11px] text-[#58d68d] bg-[#16291e] px-2 py-0.5 rounded-[3px] border border-[#276e4c]">
                <Zap className="w-3 h-3" />
                <span>Skills: {message.invokedSkills.join(', ')}</span>
              </div>
            )}

            {message.invokedMcpTools && message.invokedMcpTools.length > 0 && (
              <div className="flex items-center space-x-1 text-[11px] text-[#ffb86c] bg-[#2b2114] px-2 py-0.5 rounded-[3px] border border-[#5d411f]">
                <Server className="w-3 h-3" />
                <span>MCP: {message.invokedMcpTools.length} tools</span>
              </div>
            )}
          </div>

          {/* User Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {message.attachments.map((att) => (
                <div key={att.id} className="relative group rounded-[4px] overflow-hidden border border-[#383838] bg-[#1f1f1f]">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={att.dataUrl} alt={att.name} className="h-24 w-32 object-cover" />
                  ) : (
                    <div className="h-16 w-28 flex flex-col justify-center items-center p-2 text-xs text-[#cccccc]">
                      <Code2 className="w-5 h-5 text-[#60cdff] mb-1" />
                      <span className="truncate w-full text-center text-[10px]">{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Artifact Card Trigger */}
          {message.artifactSnapshot && (
            <div className="p-3 my-2 bg-[#20272f] border border-[#2d475f] rounded-[6px] flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5 truncate mr-2">
                <div className="p-1.5 rounded-[4px] bg-[#1c3246] text-[#60cdff] border border-[#294c6d]">
                  {message.artifactSnapshot.type === 'research-report' ? (
                    <Compass className="w-4 h-4 text-[#58d68d]" />
                  ) : message.artifactSnapshot.type === 'notebook' || message.artifactSnapshot.type === 'audio-brief' ? (
                    <BookOpen className="w-4 h-4 text-[#bb86fc]" />
                  ) : (
                    <LayoutTemplate className="w-4 h-4 text-[#60cdff]" />
                  )}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-white truncate">{message.artifactSnapshot.title}</h4>
                  <p className="text-[11px] text-[#90a2b2] truncate">
                    {message.artifactSnapshot.type === 'research-report'
                      ? 'Empirical Deep Research Dossier & Sources'
                      : message.artifactSnapshot.type === 'notebook'
                      ? 'NotebookLM Research Package with Audio Overview'
                      : 'Interactive Canvas Workspace Artifact'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onOpenNotebook && (message.artifactSnapshot?.type === 'notebook' || message.artifactSnapshot?.type === 'audio-brief' || message.artifactSnapshot?.type === 'research-report')) {
                    onOpenNotebook(message.artifactSnapshot);
                  } else if (onOpenInCanvas) {
                    onOpenInCanvas(message.artifactSnapshot?.content, message.artifactSnapshot?.language);
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#264a68] hover:bg-[#2d587c] active:bg-[#1e3c54] text-white rounded-[4px] text-xs font-medium border border-[#3b6d97] transition"
              >
                <span>Open in Canvas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Generated Image Output */}
          {message.generatedImageUrl && (
            <div className="pt-1 pb-2">
              <div className="relative group max-w-md rounded-[6px] overflow-hidden border border-[#383838] bg-black">
                <img
                  src={message.generatedImageUrl}
                  alt="Generated visual"
                  className="w-full h-auto object-cover rounded-[6px]"
                />
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                  <a
                    href={message.generatedImageUrl}
                    download="gemini-cowork-image.png"
                    className="px-2.5 py-1 bg-[#202020]/90 hover:bg-[#303030] text-white rounded-[4px] text-xs border border-[#444444]"
                  >
                    Save Image
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Message Text Render */}
          <div className="text-xs text-[#dddddd] leading-relaxed select-text">
            <RichFormattedContent 
              content={message.content} 
              onOpenInCanvas={onOpenInCanvas} 
            />
          </div>

          {/* Grounding Sources */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="pt-2 border-t border-[#2e2e2e] mt-2">
              <div className="flex items-center space-x-1.5 text-[11px] text-[#8e8e8e] mb-1.5">
                <Globe className="w-3 h-3 text-[#60cdff]" />
                <span>Verified Sources ({message.groundingSources.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.groundingSources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 bg-[#252525] hover:bg-[#2e2e2e] text-[#cccccc] hover:text-[#60cdff] border border-[#383838] px-2 py-0.5 rounded-[4px] text-[11px] transition"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#1b3449] text-[#60cdff] flex items-center justify-center text-[9px] font-bold">
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[150px]">{source.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Compact Actions Bar */}
          {isModel && (
            <div className="flex items-center space-x-1 pt-1 text-[#888888] text-xs">
              <button
                onClick={handleCopy}
                className="p-1 hover:text-[#e0e0e0] hover:bg-[#282828] rounded-[4px] transition"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#58d68d]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSpeak}
                className={`p-1 hover:text-[#e0e0e0] hover:bg-[#282828] rounded-[4px] transition ${
                  isPlayingAudio ? 'text-[#60cdff]' : ''
                }`}
                title="Read aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 hover:text-[#e0e0e0] hover:bg-[#282828] rounded-[4px] transition"
                  title="Regenerate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="h-3 w-[1px] bg-[#333333] mx-1" />

              <button
                onClick={() => setLiked(liked === true ? null : true)}
                className={`p-1 hover:text-[#e0e0e0] hover:bg-[#282828] rounded-[4px] transition ${
                  liked === true ? 'text-[#60cdff]' : ''
                }`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setLiked(liked === false ? null : false)}
                className={`p-1 hover:text-[#e0e0e0] hover:bg-[#282828] rounded-[4px] transition ${
                  liked === false ? 'text-[#e81123]' : ''
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RichFormattedContent: React.FC<{ 
  content: string;
  onOpenInCanvas?: (code?: string, language?: string) => void;
}> = ({ content, onOpenInCanvas }) => {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <MarkdownText key={`text-${lastIndex}`} text={content.substring(lastIndex, match.index)} />
      );
    }
    const lang = match[1] || 'code';
    const code = match[2];
    parts.push(
      <CodeSnippetBlock 
        key={`code-${match.index}`} 
        language={lang} 
        code={code} 
        onOpenInCanvas={onOpenInCanvas}
      />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<MarkdownText key={`text-${lastIndex}`} text={content.substring(lastIndex)} />);
  }

  return <div className="space-y-1.5">{parts}</div>;
};

const CodeSnippetBlock: React.FC<{ 
  language: string; 
  code: string;
  onOpenInCanvas?: (code: string, language: string) => void;
}> = ({ language, code, onOpenInCanvas }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-[4px] overflow-hidden border border-[#333333] bg-[#1a1a1a] font-mono text-[11px] shadow-sm">
      <div className="flex items-center justify-between px-3 py-1 bg-[#222222] border-b border-[#2e2e2e] text-[#8e8e8e] text-[11px]">
        <span className="font-mono text-[#b0b0b0] font-medium">{language || 'plaintext'}</span>
        <div className="flex items-center space-x-1.5">
          {onOpenInCanvas && (
            <button
              onClick={() => onOpenInCanvas(code, language)}
              className="flex items-center space-x-1 text-[#60cdff] hover:text-[#8ee0ff] transition px-1.5 py-0.5 rounded-[3px] hover:bg-[#2b2b2b]"
              title="Open in Canvas workspace"
            >
              <LayoutTemplate className="w-3 h-3" />
              <span>Canvas</span>
            </button>
          )}

          <button
            onClick={copyCode}
            className="flex items-center space-x-1 hover:text-white transition px-1.5 py-0.5 rounded-[3px] hover:bg-[#2b2b2b]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#58d68d]" />
                <span className="text-[#58d68d]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-3 overflow-x-auto text-[#e0e0e0] whitespace-pre leading-relaxed select-text">
        <code>{code}</code>
      </div>
    </div>
  );
};

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-semibold text-white pt-1.5 pb-0.5">
              {formatInline(trimmed.replace('### ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-base font-semibold text-white pt-2 pb-0.5">
              {formatInline(trimmed.replace('## ', ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-lg font-bold text-white pt-2 pb-1">
              {formatInline(trimmed.replace('# ', ''))}
            </h1>
          );
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2">
              <span className="text-[#60cdff] text-xs mt-0.5">•</span>
              <span>{formatInline(trimmed.substring(2))}</span>
            </div>
          );
        }
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        return <p key={idx}>{formatInline(line)}</p>;
      })}
    </div>
  );
};

function formatInline(str: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="bg-[#262626] text-[#70d2ff] font-mono text-[11px] px-1 py-0.2 rounded border border-[#383838]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts;
}
