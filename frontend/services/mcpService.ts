import { MCPServer, MCPTool } from '../types';

export interface McpServerResponse {
  id: string;
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  status: 'connected' | 'disconnected' | 'error';
  toolCount: number;
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: any;
  }>;
  error?: string;
  config: {
    command?: string;
    args?: string[];
    url?: string;
  };
}

export const fetchMcpServers = async (): Promise<McpServerResponse[]> => {
  try {
    const res = await fetch('/api/mcp/servers');
    if (!res.ok) return [];
    const data = await res.json();
    return data.servers || [];
  } catch (e) {
    console.warn('[MCP] Could not fetch servers from backend:', e);
    return [];
  }
};

export const registerMcpServer = async (config: {
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}): Promise<McpServerResponse> => {
  const res = await fetch('/api/mcp/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to register MCP server (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.server;
};

export const disconnectMcpServer = async (serverId: string): Promise<boolean> => {
  const res = await fetch('/api/mcp/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: serverId })
  });
  return res.ok;
};

export const callMcpTool = async (
  serverId: string,
  toolName: string,
  toolArgs: Record<string, any> = {}
): Promise<any> => {
  const res = await fetch('/api/mcp/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverId, toolName, arguments: toolArgs })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Tool call failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.result;
};

export const fetchMcpGeminiTools = async (): Promise<any[]> => {
  try {
    const res = await fetch('/api/mcp/tools');
    if (!res.ok) return [];
    const data = await res.json();
    return data.tools || [];
  } catch {
    return [];
  }
};
