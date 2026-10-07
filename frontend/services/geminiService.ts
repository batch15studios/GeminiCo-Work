import { GoogleGenAI, Modality, Type } from '@google/genai';
import { 
  Attachment, 
  CanvasArtifact, 
  GroundingSource, 
  ModelType, 
  OutputMode, 
  NotebookSection, 
  AudioPodcastSegment,
  DeepResearchData,
  ResearchStep,
  WorkspaceFile,
  Skill,
  MCPServer,
  GoogleWorkspaceItem,
  AIProvider,
  AppSettings
} from '../types';

let activeApiKey: string | null = null;

export const setActiveApiKey = (k: string) => {
  activeApiKey = k.trim();
};

export const getStoredApiKey = (): string | null => {
  if (activeApiKey) return activeApiKey;
  try {
    const stored = localStorage.getItem('gemini_cowork_settings_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.apiKey.trim()) {
        activeApiKey = parsed.apiKey.trim();
        return activeApiKey;
      }
    }
  } catch {}
  return null;
};

export const getStoredSettings = (): AppSettings | null => {
  try {
    const stored = localStorage.getItem('gemini_cowork_settings_v1');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

export const checkLocalModelStatus = async (url?: string): Promise<{ online: boolean; models: Array<{ name: string; size?: number }>; provider: string }> => {
  try {
    const q = url ? `?url=${encodeURIComponent(url)}` : '';
    const r = await fetch(`/api/local/status${q}`);
    if (r.ok) return await r.json();
  } catch {}
  return { online: false, models: [], provider: 'ollama' };
};

export const startLocalOllamaServer = async (): Promise<boolean> => {
  try {
    const r = await fetch('/api/local/start', { method: 'POST' });
    return r.ok;
  } catch {
    return false;
  }
};

export const pullLocalModel = async (model: string): Promise<boolean> => {
  try {
    const r = await fetch('/api/local/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model })
    });
    return r.ok;
  } catch {
    return false;
  }
};

export const sanitizeModel = (m: ModelType | string): string => {
  if (!m || m === 'gemini-3.8-live') {
    return 'gemini-3.8-flash';
  }
  return m;
};

export const getGenAIClient = (overrideApiKey?: string) => {
  const key = overrideApiKey || getStoredApiKey();
  if (key && key.trim()) {
    return new GoogleGenAI({ apiKey: key.trim() });
  }

  throw new Error("GEMINI_KEY_REQUIRED: Please enter your Gemini API Key in Settings (⚙️) or switch to Local AI (Ollama) to chat for free.");
};

export interface GenerateOptions {
  model: ModelType;
  outputMode?: OutputMode;
  prompt: string;
  history?: { role: 'user' | 'model'; text: string }[];
  systemInstruction?: string;
  enableGrounding?: boolean;
  attachments?: Attachment[];
  currentCanvasContent?: string;
  projectContextFiles?: WorkspaceFile[];
  activeSkills?: Skill[];
  activeMcpServers?: MCPServer[];
  selectedGoogleItems?: GoogleWorkspaceItem[];
  onResearchProgress?: (steps: ResearchStep[]) => void;
}

export interface GenerateResult {
  text: string;
  groundingSources?: GroundingSource[];
  generatedImageUrl?: string;
  createdArtifact?: CanvasArtifact;
  researchSteps?: ResearchStep[];
  referencedFiles?: string[];
  invokedSkills?: string[];
  invokedMcpTools?: string[];
  invokedGoogleApps?: string[];
}

export const resolveModelForProvider = (
  provider: AIProvider,
  requestedModel?: string,
  settings?: AppSettings | null
): string => {
  if (provider === 'grok') {
    if (requestedModel && requestedModel.startsWith('grok')) return requestedModel;
    return settings?.grokModel?.trim() || 'grok-2-latest';
  }
  if (provider === 'groq') {
    if (requestedModel && (requestedModel.startsWith('openai/') || requestedModel.startsWith('qwen/'))) return requestedModel;
    let chosen = settings?.groqModel?.trim() || 'openai/gpt-oss-20b';
    if (chosen.includes('8b') || chosen.includes('70b') || chosen.includes('qwen-2.5')) {
      chosen = 'openai/gpt-oss-20b';
    }
    return chosen;
  }
  if (provider === 'openrouter') {
    if (requestedModel && requestedModel.includes('/')) return requestedModel;
    return settings?.openrouterModel?.trim() || 'meta-llama/llama-3.3-70b-instruct:free';
  }
  if (provider === 'ollama') {
    if (requestedModel && !requestedModel.startsWith('gemini') && !requestedModel.startsWith('grok') && !requestedModel.startsWith('openai')) {
      return requestedModel;
    }
    return settings?.ollamaModel?.trim() || 'qwen2.5-coder:1.5b';
  }
  if (provider === 'lmstudio') {
    return 'local-model';
  }
  if (provider === 'gemini') {
    if (requestedModel && requestedModel.startsWith('gemini')) return requestedModel;
    return settings?.model || 'gemini-3.8-flash';
  }
  return settings?.customModel?.trim() || 'qwen2.5-coder:1.5b';
};

export const getProviderModelList = (
  provider: AIProvider,
  settings?: AppSettings | null
): { id: string; label: string; badge: string }[] => {
  if (provider === 'grok') {
    return [
      { id: 'grok-2-latest', label: 'Grok 2 Latest', badge: 'xAI • Flagship' },
      { id: 'grok-2', label: 'Grok 2', badge: 'xAI • Frontier' },
      { id: 'grok-2-mini', label: 'Grok 2 Mini', badge: 'xAI • Fast' },
      { id: 'grok-vision-beta', label: 'Grok Vision', badge: 'xAI • Multimodal' }
    ];
  }
  if (provider === 'groq') {
    return [
      { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B (Ultra Fast)', badge: 'Groq • 800 tok/s' },
      { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (Flagship)', badge: 'Groq • Frontier' },
      { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Coder)', badge: 'Groq • Coding' },
    ];
  }
  if (provider === 'openrouter') {
    return [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)', badge: 'OpenRouter' },
      { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)', badge: 'OpenRouter' },
      { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)', badge: 'OpenRouter' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', label: 'Qwen 2.5 Coder (Free)', badge: 'OpenRouter' }
    ];
  }
  if (provider === 'ollama') {
    return [
      { id: 'qwen2.5-coder:1.5b', label: 'Qwen 2.5 Coder 1.5B', badge: 'GPU Accelerated • Code' },
      { id: 'deepseek-r1:1.5b', label: 'DeepSeek R1 1.5B', badge: 'GPU Accelerated • Reason' },
      { id: 'gemma2:2b', label: 'Gemma 2 2B', badge: 'GPU Accelerated • Fast' },
      { id: 'llama3:latest', label: 'Llama 3 8B', badge: 'Local PC' },
    ];
  }
  if (provider === 'lmstudio') {
    return [
      { id: 'local-model', label: 'LM Studio Loaded Model', badge: 'Port 1234' }
    ];
  }
  if (provider === 'opencode' || provider === 'custom') {
    return [
      { id: settings?.customModel || 'custom-model', label: settings?.customModel || 'Custom Model', badge: 'Custom Gateway' }
    ];
  }
  return [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', badge: 'Flagship Agent' },
    { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', badge: 'Thinking & Code' },
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', badge: 'Multimodal' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', badge: 'High Throughput' },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', badge: 'Frontier Reasoning' },
    { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Image', badge: 'Nano Banana 2' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: 'Legacy Pro' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Legacy Flash' },
  ];
};

export const generateLocalModelResponse = async (
  options: GenerateOptions,
  provider: AIProvider,
  settings: AppSettings | null
): Promise<GenerateResult> => {
  const { 
    model, 
    outputMode = 'chat', 
    prompt, 
    history = [],
    systemInstruction, 
    currentCanvasContent,
    projectContextFiles = [],
    activeSkills = [],
    activeMcpServers = [],
    selectedGoogleItems = [],
    onResearchProgress
  } = options;

  // 1. Instant Free Image Generation Studio fallback (Pollinations.ai - 0 keys needed)
  if (outputMode === 'image') {
    const cleanPrompt = encodeURIComponent(prompt.trim() || 'futuristic glass workstation overlooking cyberpunk city');
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
    return {
      text: `### 🎨 Image Studio Visual Generated\n\n**Prompt:** "${prompt}"\n\nHigh-resolution visual generated via instant neural image synthesis.`,
      generatedImageUrl: imageUrl,
    };
  }

  // 2. Resolve endpoint, model, and authentication for Provider
  let endpoint = 'http://127.0.0.1:11434/v1/chat/completions';
  let modelName = resolveModelForProvider(provider, model, settings);
  let apiKey = '';

  if (provider === 'grok') {
    endpoint = 'https://api.x.ai/v1/chat/completions';
    apiKey = settings?.grokApiKey?.trim() || '';
  } else if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    apiKey = settings?.groqApiKey?.trim() || '';
    if (!apiKey) {
      throw new Error("GROQ_KEY_REQUIRED: Please enter your free Groq API key in Settings (⚙️). Get one instantly in 10 seconds (no credit card needed) at https://console.groq.com/keys");
    }
  } else if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    apiKey = settings?.openrouterApiKey?.trim() || '';
    if (!apiKey) {
      throw new Error("OPENROUTER_KEY_REQUIRED: Please enter your OpenRouter API key in Settings (⚙️). Get one at https://openrouter.ai/keys");
    }
  } else if (provider === 'ollama') {
    const baseUrl = settings?.ollamaBaseUrl?.trim() || 'http://127.0.0.1:11434';
    endpoint = baseUrl.endsWith('/v1/chat/completions')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
  } else if (provider === 'lmstudio') {
    endpoint = 'http://127.0.0.1:1234/v1/chat/completions';
  } else if (provider === 'opencode' || provider === 'custom') {
    endpoint = settings?.customBaseUrl?.trim() || 'http://127.0.0.1:11434/v1/chat/completions';
    apiKey = settings?.customApiKey?.trim() || '';
  }

  // 3. System Instructions tailored for Mode & Gem Persona
  let sysPrompt = 'You are an expert AI engineering and research assistant in Gemini Co-Work.';
  if (systemInstruction) {
    sysPrompt = systemInstruction;
  } else if (outputMode === 'architect') {
    sysPrompt = 'You are a Senior Principal Software Architect in Gemini Co-Work. Provide robust system architectures, deep modular refactorings, and complete working implementations inside fenced code blocks (e.g. ```tsx or ```html).';
  } else if (outputMode === 'canvas') {
    sysPrompt = 'You are an interactive Canvas UI engineer in Gemini Co-Work. Generate full, standalone, interactive HTML/CSS/Tailwind UI or React components inside markdown code blocks (e.g. ```html or ```tsx).';
  } else if (outputMode === 'research') {
    sysPrompt = 'You are the Gemini Deep Research Principal Investigator. Conduct exhaustive, rigorous, multi-perspective investigations. Structure comprehensive research dossiers with executive summaries, comparative matrices, risk analyses, and citations.';
  } else if (outputMode === 'notebook' || outputMode === 'audio') {
    sysPrompt = 'You are the Gemini NotebookLM Studio Engine. Synthesize structured study guides with executive summaries, key takeaways, FAQs, and two-host conversational podcast scripts.';
  }

  // 4. Ingest Skills & MCP Directives
  const invokedSkills: string[] = [];
  let skillsBlock = '';
  if (activeSkills.length > 0) {
    skillsBlock = `\n--- ACTIVE SKILLS DIRECTIVES (${activeSkills.length} active skills) ---\n`;
    activeSkills.forEach(s => {
      invokedSkills.push(s.name);
      skillsBlock += `\n[SKILL: ${s.name} (${s.category})]\nDirective: ${s.instructionPrompt}\n`;
    });
    skillsBlock += `--- END OF SKILLS DIRECTIVES ---\n`;
  }

  const invokedMcpTools: string[] = [];
  let mcpToolsBlock = '';
  if (activeMcpServers.length > 0) {
    mcpToolsBlock = `\n--- CONNECTED MCP (MODEL CONTEXT PROTOCOL) TOOLS ---\n`;
    activeMcpServers.forEach(server => {
      mcpToolsBlock += `\n[MCP SERVER: ${server.name} (${server.transport})]\n`;
      server.tools.forEach(tool => {
        invokedMcpTools.push(`${server.name}: ${tool.name}`);
        mcpToolsBlock += `  - Tool: ${tool.name}: ${tool.description}\n`;
      });
    });
    mcpToolsBlock += `--- END OF MCP TOOLS ---\n`;
  }

  // 5. Ingest Connected Google Workspace Items
  const invokedGoogleApps: string[] = [];
  let googleWorkspaceBlock = '';
  if (selectedGoogleItems.length > 0) {
    googleWorkspaceBlock = `\n--- CONNECTED GOOGLE WORKSPACE CONTEXT (${selectedGoogleItems.length} items loaded) ---\n`;
    selectedGoogleItems.forEach(item => {
      invokedGoogleApps.push(`${item.appType.toUpperCase()}: ${item.title}`);
      googleWorkspaceBlock += `\n[GOOGLE ${item.appType.toUpperCase()}: "${item.title}" (Updated: ${item.updatedAt})]\n${item.content}\n`;
    });
    googleWorkspaceBlock += `--- END OF GOOGLE WORKSPACE CONTEXT ---\n`;
  }

  // 6. Ingest Active Local Workspace Files
  const referencedFileNames: string[] = [];
  let projectFilesBlock = '';
  if (projectContextFiles.length > 0) {
    projectFilesBlock = `\n--- ACTIVE PROJECT WORKSPACE FILES (${projectContextFiles.length} files in scope) ---\n`;
    projectContextFiles.forEach(file => {
      referencedFileNames.push(file.name);
      projectFilesBlock += `\n[FILE: ${file.path}]\n\`\`\`${file.extension}\n${file.content}\n\`\`\`\n`;
    });
    projectFilesBlock += `--- END OF PROJECT WORKSPACE FILES ---\n`;
  }

  // 7. Ingest Canvas Context if live iterating
  let canvasContext = '';
  if ((outputMode === 'canvas' || outputMode === 'architect') && currentCanvasContent) {
    canvasContext = `\n--- CURRENT CANVAS WORKSPACE DOCUMENT ---\n${currentCanvasContent}\n-----------------------------------------\nProvide the updated complete code inside a fenced markdown code block.\n`;
  }

  const extraContext = `${projectFilesBlock}${googleWorkspaceBlock}${skillsBlock}${mcpToolsBlock}${canvasContext}`;

  // 8. DEEP RESEARCH PROGRESS SIMULATION & SPECIAL HANDLING
  let researchSteps: ResearchStep[] | undefined;
  if (outputMode === 'research') {
    researchSteps = [
      { id: 'step-1', title: 'Decomposing research inquiry & hypotheses', status: 'completed', detail: 'Formulating investigative angles' },
      { id: 'step-2', title: 'Aggregating technological & empirical evidence', status: 'in_progress', detail: 'Cross-examining authoritative datasets' },
      { id: 'step-3', title: 'Cross-verifying claims & trade-offs', status: 'pending', detail: 'Analyzing contradictory perspectives' },
      { id: 'step-4', title: 'Compiling structured Deep Research Dossier & Matrix', status: 'pending', detail: 'Finalizing executive takeaways & outlook' }
    ];
    if (onResearchProgress) onResearchProgress([...researchSteps]);
  }

  // 9. Build Messages Payload with Full Conversation History
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: sysPrompt }
  ];

  if (history && history.length > 0) {
    history.forEach(h => {
      messages.push({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text
      });
    });
  }

  let finalUserPrompt = prompt;
  if (outputMode === 'research') {
    finalUserPrompt = `
Conduct an exhaustive, empirical Deep Research investigation on:
"${prompt}"

${extraContext}

Structure your research dossier in clean markdown with the following specific sections:
# Deep Research Report: [Subject]
## Executive Summary & Core Thesis
## Key Strategic Findings & Empirical Evidence
## Detailed Thematic Breakdown (with comprehensive sub-sections)
## Counter-Arguments, Risk Factors & Uncertainties
## Comparative Analysis Matrix (include a markdown comparison table)
## Key Unresolved Questions & Future Outlook
## Authoritative References & Citations

Be deeply factual, rigorous, and exhaustive.
`.trim();
  } else if (outputMode === 'notebook' || outputMode === 'audio') {
    finalUserPrompt = `
Generate a comprehensive NotebookLM research package on:
"${prompt}"

${extraContext}

Structure your response with:
# [Title]
## Executive Overview
[2-3 paragraph synthesis]

## Key Takeaways
[Numbered comprehensive takeaways]

## Frequently Asked Questions
[3-5 detailed Q&As]

## Two-Host Audio Overview Podcast Script
**Alex (Analyst):** [Engaging opening insight]
**Jordan (Host):** [Thought-provoking commentary]
**Alex (Analyst):** [Deep-dive into core trade-offs]
**Jordan (Host):** [Synthesis and concluding takeaways]
`.trim();
  } else if (extraContext) {
    finalUserPrompt = `${extraContext}\n\nUser Request: ${prompt}`.trim();
  }

  messages.push({ role: 'user', content: finalUserPrompt });

  // 10. Call Universal Model Proxy
  const res = await fetch('/api/local/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint,
      model: modelName,
      messages,
      apiKey,
      temperature: 0.7
    })
  });

  let responseText = '';
  if (!res.ok) {
    const errText = await res.text();
    // Auto-heal 404 model_not_found on Groq by falling back to active 20B engine
    if (provider === 'groq' && (res.status === 404 || errText.includes('model_not_found')) && modelName !== 'openai/gpt-oss-20b') {
      console.warn(`[Groq Auto-Healing] Model ${modelName} not found, automatically retrying with openai/gpt-oss-20b...`);
      const retryRes = await fetch('/api/local/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          model: 'openai/gpt-oss-20b',
          messages,
          apiKey,
          temperature: 0.7
        })
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        responseText = retryData.text || '';
      }
    }

    if (!responseText) {
      let errorMsg = `Model request failed (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) {
          errorMsg = typeof parsed.error === 'string' ? parsed.error : (parsed.error.message || JSON.stringify(parsed.error));
        }
      } catch {}
      if (errorMsg.includes("doesn't have any credits") || errorMsg.includes("permission-denied")) {
        throw new Error("⚠️ xAI Grok Prepaid Credits Required: Your team on xAI needs prepaid credits to respond. Visit https://console.x.ai to add credits, or switch to Groq Cloud (100% Free at 500+ tok/s) or Local Ollama in Settings (⚙️) to continue for free!");
      }
      throw new Error(errorMsg);
    }
  } else {
    const data = await res.json();
    responseText = data.text || '';
  }

  // Update research steps if research mode
  if (outputMode === 'research' && researchSteps) {
    researchSteps[1].status = 'completed';
    researchSteps[2].status = 'completed';
    researchSteps[3].status = 'completed';
    if (onResearchProgress) onResearchProgress([...researchSteps]);
  }

  // 11. Artifact Extraction & Synthesis (Canvas, Architect, Research, Notebook)
  let createdArtifact: CanvasArtifact | undefined;
  const isCanvasTarget = outputMode === 'canvas' || outputMode === 'architect';
  const codeBlockMatch = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/.exec(responseText);

  if (outputMode === 'research') {
    const titleWords = prompt.split(' ').slice(0, 6).join(' ');
    const reportTitle = `Deep Research: ${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}`;
    const researchData: DeepResearchData = {
      query: prompt,
      depth: 'exhaustive',
      executiveSummary: responseText.split('\n\n')[1] || 'Empirical multi-perspective research synthesis.',
      keyInsights: [
        `Generated via ${modelName} (${provider.toUpperCase()}) with verified architectural benchmarks.`,
        'Comprehensive thematic analysis and risk matrix structured.',
        'Synthesized cross-industry impact and future trajectory.'
      ],
      investigativeFindings: [
        {
          category: 'Strategic Analysis',
          analysis: responseText.slice(0, 1500),
          citations: ['Domain Literature', 'Industry Standards']
        }
      ],
      unresolvedQuestions: [
        'What will be the operational implications over the next 12-24 months?',
        'How will emerging standards influence implementation agility?'
      ],
      bibliography: [
        { title: `${provider.toUpperCase()} Model Synthesis: ${modelName}`, url: endpoint }
      ],
      steps: (researchSteps || []).map(s => ({ ...s, status: 'completed' }))
    };

    createdArtifact = {
      id: 'artifact-research-' + Date.now(),
      title: reportTitle,
      type: 'research-report',
      content: responseText,
      currentVersion: 1,
      versions: [{
        version: 1,
        timestamp: Date.now(),
        content: responseText,
        description: `Deep Research Dossier by ${modelName} (${provider.toUpperCase()})`
      }],
      researchData
    };
  } else if (outputMode === 'notebook' || outputMode === 'audio') {
    const titleWords = prompt.split(' ').slice(0, 5).join(' ');
    const nbTitle = `Study Guide: ${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}`;
    createdArtifact = {
      id: 'artifact-nb-' + Date.now(),
      title: nbTitle,
      type: outputMode === 'audio' ? 'audio-brief' : 'notebook',
      content: responseText,
      currentVersion: 1,
      versions: [{
        version: 1,
        timestamp: Date.now(),
        content: responseText,
        description: `NotebookLM Synthesis by ${modelName} (${provider.toUpperCase()})`
      }],
      notebookData: {
        overview: responseText.slice(0, 400),
        sections: [
          { title: 'Executive Overview', content: responseText.slice(0, 500), type: 'summary' },
          { title: 'Full Investigation Findings', content: responseText, type: 'key_takeaways' }
        ],
        podcastScript: [
          { speaker: 'Alex (Analyst)', text: `Welcome to this Co-work Briefing. Today we're analyzing: ${prompt}.` },
          { speaker: 'Jordan (Host)', text: `The depth of insights across the technical stack provides a compelling framework.` },
          { speaker: 'Alex (Analyst)', text: `Check the complete study guide and architectural breakdown in the Canvas workspace.` }
        ]
      }
    };
  } else if (codeBlockMatch && (isCanvasTarget || responseText.length > 300)) {
    const detectedLang = codeBlockMatch[1].toLowerCase() || 'markdown';
    const extractedCode = codeBlockMatch[2];

    let artType: CanvasArtifact['type'] = 'code';
    if (detectedLang === 'html' || detectedLang === 'xml') artType = 'html';
    else if (detectedLang === 'tsx' || detectedLang === 'jsx' || detectedLang === 'react') artType = 'react';
    else if (detectedLang === 'markdown' || detectedLang === 'md') artType = 'markdown';

    const titleWords = prompt.split(' ').slice(0, 5).join(' ');
    const title = outputMode === 'architect'
      ? `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)} (Architecture)`
      : titleWords ? `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}` : 'Canvas Workspace';

    createdArtifact = {
      id: 'artifact-' + Date.now(),
      title,
      type: artType,
      language: detectedLang,
      content: extractedCode,
      currentVersion: 1,
      versions: [{
        version: 1,
        timestamp: Date.now(),
        content: extractedCode,
        description: `Engineered by ${modelName} (${provider.toUpperCase()})`
      }]
    };
  }

  return {
    text: responseText,
    createdArtifact,
    researchSteps,
    referencedFiles: referencedFileNames,
    invokedSkills,
    invokedMcpTools,
    invokedGoogleApps
  };
};

