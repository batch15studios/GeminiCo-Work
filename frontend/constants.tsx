import React from 'react';
import { Gem, ChatSession, CanvasArtifact, WorkspaceFile, Skill, MCPServer, GoogleWorkspaceIntegration } from './types';

export const DEFAULT_GOOGLE_WORKSPACE_INTEGRATIONS: GoogleWorkspaceIntegration[] = [
  {
    appType: 'drive',
    name: 'Google Drive',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    description: 'Read shared files, team folders, spreadsheets, and stored PDFs directly into Co-work context.',
    isConnected: true,
    lastSyncedAt: Date.now() - 360000,
    items: [
      {
        id: 'gdrive-1',
        appType: 'drive',
        title: 'Q3 Enterprise Architecture Roadmap.pdf',
        snippet: 'Comprehensive microservices migration and multi-region failover strategy.',
        updatedAt: '2 hours ago',
        content: `Target Architecture 2025:
1. Transition monolithic backends to decoupled event-driven services with Apache Kafka.
2. Cloud Spanner database for globally synchronous transaction consistency.
3. Zero-trust service mesh with mTLS and IAM workload identity federation.`,
        isSelected: true
      },
      {
        id: 'gdrive-2',
        appType: 'drive',
        title: 'System Requirements Specification v2.4.docx',
        snippet: 'Core latency requirements (<50ms p99), SLA targets (99.99%), and compliance audit checklists.',
        updatedAt: 'Yesterday',
        content: `System Latency & Concurrency:
- Peak throughput: 50,000 req/sec
- p99 Latency ceiling: 48 milliseconds
- Mandatory OAuth2 token validation caching at API gateway with 60s TTL.`,
        isSelected: false
      }
    ]
  },
  {
    appType: 'docs',
    name: 'Google Docs',
    scope: 'https://www.googleapis.com/auth/documents.readonly',
    description: 'Pull live Google Docs text, meeting agendas, and engineering specs straight into Canvas.',
    isConnected: true,
    lastSyncedAt: Date.now() - 120000,
    items: [
      {
        id: 'gdoc-1',
        appType: 'docs',
        title: 'Product Brief: Gemini Desktop Co-work Suite',
        snippet: 'Feature specifications for Deep Research, Canvas artifacts, and local File Explorer trees.',
        updatedAt: 'Today, 10:14 AM',
        content: `Product Principles:
- Native Windows 11 desktop aesthetics with Fluent Mica color tokens.
- Offline-ready with background cloud sync through Firestore.
- Deep Research capability with iterative Google Search Grounding decomposition.`,
        isSelected: true
      },
      {
        id: 'gdoc-2',
        appType: 'docs',
        title: 'Incident Post-Mortem: DB Deadlock Recovery',
        snippet: 'Analysis of transaction lock contention under high write volume during month-end billing.',
        updatedAt: '3 days ago',
        content: `Root Cause: Unordered locks acquired across concurrent transactions modifying the users and ledger_entries tables simultaneously.
Resolution: Enforce deterministic table lock ordering in application code and migrate to read-committed snapshot isolation.`,
        isSelected: false
      }
    ]
  },
  {
    appType: 'sheets',
    name: 'Google Sheets',
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    description: 'Query financial data, OKR tracking spreadsheets, and CSV metrics with Gemini Co-work calculations.',
    isConnected: true,
    lastSyncedAt: Date.now() - 600000,
    items: [
      {
        id: 'gsheets-1',
        appType: 'sheets',
        title: 'Q2 2025 Financial Projections & Cloud Cost Model',
        snippet: 'Compute instances, egress bandwidth, TPU inference workloads, and storage quota estimates.',
        updatedAt: 'Yesterday',
        content: `Monthly Forecast (USD):
| Category | Compute | Egress | Storage | Total |
| Jan 2025 | $14,200 | $1,800 | $2,100  | $18,100 |
| Feb 2025 | $15,800 | $2,050 | $2,300  | $20,150 |
| Mar 2025 | $17,400 | $2,400 | $2,600  | $22,400 |
Runway: 28 months at current burn rate. Recommendation: Reserve 1-year commitments to save 34%.`,
        isSelected: true
      }
    ]
  },
  {
    appType: 'slides',
    name: 'Google Slides',
    scope: 'https://www.googleapis.com/auth/presentations.readonly',
    description: 'Analyze executive presentation pitch decks, architecture diagrams, and keynote outlines.',
    isConnected: true,
    lastSyncedAt: Date.now() - 900000,
    items: [
      {
        id: 'gslides-1',
        appType: 'slides',
        title: 'Series B Technical Architecture Deck (Slide 1-18)',
        snippet: 'Executive slides highlighting zero-trust security posture, AI throughput, and multi-tenant isolation.',
        updatedAt: 'May 12, 2025',
        content: `Key Slide Summaries:
Slide 3: High-level System Topology (Cloud Run -> Cloud Spanner -> Vertex AI Studio).
Slide 7: Enterprise Compliance Certifications (SOC2 Type II, ISO 27001, HIPAA BAA).
Slide 12: Developer Velocity Multipliers (Gemini Co-work Canvas adoption reduces dev cycle time by 42%).`,
        isSelected: false
      }
    ]
  },
  {
    appType: 'gmail',
    name: 'Gmail',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    description: 'Surface email threads, client feedback, and bug reports for Gemini to analyze and draft replies.',
    isConnected: true,
    lastSyncedAt: Date.now() - 180000,
    items: [
      {
        id: 'gmail-1',
        appType: 'gmail',
        title: 'Re: API Gateway 502 Errors in Staging',
        snippet: 'From: devops-lead@company.com - Upstream timeout occurring during batch sync operations.',
        updatedAt: '3 hours ago',
        content: `Hey Team,
We noticed persistent 502 Bad Gateway responses on the /sync-batch route when payload size exceeds 4MB.
Connection keep-alive headers seem to terminate prematurely before worker threads finish processing.
Can Gemini Co-work suggest an async queue refactor?`,
        isSelected: false
      },
      {
        id: 'gmail-2',
        appType: 'gmail',
        title: 'Contract Renewal: Enterprise License Agreement',
        snippet: 'From: legal@enterprise-client.com - Requesting confirmation of data sovereignty clauses.',
        updatedAt: '5 hours ago',
        content: `Hi Alex,
Please review section 8.2 regarding data processing within the EU geographic boundaries.
Once confirmed, we are prepared to countersign the master services agreement for 500 developer seats.`,
        isSelected: false
      }
    ]
  },
  {
    appType: 'calendar',
    name: 'Google Calendar',
    scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
    description: 'Inspect sprint schedules, architectural reviews, and sync meeting notes with Gemini.',
    isConnected: true,
    lastSyncedAt: Date.now() - 60000,
    items: [
      {
        id: 'gcal-1',
        appType: 'calendar',
        title: 'Sprint 42 Architecture Review (Today, 2:00 PM)',
        snippet: 'Attendees: Engineering Leads, Principal Architect, Product Managers',
        updatedAt: 'Today',
        content: `Agenda:
1. Review File Explorer tree virtualization performance.
2. Discuss Model Context Protocol (MCP) server latency benchmarks.
3. Review Canvas React sandbox security model.`,
        isSelected: false
      },
      {
        id: 'gcal-2',
        appType: 'calendar',
        title: 'Quarterly OKR Planning Session (Tomorrow, 10:00 AM)',
        snippet: 'Attendees: Product & Leadership Teams - Google Meet attached',
        updatedAt: 'Tomorrow',
        content: `Objectives:
1. Launch Gemini Co-work Desktop v2 across Windows 11 and web clients.
2. Maintain sub-100ms UI responsiveness during Deep Research grounding cycles.
3. Establish 100% test coverage on Firebase migration state machines.`,
        isSelected: false
      }
    ]
  },
  {
    appType: 'meet',
    name: 'Google Meet',
    scope: 'https://www.googleapis.com/auth/meetings.space.readonly',
    description: 'Import automated Google Meet call recordings, transcripts, and action item takeaways.',
    isConnected: true,
    lastSyncedAt: Date.now() - 720000,
    items: [
      {
        id: 'gmeet-1',
        appType: 'meet',
        title: 'Transcript: Cloud Infrastructure Sync (June 24)',
        snippet: 'Transcript containing discussion on Redis cluster failovers and blue-green deployments.',
        updatedAt: 'Yesterday',
        content: `Key Transcript Excerpts:
[00:04:12] Dave: We are migrating the Redis cache from single-node to Sentinel with 3 replicas.
[00:08:45] Sarah: Make sure the connection pool retry logic handles temporary ECONNREFUSED during failover.
Action Items:
- Dave to test Sentinel auto-failover in staging before Wednesday.
- Sarah to benchmark client library reconnection latency.`,
        isSelected: true
      }
    ]
  },
  {
    appType: 'keep',
    name: 'Google Keep',
    scope: 'https://www.googleapis.com/auth/keep.readonly',
    description: 'Sync quick thoughts, pinned engineering checklists, and scratchpad snippets.',
    isConnected: true,
    lastSyncedAt: Date.now() - 450000,
    items: [
      {
        id: 'gkeep-1',
        appType: 'keep',
        title: 'Pinned: Production Release Checklist',
        snippet: 'Pre-flight checks before merging releases to main.',
        updatedAt: 'Monday',
        content: `[ ] Run full integration test suite with synthetic load.
[ ] Check Sentry error budget and unhandled exception rates.
[ ] Verify Firestore security rules deployment in target database.
[ ] Confirm Firebase Anonymous auth linking correctly upgrades to email credentials.`,
        isSelected: true
      }
    ]
  }
];

