export type ModelType = 
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-pro'
  | 'gemini-3.1-flash-image'
  | 'gemini-3.8-live';

export type OutputMode = 'chat' | 'canvas' | 'notebook' | 'audio' | 'image' | 'research' | 'architect';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string; // base64
  previewUrl?: string;
}

export type ArtifactType = 'code' | 'react' | 'html' | 'markdown' | 'notebook' | 'audio-brief' | 'research-report';

export interface NotebookSection {
  title: string;
  content: string;
  type: 'summary' | 'key_takeaways' | 'faq' | 'timeline' | 'sources';
}

export interface AudioPodcastSegment {
  speaker: 'Alex (Analyst)' | 'Jordan (Host)';
  text: string;
}

export interface ResearchStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  detail?: string;
  sourcesFound?: number;
}

export interface DeepResearchData {
  query: string;
  depth: 'standard' | 'exhaustive';
  executiveSummary: string;
  keyInsights: string[];
  investigativeFindings: {
    category: string;
    analysis: string;
    citations: string[];
  }[];
  comparativeMatrix?: {
    headers: string[];
    rows: string[][];
  };
  unresolvedQuestions: string[];
  bibliography: GroundingSource[];
  steps: ResearchStep[];
}

export interface CanvasArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  language?: string;
  content: string;
  versions: {
    version: number;
    timestamp: number;
    content: string;
    description: string;
  }[];
  currentVersion: number;
  notebookData?: {
    overview: string;
    sections: NotebookSection[];
    podcastScript?: AudioPodcastSegment[];
  };
  researchData?: DeepResearchData;
  audioState?: {
    isPlaying: boolean;
    currentSpeaker?: string;
    currentSentenceIndex?: number;
  };
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  content: string;
  extension: string;
  size: number;
  isSelected: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Code Analysis' | 'DevOps' | 'Database' | 'Security' | 'Documentation' | 'Testing';
  description: string;
  instructionPrompt: string;
  tags: string[];
  isEnabled: boolean;
  isCustom?: boolean;
}

export type MCPAuthType = 'none' | 'bearer' | 'api-key' | 'oauth';

export interface MCPTool {
  name: string;
  description: string;
  parametersJson?: string;
}

export interface OAuthConfig {
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface MCPServer {
  id: string;
  name: string;
  endpointUrl: string;
  transport: 'https' | 'sse' | 'stdio';
  authType: MCPAuthType;
  authToken?: string;
  apiKeyHeader?: string;
  customHeaders?: Record<string, string>;
  oauthConfig?: OAuthConfig;
  status: 'connected' | 'disconnected' | 'error';
  isEnabled: boolean;
  tools: MCPTool[];
  lastPing?: number;
}

export type GoogleAppType = 'drive' | 'docs' | 'sheets' | 'slides' | 'gmail' | 'calendar' | 'meet' | 'keep';

export interface GoogleWorkspaceItem {
  id: string;
  appType: GoogleAppType;
  title: string;
  snippet: string;
  updatedAt: string;
  content: string;
  isSelected: boolean;
  url?: string;
}

export interface GoogleWorkspaceIntegration {
  appType: GoogleAppType;
  name: string;
  scope: string;
  description: string;
  isConnected: boolean;
  token?: string;
  lastSyncedAt?: number;
  items: GoogleWorkspaceItem[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  outputMode?: OutputMode;
  attachments?: Attachment[];
  generatedImageUrl?: string;
  groundingSources?: GroundingSource[];
  thinkingTimeSec?: number;
  isStreaming?: boolean;
  artifactId?: string;
  artifactSnapshot?: CanvasArtifact;
  researchSteps?: ResearchStep[];
  referencedFiles?: string[];
  invokedSkills?: string[];
  invokedMcpTools?: string[];
  invokedGoogleApps?: string[];
}

export interface Gem {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  systemPrompt: string;
  category: 'Productivity' | 'Coding' | 'Writing' | 'Learning';
}

export interface ChatSession {
  id: string;
  title: string;
  gemId?: string;
  model: ModelType;
  enableGrounding: boolean;
  defaultOutputMode: OutputMode;
  messages: Message[];
  artifacts: CanvasArtifact[];
  activeArtifactId?: string;
  updatedAt: number;
  isPinned?: boolean;
}

export interface AppSettings {
  userName: string;
  theme: 'dark' | 'light';
  autoGrounding: boolean;
  voiceGender: 'male' | 'female';
  soundEffects: boolean;
  autoCloudSync: boolean;
  lastSyncedTimestamp?: number;
  apiKey?: string;
  googleCloudProject?: string;
  useLocalFileSystem?: boolean;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  name?: string;
  notes?: string;
  publishedAt?: string;
  htmlUrl?: string;
  downloadUrl?: string;
  latestCommit?: string;
  commitMessage?: string;
}
