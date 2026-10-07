import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Code2, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  Send, 
  Sparkles, 
  Headphones, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  FileText, 
  X, 
  Maximize2, 
  Minimize2,
  Radio,
  Microscope,
  Compass,
  ExternalLink,
  ShieldCheck,
  Search,
  Terminal,
  FolderOpen
} from 'lucide-react';
import { CanvasArtifact } from '../types';

interface CanvasWorkspaceProps {
  artifact: CanvasArtifact;
  onUpdateArtifact: (updated: CanvasArtifact) => void;
  onCoworkPrompt: (prompt: string) => void;
  isLoading: boolean;
  onClose: () => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  artifact,
  onUpdateArtifact,
  onCoworkPrompt,
  isLoading,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'notebook' | 'podcast' | 'research'>(() => {
    if (artifact.type === 'research-report') return 'research';
    if (artifact.type === 'notebook' || artifact.type === 'audio-brief') return 'notebook';
    return artifact.type === 'html' || artifact.type === 'react' ? 'preview' : 'code';
  });

  const [codeContent, setCodeContent] = useState(artifact.content);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [coworkInput, setCoworkInput] = useState('');

  // Audio Podcast state
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setCodeContent(artifact.content);
  }, [artifact.content, artifact.currentVersion]);

  const handleContentChange = (newVal: string) => {
    setCodeContent(newVal);
    onUpdateArtifact({
      ...artifact,
      content: newVal,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.type === 'html' ? 'html' : artifact.type === 'react' ? 'tsx' : 'md';
    const blob = new Blob([codeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendCowork = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!coworkInput.trim() || isLoading) return;
    onCoworkPrompt(coworkInput);
    setCoworkInput('');
  };

  // NotebookLM Podcast Audio Synthesis player
  const podcastSegments = artifact.notebookData?.podcastScript || [];

  const playSegment = (index: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (index >= podcastSegments.length) {
      setIsPlayingPodcast(false);
      setCurrentSegmentIndex(0);
      return;
    }

    const seg = podcastSegments[index];
    setCurrentSegmentIndex(index);

    const utter = new SpeechSynthesisUtterance(seg.text);
    const voices = window.speechSynthesis.getVoices();

    if (seg.speaker.includes('Alex')) {
      utter.pitch = 0.95;
      utter.rate = 1.05;
      const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('Google UK English Male'));
      if (maleVoice) utter.voice = maleVoice;
    } else {
      utter.pitch = 1.15;
      utter.rate = 1.02;
      const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Google US English'));
      if (femaleVoice) utter.voice = femaleVoice;
    }

    utter.onend = () => {
      playSegment(index + 1);
    };

    utter.onerror = () => {
      setIsPlayingPodcast(false);
    };

    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const togglePodcast = () => {
    if (isPlayingPodcast) {
      window.speechSynthesis?.cancel();
      setIsPlayingPodcast(false);
    } else {
      setIsPlayingPodcast(true);
      playSegment(currentSegmentIndex);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const getSanitizedPreviewHtml = () => {
    if (artifact.type === 'html') {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: "Segoe UI", system-ui, sans-serif; margin: 0; padding: 1.25rem; background: #181818; color: #f1f5f9; }
            </style>
          </head>
          <body>
            ${codeContent}
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: "Segoe UI", system-ui, sans-serif; background: #181818; color: #f1f5f9; padding: 1.5rem; }
            pre { background: #202020; border: 1px solid #333; padding: 1rem; border-radius: 4px; overflow-x: auto; font-family: "Cascadia Code", monospace; }
          </style>
        </head>
        <body>
          <div class="max-w-2xl mx-auto space-y-3">
            <div class="p-3 bg-blue-950/40 border border-blue-600/30 rounded">
              <h3 class="font-semibold text-blue-300 text-sm">✦ Gemini Canvas Preview</h3>
              <p class="text-xs text-blue-200/80 mt-0.5">Rendered component view. Inspect the Editor tab to edit source directly.</p>
            </div>
            <pre><code>${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
        </body>
      </html>
    `;
  };

  const lineCount = codeContent.split('\n').length;

  return (
    <div
      className={`bg-[#202020] border-l border-[#303030] flex flex-col transition-all duration-150 z-20 font-sans ${
        isFullScreen ? 'fixed inset-0 z-50' : 'w-full md:w-[48%] lg:w-[50%] h-full'
      }`}
    >
      {/* Windows 11 Document Header Tabstrip */}
      <div className="h-9 bg-[#1c1c1c] border-b border-[#2e2e2e] px-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {/* Active Document Tab */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-[#202020] border-t-2 border-t-[#60cdff] border-x border-[#303030] text-xs text-white rounded-t-[3px]">
            <span className="truncate max-w-[150px] font-medium text-[11px]">{artifact.title}</span>
            <span className="text-[10px] text-[#808080]">v{artifact.currentVersion}</span>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center space-x-0.5 ml-2">
            {artifact.researchData && (
              <button
                onClick={() => setActiveTab('research')}
                className={`px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                  activeTab === 'research'
                    ? 'bg-[#1b3d2f] text-[#58d68d] border border-[#276e4c]'
                    : 'text-[#909090] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Dossier
              </button>
            )}

            {(artifact.type === 'html' || artifact.type === 'react') && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                  activeTab === 'preview'
                    ? 'bg-[#292929] text-[#60cdff] border border-[#3a3a3a]'
                    : 'text-[#909090] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Preview
              </button>
            )}

            <button
              onClick={() => setActiveTab('code')}
              className={`px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                activeTab === 'code'
                  ? 'bg-[#292929] text-[#60cdff] border border-[#3a3a3a]'
                  : 'text-[#909090] hover:text-white hover:bg-[#252525]'
              }`}
            >
              Editor
            </button>

            {artifact.notebookData && (
              <button
                onClick={() => setActiveTab('notebook')}
                className={`px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                  activeTab === 'notebook'
                    ? 'bg-[#312547] text-[#bb86fc] border border-[#53397d]'
                    : 'text-[#909090] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Notebook
              </button>
            )}

            {artifact.notebookData?.podcastScript && artifact.notebookData.podcastScript.length > 0 && (
              <button
                onClick={() => setActiveTab('podcast')}
                className={`px-2 py-0.5 rounded-[3px] text-[11px] transition ${
                  activeTab === 'podcast'
                    ? 'bg-[#3d1d33] text-[#ff79c6] border border-[#6d2f5a]'
                    : 'text-[#909090] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Audio Brief
              </button>
            )}
          </div>
        </div>

        {/* Windows Right Tool Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopy}
            title="Copy buffer"
            className="p-1 text-[#8c8c8c] hover:text-white hover:bg-[#2c2c2c] rounded-[3px] transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#58d68d]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            title="Save file"
            className="p-1 text-[#8c8c8c] hover:text-white hover:bg-[#2c2c2c] rounded-[3px] transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Restore Window' : 'Maximize Window'}
            className="p-1 text-[#8c8c8c] hover:text-white hover:bg-[#2c2c2c] rounded-[3px] transition"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            title="Close Canvas (Ctrl+E)"
            className="p-1 text-[#8c8c8c] hover:text-white hover:bg-[#e81123] rounded-[3px] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-[#1c1c1c]">
        {/* TAB 0: DEEP RESEARCH DOSSIER */}
        {activeTab === 'research' && artifact.researchData && (
          <div className="w-full h-full overflow-y-auto p-5 space-y-4 bg-[#1a1a1a] text-[#dddddd] select-text">
            {/* Header Box */}
            <div className="p-4 rounded-[6px] bg-[#1e2621] border border-[#2b4c37]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#58d68d] uppercase tracking-wider">
                  <Microscope className="w-4 h-4" />
                  <span>Gemini Deep Research Dossier</span>
                </div>
                <span className="text-[10px] bg-[#193d2c] text-[#58d68d] px-2 py-0.5 rounded border border-[#2c6346]">
                  Cross-Verified
                </span>
              </div>
              <h1 className="text-base font-semibold text-white mb-1">{artifact.title}</h1>
              <p className="text-xs text-[#a8b8ae] leading-relaxed">
                {artifact.researchData.executiveSummary}
              </p>

              {/* Research Methodology Progress */}
              <div className="mt-3 pt-2.5 border-t border-[#2d4d38]">
                <div className="text-[10px] font-semibold text-[#58d68d] uppercase tracking-wider mb-1.5">
                  Investigation Pipeline
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {artifact.researchData.steps.map((st) => (
                    <div key={st.id} className="flex items-center space-x-2 text-xs text-[#d0d0d0] bg-[#141b16] p-1.5 rounded-[4px] border border-[#274632]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#58d68d]"></span>
                      <span className="truncate text-[11px]">{st.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Strategic Findings */}
            <div className="p-4 rounded-[6px] bg-[#222222] border border-[#303030] space-y-2">
              <h3 className="text-xs font-semibold text-[#58d68d] uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Executive Insights</span>
              </h3>
              <div className="space-y-1.5">
                {artifact.researchData.keyInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-[#cfcfcf]">
                    <span className="text-[#58d68d] font-bold mt-0.5">•</span>
                    <p className="leading-relaxed text-[11px]">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Report Content */}
            <div className="p-4 rounded-[6px] bg-[#222222] border border-[#303030] space-y-2">
              <h3 className="text-xs font-semibold text-[#cccccc] uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-[#60cdff]" />
                <span>Synthesis Paper</span>
              </h3>
              <div className="text-xs leading-relaxed text-[#cccccc] whitespace-pre-line font-sans">
                {artifact.content}
              </div>
            </div>

            {/* Grounded Bibliography & Citations */}
            {artifact.researchData.bibliography.length > 0 && (
              <div className="p-4 rounded-[6px] bg-[#222222] border border-[#303030] space-y-2">
                <h3 className="text-xs font-semibold text-[#cccccc] uppercase tracking-wider flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-[#60cdff]" />
                  <span>Citations & Verified Sources ({artifact.researchData.bibliography.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {artifact.researchData.bibliography.map((bib, idx) => (
                    <a
                      key={idx}
                      href={bib.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-[4px] bg-[#1a1a1a] hover:bg-[#282828] border border-[#353535] text-xs text-[#bbbbbb] hover:text-white transition"
                    >
                      <div className="flex items-center space-x-2 truncate pr-1">
                        <span className="w-4 h-4 rounded-full bg-[#1e3427] text-[#58d68d] flex items-center justify-center text-[9px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="truncate text-[11px]">{bib.title}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#707070] flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: LIVE INTERACTIVE PREVIEW */}
        {activeTab === 'preview' && (
          <div className="w-full h-full bg-[#121212] relative">
            <iframe
              title="Canvas Live View"
              sandbox="allow-scripts allow-modals"
              srcDoc={getSanitizedPreviewHtml()}
              className="w-full h-full border-none bg-[#121212]"
            />
          </div>
        )}

        {/* TAB 2: LIVE CODE / TEXT EDITOR */}
        {activeTab === 'code' && (
          <div className="w-full h-full flex flex-col bg-[#1e1e1e] font-mono text-xs text-[#dddddd]">
            <textarea
              value={codeContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full bg-transparent p-3 outline-none resize-none font-mono text-[12px] leading-relaxed text-[#e0e0e0] placeholder-[#666666] select-text"
              placeholder="Edit source..."
              spellCheck={false}
            />
          </div>
        )}

        {/* TAB 3: NOTEBOOKLM STUDIO VIEW */}
        {activeTab === 'notebook' && (
          <div className="w-full h-full overflow-y-auto p-5 space-y-4 bg-[#1a1a1a] text-[#dddddd] select-text">
            <div className="p-4 rounded-[6px] bg-[#271d3a] border border-[#443166]">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#bb86fc] uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>NotebookLM Study Package</span>
              </div>
              <h1 className="text-base font-semibold text-white mb-1">{artifact.title}</h1>
              <p className="text-xs text-[#b8a5d3] leading-relaxed">
                {artifact.notebookData?.overview || 'Synthesized multi-source study guide and reference briefing.'}
              </p>

              {podcastSegments.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#443166] flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-[#c9b7e3]">
                    <Radio className="w-3.5 h-3.5 text-[#ff79c6] animate-pulse" />
                    <span>2-Host Audio Overview Available</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('podcast');
                      if (!isPlayingPodcast) togglePodcast();
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-[#7b2cbf] hover:bg-[#8a33d4] text-white rounded-[4px] text-xs font-medium transition"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Play Audio</span>
                  </button>
                </div>
              )}
            </div>

            {artifact.notebookData?.sections?.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-[6px] bg-[#222222] border border-[#303030] space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-[#35254d] text-[#bb86fc] flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs font-semibold text-white">{sec.title}</h3>
                </div>
                <div className="text-xs text-[#cccccc] leading-relaxed whitespace-pre-line pl-6">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: NOTEBOOKLM AUDIO OVERVIEW */}
        {activeTab === 'podcast' && (
          <div className="w-full h-full flex flex-col bg-[#1a1a1a] overflow-hidden">
            <div className="p-4 bg-[#232323] border-b border-[#2e2e2e] flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#ff79c6] uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#ff79c6]" />
                <span>Audio Overview Briefing</span>
              </div>
              <h2 className="text-sm font-semibold text-white">{artifact.title}</h2>
              <p className="text-xs text-[#8e8e8e] max-w-sm">
                Two AI co-hosts unpack and summarize the core insights in natural spoken dialogue.
              </p>

              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={togglePodcast}
                  className="flex items-center space-x-2 px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-xs shadow-sm transition"
                >
                  {isPlayingPodcast ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play Audio Overview</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {podcastSegments.map((seg, idx) => {
                const isCurrent = isPlayingPodcast && currentSegmentIndex === idx;
                const isAlex = seg.speaker.includes('Alex');

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsPlayingPodcast(true);
                      playSegment(idx);
                    }}
                    className={`p-3 rounded-[5px] cursor-pointer transition border ${
                      isCurrent
                        ? 'bg-[#291e33] border-[#7b2cbf] text-white shadow-sm'
                        : 'bg-[#222222] hover:bg-[#282828] border-[#303030] text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                            isAlex ? 'bg-[#0078d4]' : 'bg-[#d63384]'
                          }`}
                        >
                          {isAlex ? 'A' : 'J'}
                        </div>
                        <span className="text-xs font-semibold text-[#e0e0e0]">{seg.speaker}</span>
                      </div>
                      {isCurrent && (
                        <span className="flex items-center space-x-1 text-[10px] text-[#ff79c6] font-bold">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span>Playing</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed pl-6">{seg.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Windows 11 Co-work Bottom Prompt Ribbon */}
      <div className="p-2.5 bg-[#202020] border-t border-[#303030]">
        <form onSubmit={handleSendCowork} className="relative flex items-center">
          <input
            type="text"
            value={coworkInput}
            onChange={(e) => setCoworkInput(e.target.value)}
            placeholder="Co-work command: 'Refactor code', 'Add dark mode', 'Update section'..."
            disabled={isLoading}
            className="w-full bg-[#181818] border border-[#383838] focus:border-[#60cdff] rounded-[4px] px-3 py-1.5 text-xs text-white placeholder-[#707070] focus:outline-none pr-8"
          />
          <button
            type="submit"
            disabled={!coworkInput.trim() || isLoading}
            className={`absolute right-1 p-1 rounded-[3px] transition ${
              coworkInput.trim() && !isLoading
                ? 'bg-[#0078d4] hover:bg-[#106ebe] text-white cursor-pointer'
                : 'text-[#505050] cursor-not-allowed'
            }`}
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Windows 11 Document Status Bar */}
      <div className="h-6 bg-[#181818] border-t border-[#2e2e2e] px-3 flex items-center justify-between text-[11px] text-[#7a7a7a] font-mono">
        <div className="flex items-center space-x-3">
          <span>Ln {lineCount}, Col 1</span>
          <span>{codeContent.length} characters</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>UTF-8</span>
          <span>CRLF</span>
          <span>{artifact.language || artifact.type}</span>
        </div>
      </div>
    </div>
  );
};