export const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'skill-ast-review',
    name: 'AST Code Auditor & Linter',
    category: 'Code Analysis',
    description: 'Scans for subtle race conditions, memory leaks, missing cleanup in useEffects, and anti-patterns.',
    instructionPrompt: 'Audit code thoroughly for async leaks, stale closures, missing dependency arrays, mutation side-effects, and unhandled promises. Propose idiomatic fixes with code diffs.',
    tags: ['react', 'security', 'performance'],
    isEnabled: true
  },
  {
    id: 'skill-sql-opt',
    name: 'PostgreSQL Query Planner',
    category: 'Database',
    description: 'Optimizes slow queries, designs composite B-Tree/GIN indexes, and resolves N+1 query bottlenecks.',
    instructionPrompt: 'Analyze database access patterns. Propose index definitions (B-Tree, GIN, BRIN), analyze simulated EXPLAIN ANALYZE execution trees, and rewrite inefficient JOIN subqueries.',
    tags: ['sql', 'postgres', 'indexing'],
    isEnabled: true
  },
  {
    id: 'skill-security-audit',
    name: 'OWASP Security Sentinel',
    category: 'Security',
    description: 'Evaluates SSRF, XSS, injection vectors, CORS policies, and token handling best practices.',
    instructionPrompt: 'Perform an OWASP Top 10 security review on the code. Scrutinize user input sanitization, JWT validation, CSRF tokens, and permission-denied fallbacks.',
    tags: ['security', 'owasp', 'auth'],
    isEnabled: true
  },
  {
    id: 'skill-docker-k8s',
    name: 'Container & Docker Architect',
    category: 'DevOps',
    description: 'Generates multi-stage Dockerfiles, alpine distroless baselines, and healthcheck configurations.',
    instructionPrompt: 'Draft production-ready, security-hardened multi-stage Dockerfiles. Minimize layer caching, omit devDependencies in production stages, and implement non-root user execution.',
    tags: ['docker', 'devops', 'containers'],
    isEnabled: false
  },
  {
    id: 'skill-openapi-gen',
    name: 'OpenAPI Spec & Contract Drafter',
    category: 'Documentation',
    description: 'Extracts TypeScript types and routes to generate OpenAPI 3.1 YAML specifications.',
    instructionPrompt: 'Synthesize standard OpenAPI 3.1 YAML contracts from endpoints and TypeScript types. Include clear schemas, error responses (400, 401, 404, 500), and request body examples.',
    tags: ['api', 'openapi', 'rest'],
    isEnabled: false
  }
];