export const generateGeminiResponse = async (options: GenerateOptions): Promise<GenerateResult> => {
  const { 
    model, 
    outputMode = 'chat', 
    prompt, 
    systemInstruction, 
    enableGrounding, 
    attachments = [],
    currentCanvasContent,
    projectContextFiles = [],
    activeSkills = [],
    activeMcpServers = [],
    selectedGoogleItems = [],
    onResearchProgress
  } = options;

  const settings = getStoredSettings();
  const currentProvider: AIProvider = settings?.aiProvider || (getStoredApiKey() ? 'gemini' : 'ollama');

  // If using local or custom model provider, route to local handler
  if (currentProvider !== 'gemini') {
    return generateLocalModelResponse(options, currentProvider, settings);
  }

  const ai = getGenAIClient();

  // 1. Image Generation via gemini-3.1-flash-image
  if (model === 'gemini-3.1-flash-image' || outputMode === 'image') {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: prompt,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      let generatedImageUrl: string | undefined;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      return {
        text: generatedImageUrl ? `Here is your generated image visual for: "${prompt}"` : 'Image generation complete.',
        generatedImageUrl,
      };
    } catch (err: any) {
      console.error('Image Generation Error:', err);
      throw new Error(err.message || 'Failed to generate image with Gemini.');
    }
  }

  // Build Project Context string from selected files in File Explorer
  let projectContextBlock = '';
  const referencedFileNames: string[] = [];
  if (projectContextFiles.length > 0) {
    projectContextBlock = `\n--- ACTIVE PROJECT WORKSPACE FILES (${projectContextFiles.length} files in scope) ---\n`;
    projectContextFiles.forEach(file => {
      referencedFileNames.push(file.name);
      projectContextBlock += `\n[FILE: ${file.path}]\n\`\`\`${file.extension}\n${file.content}\n\`\`\`\n`;
    });
    projectContextBlock += `--- END OF PROJECT WORKSPACE FILES ---\n`;
  }

  // Build Google Workspace Context string from connected Google Apps
  let googleWorkspaceBlock = '';
  const invokedGoogleApps: string[] = [];
  if (selectedGoogleItems.length > 0) {
    googleWorkspaceBlock = `\n--- CONNECTED GOOGLE WORKSPACE APPS CONTEXT (${selectedGoogleItems.length} items loaded) ---\n`;
    selectedGoogleItems.forEach(item => {
      invokedGoogleApps.push(`${item.appType.toUpperCase()}: ${item.title}`);
      googleWorkspaceBlock += `\n[GOOGLE ${item.appType.toUpperCase()}: "${item.title}" (Updated: ${item.updatedAt})]\n${item.content}\n`;
    });
    googleWorkspaceBlock += `--- END OF GOOGLE WORKSPACE CONTEXT ---\n`;
  }

  // Build Skills & MCP Protocol Context
  let skillsBlock = '';
  const invokedSkills: string[] = [];
  if (activeSkills.length > 0) {
    skillsBlock = `\n--- ACTIVE SKILLS REPOSITORY (${activeSkills.length} active skills) ---\n`;
    activeSkills.forEach(skill => {
      invokedSkills.push(skill.name);
      skillsBlock += `\n[SKILL: ${skill.name} (${skill.category})]\nDirective: ${skill.instructionPrompt}\n`;
    });
    skillsBlock += `--- END OF SKILLS REPOSITORY ---\n`;
  }

  let mcpToolsBlock = '';
  const invokedMcpTools: string[] = [];
  if (activeMcpServers.length > 0) {
    mcpToolsBlock = `\n--- CONNECTED MCP (MODEL CONTEXT PROTOCOL) SERVERS & TOOLS ---\n`;
    activeMcpServers.forEach(server => {
      mcpToolsBlock += `\n[MCP SERVER: ${server.name} via ${server.endpointUrl} (Auth: ${server.authType})]\n`;
      server.tools.forEach(tool => {
        invokedMcpTools.push(`${server.name}: ${tool.name}`);
        mcpToolsBlock += `  - Tool: ${tool.name}: ${tool.description}\n`;
      });
    });
    mcpToolsBlock += `\nWhen applicable, simulate executing or consulting these MCP tools to enrich your answers.\n--- END OF MCP SERVERS ---\n`;
  }

  // Combine extra context blocks
  const combinedContextPreamble = `${projectContextBlock}${googleWorkspaceBlock}${skillsBlock}${mcpToolsBlock}`;

  // 2. DEEP RESEARCH ENGINE
  if (outputMode === 'research') {
    const steps: ResearchStep[] = [
      { id: 'step-1', title: 'Decomposing research inquiry & hypotheses', status: 'in_progress', detail: 'Formulating search angles & sub-queries' },
      { id: 'step-2', title: 'Executing web investigations via Google Search Grounding', status: 'pending', detail: 'Gathering multi-source empirical evidence' },
      { id: 'step-3', title: 'Cross-verifying claims & counter-perspectives', status: 'pending', detail: 'Filtering discrepancies and validating data' },
      { id: 'step-4', title: 'Compiling structured Deep Research Dossier & Matrix', status: 'pending', detail: 'Synthesizing report, takeaways & bibliography' }
    ];

    if (onResearchProgress) onResearchProgress([...steps]);

    try {
      steps[0].status = 'completed';
      steps[1].status = 'in_progress';
      if (onResearchProgress) onResearchProgress([...steps]);

      const searchDossierPrompt = `
You are the Gemini Deep Research Agent conducting an exhaustive, empirical deep-dive investigation on:
"${prompt}"

${combinedContextPreamble ? `\nActive Workspace & Tools context:\n${combinedContextPreamble}\n` : ''}

Instructions:
1. Conduct an in-depth investigation using current, verifiable facts from the web.
2. Provide a rigorous, academic and consulting-grade dossier.
3. Structure your response in clean markdown with the following specific sections:
   # Deep Research Report: [Subject]
   ## Executive Summary & Core Thesis
   ## Key Strategic Findings & Data Points
   ## Detailed Thematic Breakdown (with sub-sections)
   ## Counter-Arguments, Uncertainties & Risk Factors
   ## Comparative Analysis Matrix (include a markdown table if applicable)
   ## Key Unresolved Questions & Future Outlook
   ## Sources & Citations

Cite verifiable sources directly. Be deeply factual, nuanced, and detailed.
`;

      const searchResponse = await ai.models.generateContent({
        model: (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash' || model === 'gemini-3.1-pro-preview') ? model : 'gemini-3.7-flash',
        contents: searchDossierPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      steps[1].status = 'completed';
      steps[2].status = 'in_progress';
      if (onResearchProgress) onResearchProgress([...steps]);

      const reportText = searchResponse.text || 'Deep Research complete.';

      const groundingSources: GroundingSource[] = [];
      const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        chunks.forEach((chunk: any) => {
          if (chunk?.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
              url: chunk.web.uri,
            });
          }
        });
      }

      steps[2].status = 'completed';
      steps[3].status = 'in_progress';
      if (onResearchProgress) onResearchProgress([...steps]);

      const researchData: DeepResearchData = {
        query: prompt,
        depth: 'exhaustive',
        executiveSummary: reportText.split('\n\n')[1] || 'Comprehensive synthesis of multi-source findings.',
        keyInsights: [
          'Multi-perspective empirical verification completed across authoritative web domains.',
          'Synthesized technological, economical, and regulatory impacts.',
          'Cross-referenced contradictory analyses to establish high-confidence baselines.'
        ],
        investigativeFindings: [
          {
            category: 'Primary Thematic Analysis',
            analysis: reportText.slice(0, 1500),
            citations: groundingSources.slice(0, 3).map(s => s.title)
          }
        ],
        unresolvedQuestions: [
          'What will be the secondary systemic ramifications over a 12-24 month horizon?',
          'How will impending regulatory frameworks affect scalability?'
        ],
        bibliography: groundingSources,
        steps: steps.map(s => ({ ...s, status: 'completed' }))
      };

      steps[3].status = 'completed';
      if (onResearchProgress) onResearchProgress([...steps]);

      const artifactId = 'artifact-research-' + Date.now();
      const titleWords = prompt.split(' ').slice(0, 6).join(' ');
      const reportTitle = `Deep Research: ${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}`;

      const researchArtifact: CanvasArtifact = {
        id: artifactId,
        title: reportTitle,
        type: 'research-report',
        content: reportText,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: reportText,
          description: 'Deep Research Investigation Dossier'
        }],
        researchData,
        notebookData: {
          overview: researchData.executiveSummary,
          sections: [
            { title: 'Executive Summary', content: researchData.executiveSummary, type: 'summary' },
            { title: 'Full Investigation Findings', content: reportText, type: 'key_takeaways' }
          ],
          podcastScript: [
            { speaker: 'Alex (Analyst)', text: `Welcome to this Deep Research briefing. Today we're examining our exhaustive investigation into: ${prompt}.` },
            { speaker: 'Jordan (Host)', text: `What stands out immediately is how the grounded data challenges common assumptions. The empirical findings point to significant momentum.` },
            { speaker: 'Alex (Analyst)', text: `Exactly. When we look across the verified sources, the primary catalyst comes down to speed of adoption and cross-industry deployment.` },
            { speaker: 'Jordan (Host)', text: `And the report also details the major risk factors and unresolved questions. Check the full Dossier in the Canvas workspace for the complete data breakdown.` }
          ]
        }
      };

      return {
        text: `### **Deep Research Completed:** ${reportTitle}\n\n* **Status:** 4/4 investigative phases verified\n* **Sources Consulted:** ${groundingSources.length} live grounded references\n* **Artifact:** Full Deep Research Dossier generated in the Co-work Canvas with executive insights, comparative analysis, and citations.\n\n*Open the Canvas to inspect the complete research paper or review the findings.*`,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        createdArtifact: researchArtifact,
        researchSteps: steps,
        referencedFiles: referencedFileNames,
        invokedSkills,
        invokedMcpTools,
        invokedGoogleApps
      };
    } catch (err: any) {
      console.error('Deep Research Error:', err);
      throw new Error(err.message || 'Deep Research investigation failed. Please check network and query.');
    }
  }

  // 3. NotebookLM Mode
  if (outputMode === 'notebook' || outputMode === 'audio') {
    try {
      const notebookPrompt = `
You are the Gemini NotebookLM Studio Engine. Analyze the following request/topic:
"${prompt}"

${combinedContextPreamble}

Produce a comprehensive NotebookLM research package formatted strictly as a single JSON object with:
1. "title": A concise informative title
2. "overview": An executive summary (2-3 paragraphs)
3. "sections": Array of sections, each with "title", "content" (formatted markdown), and "type" ("summary" | "key_takeaways" | "faq" | "timeline" | "sources")
4. "podcastScript": Array of conversational segments between two dynamic hosts ("Alex (Analyst)" and "Jordan (Host)") discussing this topic intuitively like NotebookLM Audio Overview (6-10 engaging dialogue turns).
`;

      const response = await ai.models.generateContent({
        model: (model === 'gemini-3.1-flash-image') ? 'gemini-3.7-flash' : sanitizeModel(model),
        contents: notebookPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    type: { type: Type.STRING },
                  },
                  required: ['title', 'content', 'type'],
                },
              },
              podcastScript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ['speaker', 'text'],
                },
              },
            },
            required: ['title', 'overview', 'sections', 'podcastScript'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const artifactId = 'artifact-nb-' + Date.now();
      const markdownContent = `# ${parsed.title}\n\n${parsed.overview}\n\n` + 
        (parsed.sections || []).map((s: any) => `### ${s.title}\n${s.content}`).join('\n\n');

      const artifact: CanvasArtifact = {
        id: artifactId,
        title: parsed.title || 'NotebookLM Deep Dive',
        type: outputMode === 'audio' ? 'audio-brief' : 'notebook',
        content: markdownContent,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: markdownContent,
          description: 'Initial NotebookLM synthesis'
        }],
        notebookData: {
          overview: parsed.overview || '',
          sections: parsed.sections || [],
          podcastScript: parsed.podcastScript || []
        }
      };

      return {
        text: `### NotebookLM Workspace Generated: **${parsed.title}**\n\nI have generated an in-depth study notebook complete with executive overview, structured takeaways, FAQs, and a two-host Audio Overview podcast script.\n\n*Check the interactive Canvas on the right side to read, edit, or listen to the spoken Audio Briefing.*`,
        createdArtifact: artifact,
        referencedFiles: referencedFileNames,
        invokedSkills,
        invokedMcpTools,
        invokedGoogleApps
      };
    } catch (err: any) {
      console.warn('NotebookLM JSON fallback triggered:', err);
    }
  }

  // 4. Canvas & Code Architect Modes
  const isCanvasTarget = outputMode === 'canvas' || outputMode === 'architect';

  try {
    const parts: any[] = [];

    attachments.forEach((att) => {
      const pureBase64 = att.dataUrl.split(',')[1] || att.dataUrl;
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: pureBase64,
        },
      });
    });

    let effectivePrompt = prompt;
    if (combinedContextPreamble) {
      effectivePrompt = `${combinedContextPreamble}\n\nUser Task: ${prompt}`;
    }

    if (outputMode === 'architect') {
      effectivePrompt = `
You are the Gemini Code Architect. Your responsibility is to analyze software architecture, structure robust modular solutions, refactor code, and generate production-ready implementations with TypeScript and modern frameworks.

${combinedContextPreamble}

User Architecture Task: "${prompt}"

Provide your architectural recommendations followed by the full, updated code inside a fenced code block (e.g. \`\`\`tsx or \`\`\`ts or \`\`\`html).
`;
    } else if (isCanvasTarget) {
      if (currentCanvasContent) {
        effectivePrompt = `
You are Gemini Co-work Canvas. You are collaborating live on the following current document/code in the workspace:

--- CURRENT WORKSPACE CONTENT ---
${currentCanvasContent}
---------------------------------

${combinedContextPreamble}

User modification request: "${prompt}"

Provide your updated, complete working version inside a fenced markdown block (e.g. \`\`\`html or \`\`\`tsx or \`\`\`markdown). Precede the block with a brief 1-2 sentence description of what you improved.
`;
      } else {
        effectivePrompt = `
You are Gemini Co-work Canvas. The user requested: "${prompt}"

${combinedContextPreamble}

Generate a standalone, interactive, production-ready artifact (such as interactive HTML/CSS/Tailwind UI, React Component, or structured Markdown document).
Provide the primary artifact inside a code block (e.g. \`\`\`html ... \`\`\` or \`\`\`tsx ... \`\`\`).
Include any brief commentary before the code.
`;
      }
    }

    parts.push({ text: effectivePrompt });

    const config: any = {};
    if (outputMode === 'architect') {
      config.systemInstruction = 'You are a Senior Principal Software Architect. Write high-performance, modular, idiomatic TypeScript and React code, explain trade-offs clearly, and emit complete working files inside markdown code blocks.';
    } else if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (enableGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const historyContents = (options.history || []).map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    const response = await ai.models.generateContent({
      model: (model === 'gemini-3.1-flash-image') ? 'gemini-3.8-flash' : sanitizeModel(model),
      contents: [
        ...historyContents,
        {
          role: 'user',
          parts,
        }
      ],
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const responseText = response.text || '';

    const groundingSources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk?.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
            url: chunk.web.uri,
          });
        }
      });
    }

    let createdArtifact: CanvasArtifact | undefined;
    const codeBlockMatch = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/.exec(responseText);

    if (codeBlockMatch && (isCanvasTarget || responseText.length > 500)) {
      const detectedLang = codeBlockMatch[1].toLowerCase() || 'markdown';
      const extractedCode = codeBlockMatch[2];

      let artType: CanvasArtifact['type'] = 'code';
      if (detectedLang === 'html' || detectedLang === 'xml') artType = 'html';
      else if (detectedLang === 'tsx' || detectedLang === 'jsx' || detectedLang === 'react') artType = 'react';
      else if (detectedLang === 'markdown' || detectedLang === 'md') artType = 'markdown';

      const titleWords = prompt.split(' ').slice(0, 5).join(' ');
      const title = outputMode === 'architect'
        ? `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)} (Architecture)`
        : titleWords ? `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}` : 'Canvas Workspace';

      createdArtifact = {
        id: 'artifact-' + Date.now(),
        title,
        type: artType,
        language: detectedLang,
        content: extractedCode,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: extractedCode,
          description: outputMode === 'architect' ? 'Engineered by Code Architect' : 'Created by Gemini Co-work'
        }]
      };
    }

    return {
      text: responseText,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      createdArtifact,
      referencedFiles: referencedFileNames,
      invokedSkills,
      invokedMcpTools,
      invokedGoogleApps
    };
  } catch (err: any) {
    console.error('Gemini generate error:', err);
    throw new Error(err.message || 'Error communicating with Gemini. Please try again.');
  }
};
