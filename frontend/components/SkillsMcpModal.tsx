import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Server, 
  Plus, 
  Check, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Wrench,
  Radio,
  Globe,
  Tag,
  Shield
} from 'lucide-react';
import { Skill, MCPServer, MCPAuthType, OAuthConfig } from '../types';
import { fetchMcpServers, registerMcpServer, disconnectMcpServer, callMcpTool } from '../services/mcpService';

interface SkillsMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onUpdateSkills: (updated: Skill[]) => void;
  mcpServers: MCPServer[];
  onUpdateMcpServers: (updated: MCPServer[]) => void;
}

export const SkillsMcpModal: React.FC<SkillsMcpModalProps> = ({
  isOpen,
  onClose,
  skills,
  onUpdateSkills,
  mcpServers,
  onUpdateMcpServers
}) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'mcp'>('mcp');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingMcp, setIsAddingMcp] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // New Skill form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<Skill['category']>('Code Analysis');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillPrompt, setNewSkillPrompt] = useState('');
  const [newSkillTags, setNewSkillTags] = useState('');

  // New MCP Server form state
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpEndpoint, setNewMcpEndpoint] = useState('');
  const [newMcpAuthType, setNewMcpAuthType] = useState<MCPAuthType>('bearer');

  // Dynamic Auth State
  const [bearerToken, setBearerToken] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [oauthToken, setOauthToken] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [oauthScope, setOauthScope] = useState('');
  const [customHeaderKey, setCustomHeaderKey] = useState('');
  const [customHeaderVal, setCustomHeaderVal] = useState('');

  const [testingId, setTestingId] = useState<string | null>(null);

  if (!isOpen) return null;

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

    // Register with backend MCP manager
    try {
      if (newMcpEndpoint.startsWith('http')) {
        await registerMcpServer({
          name: cleanName,
          transport: 'http',
          url: newMcpEndpoint.trim()
        });
      } else {
        const parts = newMcpEndpoint.trim().split(' ');
        await registerMcpServer({
          name: cleanName,
          transport: 'stdio',
          command: parts[0],
          args: parts.slice(1)
        });
      }
    } catch (e) {
      console.warn('Backend MCP registration note:', e);
    }

    const newServer: MCPServer = {
      id: 'mcp-custom-' + Date.now(),
      name: cleanName,
      endpointUrl: newMcpEndpoint.trim(),
      transport: newMcpEndpoint.startsWith('http') ? 'https' : 'stdio',
      authType: newMcpAuthType,
      authToken,
      apiKeyHeader: apiKeyHdr,
      oauthConfig: oauthConf,
      customHeaders,
      status: 'connected',
      isEnabled: true,
      lastPing: Date.now(),
      tools: [
        { name: `${cleanPrefix}_exec`, description: `Execute action via ${cleanName}` },
        { name: `${cleanPrefix}_query`, description: `Query resource stream from ${cleanName}` }
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

  const filteredSkills = skills.filter(s => 
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredMcp = mcpServers.filter(s => 
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.endpointUrl.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#202020] border border-[#383838] rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-sans">
        {/* Windows 11 Title */}
        <div className="h-11 bg-[#1a1a1a] border-b border-[#2e2e2e] px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#60cdff]" />
            <h2 className="text-xs font-semibold text-white">Skills & Model Context Protocol (MCP) Database</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#888888] hover:text-white hover:bg-[#e81123] rounded-[3px] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs & Search Bar */}
        <div className="flex items-center justify-between border-b border-[#2e2e2e] bg-[#232323] px-3 pt-1">
          <div className="flex space-x-1 text-xs">
            <button
              onClick={() => { setActiveTab('skills'); setIsAddingSkill(false); setIsAddingMcp(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-[4px] border-b-2 font-medium transition ${
                activeTab === 'skills'
                  ? 'border-[#60cdff] text-white bg-[#202020]'
                  : 'border-transparent text-[#999999] hover:text-[#dddddd]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#60cdff]" />
              <span>Skills Database ({skills.filter(s => s.isEnabled).length}/{skills.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('mcp'); setIsAddingSkill(false); setIsAddingMcp(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-[4px] border-b-2 font-medium transition ${
                activeTab === 'mcp'
                  ? 'border-[#60cdff] text-white bg-[#202020]'
                  : 'border-transparent text-[#999999] hover:text-[#dddddd]'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-[#58d68d]" />
              <span>MCP Servers ({mcpServers.filter(s => s.isEnabled).length}/{mcpServers.length})</span>
            </button>
          </div>

          <div className="pb-1">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter..."
              className="w-36 bg-[#1a1a1a] border border-[#383838] focus:border-[#60cdff] rounded-[4px] px-2 py-0.5 text-[11px] text-[#cccccc] focus:outline-none"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* TAB 1: SKILLS DATABASE */}
          {activeTab === 'skills' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Installed Skills Directives</h3>
                  <p className="text-[11px] text-[#808080]">
                    Active skills inject specialized reasoning rules and verification checks into Gemini Co-work.
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
                    <button
                      type="button"
                      onClick={() => setIsAddingSkill(false)}
                      className="text-[#888888] hover:text-white"
                    >
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
                        placeholder="e.g. Next.js App Router Auditor"
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
                      placeholder="e.g. Scrutinizes server components and edge middleware boundaries"
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

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      value={newSkillTags}
                      onChange={(e) => setNewSkillTags(e.target.value)}
                      placeholder="tags: nextjs, ssr, react (comma separated)"
                      className="w-2/3 bg-[#1c1c1c] border border-[#383838] rounded-[4px] px-2 py-1 text-[11px] text-[#888888] focus:outline-none"
                    />
                    <div className="space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingSkill(false)}
                        className="px-2.5 py-1 text-[#888888] hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-[4px] text-xs font-medium transition"
                      >
                        Save Skill
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Skills List */}
              <div className="space-y-1.5">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`p-3 rounded-[6px] border transition flex items-start justify-between ${
                      skill.isEnabled
                        ? 'bg-[#22292f] border-[#294c6d]'
                        : 'bg-[#242424] border-[#333333] opacity-60'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{skill.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181818] border border-[#333333] text-[#8e8e8e]">
                          {skill.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a0a0a0] leading-relaxed">
                        {skill.description}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {skill.tags.map(t => (
                          <span key={t} className="text-[9px] font-mono bg-[#16222b] text-[#60cdff] px-1 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
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
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="p-1 text-[#888888] hover:text-[#e81123] rounded transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MODEL CONTEXT PROTOCOL (MCP) SERVERS WITH DYNAMIC FIELDS */}
          {activeTab === 'mcp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Registered Model Context Protocol (MCP) Servers</h3>
                  <p className="text-[11px] text-[#808080]">
                    Connect Gemini to MCP servers over HTTPS, Bearer Tokens, API Key Headers, or OAuth.
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

              {/* Add MCP Server Form with DYNAMIC INPUT FIELDS */}
              {isAddingMcp && (
                <form onSubmit={handleSaveMcp} className="p-3.5 bg-[#262626] border border-[#383838] rounded-[6px] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#333333] pb-1.5">
                    <span className="text-xs font-semibold text-white">Register MCP Server Endpoint</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingMcp(false)}
                      className="text-[#888888] hover:text-white"
                    >
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
                        placeholder="e.g. JIRA Tool MCP"
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
                        Provide an active OAuth Access Token or your Client ID and Secret to authenticate tool executions.
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
                    <button
                      type="button"
                      onClick={() => setIsAddingMcp(false)}
                      className="px-2.5 py-1 text-[#888888] hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-[#237750] hover:bg-[#2c885c] text-white rounded-[4px] text-xs font-medium transition shadow-sm"
                    >
                      Connect & Save
                    </button>
                  </div>
                </form>
              )}

              {/* Server List */}
              <div className="space-y-2">
                {filteredMcp.map((server) => (
                  <div
                    key={server.id}
                    className={`p-3 rounded-[6px] border transition space-y-2 ${
                      server.isEnabled
                        ? 'bg-[#1b2621] border-[#276e4c]'
                        : 'bg-[#242424] border-[#333333] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-white">{server.name}</span>
                          <span className="text-[9px] font-mono bg-[#16291e] text-[#58d68d] px-1.5 py-0.2 rounded border border-[#276e4c] flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#58d68d] animate-pulse"></span>
                            <span>{server.status}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#808080] uppercase">
                            Auth: {server.authType}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-[#89b39b]">
                          {server.endpointUrl}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePingMcp(server.id)}
                          disabled={testingId === server.id}
                          title="Ping / refresh tool list"
                          className="p-1 text-[#888888] hover:text-white hover:bg-[#2d2d2d] rounded transition"
                        >
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

                        <button
                          onClick={() => handleDeleteMcp(server.id)}
                          className="p-1 text-[#888888] hover:text-[#e81123] rounded transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Tools Exposed By MCP */}
                    <div className="pt-2 border-t border-[#274635] space-y-1">
                      <div className="text-[10px] font-semibold text-[#58d68d] uppercase tracking-wider">
                        Available Tools ({server.tools.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {server.tools.map((t, idx) => (
                          <div key={idx} className="p-1.5 rounded-[4px] bg-[#141d18] border border-[#243d2f] text-[11px]">
                            <div className="font-mono text-[#a5e0be] font-medium">{t.name}</div>
                            <div className="text-[10px] text-[#789985] truncate">{t.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 bg-[#1a1a1a] border-t border-[#2e2e2e] px-4 flex items-center justify-between text-[11px] text-[#808080]">
          <span>Gemini Co-work Protocol Registry</span>
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