export const DEFAULT_MCP_SERVERS: MCPServer[] = [
  {
    id: 'mcp-google-workspace',
    name: 'Google Workspace MCP',
    endpointUrl: 'https://workspace-mcp.googleapis.internal/v1',
    transport: 'https',
    authType: 'oauth',
    authToken: 'ya29.workspace_demo_token',
    status: 'connected',
    isEnabled: true,
    lastPing: Date.now() - 30000,
    tools: [
      { name: 'drive_search_files', description: 'Search Google Drive files, sheets, and documents by text query' },
      { name: 'docs_get_document', description: 'Retrieve structured content of a Google Doc by document ID' },
      { name: 'sheets_query_range', description: 'Run A1 notation read query over Google Sheets tabs' },
      { name: 'gmail_list_threads', description: 'Fetch unread or labeled email threads matching search filters' },
      { name: 'calendar_list_events', description: 'List upcoming Google Calendar events for the authenticated account' },
      { name: 'keep_get_notes', description: 'Fetch pinned notes, checklists, and scratchpad items from Google Keep' }
    ]
  },
  {
    id: 'mcp-github',
    name: 'GitHub Protocol MCP',
    endpointUrl: 'https://api.github-mcp.internal/v1',
    transport: 'https',
    authType: 'bearer',
    authToken: 'ghp_demo_token_workspace',
    status: 'connected',
    isEnabled: true,
    lastPing: Date.now() - 120000,
    tools: [
      { name: 'github_search_repositories', description: 'Search GitHub repos by query, stars, and language' },
      { name: 'github_get_file_contents', description: 'Fetch raw content of a file from a branch or commit' },
      { name: 'github_create_pull_request', description: 'Open a PR with title, base branch, and unified diff' }
    ]
  },
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL Database MCP',
    endpointUrl: 'https://postgres-mcp.local:8443/rpc',
    transport: 'https',
    authType: 'api-key',
    apiKeyHeader: 'X-DB-Token',
    authToken: 'pg_secret_live_conn',
    status: 'connected',
    isEnabled: true,
    lastPing: Date.now() - 60000,
    tools: [
      { name: 'db_execute_readonly_query', description: 'Run SELECT query with limit and schema validation' },
      { name: 'db_introspect_schema', description: 'Retrieve table definitions, foreign keys, and column types' },
      { name: 'db_explain_query', description: 'Return execution plan tree for SQL query' }
    ]
  }
];

export const DEFAULT_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    id: 'f-1',
    name: 'App.tsx',
    path: 'src/App.tsx',
    extension: 'tsx',
    size: 2450,
    isSelected: true,
    content: `import React, { useState } from 'react';
import { Header } from './components/Header';
import { MetricsGrid } from './components/MetricsGrid';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mt-6">
        <MetricsGrid />
      </main>
    </div>
  );
}`
  },
  {
    id: 'f-2',
    name: 'MetricsGrid.tsx',
    path: 'src/components/MetricsGrid.tsx',
    extension: 'tsx',
    size: 1820,
    isSelected: true,
    content: `import React from 'react';

export const MetricsGrid: React.FC = () => {
  const stats = [
    { label: 'Total Operations', value: '14,289', change: '+12.4%' },
    { label: 'Avg Latency', value: '42ms', change: '-4.1%' },
    { label: 'Cache Hit Rate', value: '98.2%', change: '+0.8%' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s, idx) => (
        <div key={idx} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">{s.label}</div>
          <div className="text-2xl font-bold mt-1">{s.value}</div>
          <div className="text-xs text-emerald-400 mt-1">{s.change}</div>
        </div>
      ))}
    </div>
  );
};`
  },
  {
    id: 'f-3',
    name: 'Header.tsx',
    path: 'src/components/Header.tsx',
    extension: 'tsx',
    size: 1100,
    isSelected: false,
    content: `import React from 'react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (t: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-4">
      <h1 className="text-lg font-bold">Analytics Engine</h1>
      <nav className="flex space-x-2 text-xs">
        {['overview', 'logs', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={\`px-3 py-1 rounded \${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400'}\`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>
    </header>
  );
};`
  },
  {
    id: 'f-4',
    name: 'package.json',
    path: 'package.json',
    extension: 'json',
    size: 640,
    isSelected: false,
    content: `{
  "name": "enterprise-dashboard",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.577.0"
  }
}`
  },
  {
    id: 'f-5',
    name: 'README.md',
    path: 'README.md',
    extension: 'md',
    size: 420,
    isSelected: false,
    content: `# Enterprise Analytics Dashboard

High-performance dashboard built with React 19, TypeScript, and Tailwind CSS.
Supports real-time metric virtualization and dark mode native client styling.`
  }
];

export const DEFAULT_GEMS: Gem[] = [
  {
    id: 'gem-default',
    name: 'Standard Co-work',
    tagline: 'Adaptive AI workspace assistant',
    icon: 'Terminal',
    systemPrompt: "You are Gemini Co-work, an advanced multimodal AI desktop copilot (similar to Claude Co-work and GPT Desktop). You have deep integration with the user's local workspace files, tools, and Google Workspace (Gmail, Google Drive, Google Docs, Google Calendar). When the user asks to inspect emails, summarize documents, find files, or check calendar appointments, analyze the loaded Google Workspace items directly, cite their subject/file names and dates, extract relevant details, and provide actionable summaries.",
    category: 'Productivity'
  },
  {
    id: 'gem-researcher',
    name: 'Deep Research Lead',
    tagline: 'Autonomous web investigation & cross-source validation',
    icon: 'GraduationCap',
    systemPrompt: 'You are the Gemini Deep Research Principal Investigator. Conduct thorough multi-perspective inquiries, cite sources meticulously, formulate hypotheses, cross-examine empirical data, and deliver comprehensive executive dossiers with comparative matrices.',
    category: 'Learning'
  },
  {
    id: 'gem-cowork',
    name: 'Code Architect',
    tagline: 'Iterate live on project files, React components & APIs',
    icon: 'Code2',
    systemPrompt: 'You are Gemini Code Architect. Analyze the provided project files thoroughly, suggest targeted improvements or complete working modules, and use modern TypeScript with Tailwind CSS.',
    category: 'Coding'
  },
  {
    id: 'gem-notebook',
    name: 'NotebookLM Researcher',
    tagline: 'Executive briefs, deep study guides & audio scripts',
    icon: 'BookOpen',
    systemPrompt: 'You are NotebookLM Deep Researcher. Structure knowledge into executive overviews, key takeaways, FAQs, and two-host conversational podcast scripts.',
    category: 'Learning'
  },
  {
    id: 'gem-writer',
    name: 'Technical Wordsmith',
    tagline: 'Documentation, design specs & executive memos',
    icon: 'Feather',
    systemPrompt: 'You are an elite technical writer. Craft crisp documentation, architectural decision records (ADRs), and clear release notes.',
    category: 'Writing'
  }
];

export const DEMO_CANVAS_ARTIFACT: CanvasArtifact = {
  id: 'artifact-welcome-canvas',
  title: 'Interactive Pomodoro Productivity App',
  type: 'html',
  language: 'html',
  content: `<div class="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
  <div class="flex items-center justify-between text-xs text-neutral-400 font-mono">
    <span class="flex items-center space-x-1.5">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>GEMINI CO-WORK</span>
    </span>
    <span class="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">FOCUS CYCLE 1/4</span>
  </div>

  <div class="py-6">
    <div class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 font-mono tracking-tight" id="timer">
      25:00
    </div>
    <p class="text-xs text-neutral-400 mt-2 font-medium">Deep Work Session in Progress</p>
  </div>

  <div class="flex justify-center space-x-3">
    <button onclick="toggleTimer()" id="startBtn" class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition">
      Start Focus
    </button>
    <button onclick="resetTimer()" class="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition">
      Reset
    </button>
  </div>
</div>

<script>
  let seconds = 25 * 60;
  let timerInterval = null;
  function updateDisplay() {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById('timer').innerText = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function toggleTimer() {
    const btn = document.getElementById('startBtn');
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      btn.innerText = 'Resume';
    } else {
      timerInterval = setInterval(() => {
        if (seconds > 0) { seconds--; updateDisplay(); }
        else { clearInterval(timerInterval); alert('Session complete!'); }
      }, 1000);
      btn.innerText = 'Pause';
    }
  }
  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    seconds = 25 * 60;
    updateDisplay();
    document.getElementById('startBtn').innerText = 'Start Focus';
  }
</script>`,
  currentVersion: 1,
  versions: [{
    version: 1,
    timestamp: Date.now() - 3600000,
    content: 'Initial Pomodoro Canvas Demo',
    description: 'Generated by Gemini Canvas'
  }]
};

export const INITIAL_CHAT: ChatSession = {
  id: 'session-welcome',
  title: 'Welcome to Gemini Co-work',
  gemId: 'gem-default',
  model: 'gemini-3.8-flash',
  enableGrounding: true,
  defaultOutputMode: 'canvas',
  updatedAt: Date.now(),
  isPinned: true,
  artifacts: [DEMO_CANVAS_ARTIFACT],
  activeArtifactId: DEMO_CANVAS_ARTIFACT.id,
  messages: [
    {
      id: 'msg-welcome',
      role: 'model',
      content: `### Welcome to **Gemini Co-work**\n\nA desktop-class Windows workspace built for collaborative engineering, research, and live document creation.\n\n* **🔗 Connected Google Workspaces**: All Google Workspace services are integrated — **Google Drive, Docs, Sheets, Slides, Gmail, Calendar, Meet Transcripts, and Keep Notes** can now be connected, inspected, and fed directly into Gemini's context.\n* **⚡ Skills & MCP Database**: Register custom skills and connect Model Context Protocol (MCP) servers via HTTPS/tokens/OAuth to give Gemini real-time tools.\n* **📁 File Explorer**: Inspect local project files in the Navigation Pane, select files to feed directly into Gemini's context, and open any file straight into the Canvas.\n* **🎨 Canvas Co-work**: Work side-by-side with Gemini on live editable code, React components, and HTML web applications.\n* **🔬 Deep Research**: Multi-step investigative inquiries with Google Search Grounding synthesizing comprehensive dossiers and citations.\n\nConfigure your Google Workspaces in **Settings > Google Workspace** or select an output mode below!`,
      timestamp: Date.now() - 60000,
      artifactId: DEMO_CANVAS_ARTIFACT.id,
      artifactSnapshot: DEMO_CANVAS_ARTIFACT,
    }
  ]
};

export const PROMPT_SUGGESTIONS = [
  { label: 'Analyze Google Workspace Context', prompt: 'Review the connected Google Drive architecture roadmap, Google Docs product brief, and Sheets cost projections in context. Synthesize an execution plan in Canvas.', isCanvas: true },
  { label: 'Deep Research: AI Agent Frameworks', prompt: 'Conduct a deep research investigation comparing Autonomous AI Agent Frameworks in 2025: architecture, memory systems, tool-calling benchmarks, and security vulnerabilities.', isResearch: true },
  { label: 'Build in Canvas', prompt: 'Create an interactive financial savings calculator in HTML with Tailwind CSS and live charts', isCanvas: true },
  { label: 'NotebookLM Study Guide', prompt: 'Generate a comprehensive NotebookLM research package on Quantum Computing breakthroughs with a Two-Host Audio Overview', isNotebook: true },
  { label: 'Audio Podcast Brief', prompt: 'Create a two-host podcast audio overview summarizing the latest trends in humanoid robotics and embodied AI', isAudio: true },
  { label: 'Generate Visual in Image Studio', prompt: 'Generate a futuristic glass workstation overlooking a cyberpunk neon city at twilight', isImage: true },
];
