import { spawn } from 'child_process';
import fetch from 'node-fetch';

/**
 * MCPManager manages Model Context Protocol (MCP) server connections
 * supporting both stdio (spawned processes) and HTTP/SSE transports.
 */
export class MCPManager {
  constructor() {
    this.servers = new Map();
    this.nextId = 1;
  }

  /**
   * Register and initialize an MCP server
   * @param {Object} config - { id, name, transport: 'stdio' | 'sse' | 'http', command, args, env, url }
   */
  async registerServer(config) {
    const serverId = config.id || config.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Close existing if any
    if (this.servers.has(serverId)) {
      await this.disconnectServer(serverId);
    }

    const serverEntry = {
      id: serverId,
      name: config.name,
      transport: config.transport || 'stdio',
      config,
      status: 'connecting',
      tools: [],
      error: null,
      process: null
    };

    this.servers.set(serverId, serverEntry);

    try {
      if (serverEntry.transport === 'stdio') {
        await this._connectStdio(serverEntry);
      } else {
        await this._connectHttp(serverEntry);
      }
      serverEntry.status = 'connected';
      console.log(`[MCP] Successfully registered and connected to server '${serverEntry.name}' (${serverEntry.tools.length} tools)`);
    } catch (err) {
      console.error(`[MCP] Failed to connect to server '${serverEntry.name}':`, err.message);
      serverEntry.status = 'error';
      serverEntry.error = err.message;
    }

    return this.getServerSummary(serverEntry);
  }

  async _connectStdio(serverEntry) {
    return new Promise((resolve, reject) => {
      const { command, args = [], env = {} } = serverEntry.config;
      if (!command) {
        return reject(new Error('stdio transport requires a command'));
      }

      const mergedEnv = { ...process.env, ...env };
      const child = spawn(command, args, {
        env: mergedEnv,
        shell: process.platform === 'win32',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      serverEntry.process = child;
      serverEntry.pendingRequests = new Map();
      serverEntry.buffer = '';

      child.stdout.on('data', (chunk) => {
        serverEntry.buffer += chunk.toString();
        const lines = serverEntry.buffer.split('\n');
        serverEntry.buffer = lines.pop(); // keep remainder

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(trimmed);
            this._handleJsonRpcMessage(serverEntry, msg);
          } catch (e) {
            console.warn(`[MCP:${serverEntry.name}] Malformed JSON from stdout:`, trimmed.substring(0, 100));
          }
        }
      });

      child.stderr.on('data', (chunk) => {
        console.log(`[MCP:${serverEntry.name}:stderr] ${chunk.toString().trim()}`);
      });

      child.on('error', (err) => {
        console.error(`[MCP:${serverEntry.name}] Process error:`, err);
        serverEntry.status = 'error';
        serverEntry.error = err.message;
      });

      child.on('close', (code) => {
        console.log(`[MCP:${serverEntry.name}] Process exited with code ${code}`);
        serverEntry.status = 'disconnected';
      });

      // 1. Initialize
      const initId = this.nextId++;
      this._sendStdioRequest(serverEntry, {
        jsonrpc: '2.0',
        id: initId,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'GeminiCoWork', version: '1.2.0' }
        }
      }, 10000).then(async (initResult) => {
        // Send initialized notification
        this._sendStdioNotification(serverEntry, {
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        });

        // 2. Fetch tools/list
        const listId = this.nextId++;
        const toolsResult = await this._sendStdioRequest(serverEntry, {
          jsonrpc: '2.0',
          id: listId,
          method: 'tools/list',
          params: {}
        }, 10000);

        serverEntry.tools = toolsResult?.tools || [];
        resolve();
      }).catch(reject);
    });
  }

  async _connectHttp(serverEntry) {
    const { url } = serverEntry.config;
    if (!url) throw new Error('HTTP/SSE transport requires a URL');

    // Test handshake via POST JSON-RPC endpoint
    const initRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.nextId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'GeminiCoWork', version: '1.2.0' }
        }
      })
    });

    if (!initRes.ok) {
      throw new Error(`HTTP MCP server returned status ${initRes.status}`);
    }

    // Fetch tools
    const toolsRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.nextId++,
        method: 'tools/list',
        params: {}
      })
    });

    const data = await toolsRes.json();
    serverEntry.tools = data?.result?.tools || [];
  }

  _sendStdioRequest(serverEntry, reqObj, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      if (!serverEntry.process || !serverEntry.process.stdin.writable) {
        return reject(new Error('Process stdin not writable'));
      }

      const timer = setTimeout(() => {
        serverEntry.pendingRequests?.delete(reqObj.id);
        reject(new Error(`MCP request ${reqObj.method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      serverEntry.pendingRequests.set(reqObj.id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });

      serverEntry.process.stdin.write(JSON.stringify(reqObj) + '\n');
    });
  }

  _sendStdioNotification(serverEntry, notifObj) {
    if (serverEntry.process && serverEntry.process.stdin.writable) {
      serverEntry.process.stdin.write(JSON.stringify(notifObj) + '\n');
    }
  }

  _handleJsonRpcMessage(serverEntry, msg) {
    if (msg.id && serverEntry.pendingRequests?.has(msg.id)) {
      const { resolve, reject } = serverEntry.pendingRequests.get(msg.id);
      serverEntry.pendingRequests.delete(msg.id);
      if (msg.error) {
        reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      } else {
        resolve(msg.result);
      }
    }
  }

  async callTool(serverId, toolName, args = {}) {
    const serverEntry = this.servers.get(serverId);
    if (!serverEntry) {
      throw new Error(`MCP server '${serverId}' not found`);
    }

    if (serverEntry.status !== 'connected') {
      throw new Error(`MCP server '${serverId}' is in state: ${serverEntry.status}`);
    }

    if (serverEntry.transport === 'stdio') {
      const callId = this.nextId++;
      const result = await this._sendStdioRequest(serverEntry, {
        jsonrpc: '2.0',
        id: callId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      });
      return result;
    } else {
      const res = await fetch(serverEntry.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this.nextId++,
          method: 'tools/call',
          params: { name: toolName, arguments: args }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Tool call failed');
      return data.result;
    }
  }

  async disconnectServer(serverId) {
    const entry = this.servers.get(serverId);
    if (!entry) return;

    if (entry.process) {
      try {
        entry.process.kill('SIGTERM');
      } catch (e) {}
      entry.process = null;
    }
    entry.status = 'disconnected';
    this.servers.delete(serverId);
  }

  getAllServers() {
    const list = [];
    for (const entry of this.servers.values()) {
      list.push(this.getServerSummary(entry));
    }
    return list;
  }

  getServerSummary(entry) {
    return {
      id: entry.id,
      name: entry.name,
      transport: entry.transport,
      status: entry.status,
      toolCount: entry.tools?.length || 0,
      tools: entry.tools || [],
      error: entry.error,
      config: {
        command: entry.config.command,
        args: entry.config.args,
        url: entry.config.url
      }
    };
  }

  /**
   * Get all tools across all connected servers mapped for Gemini functionDeclarations
   */
  getGeminiFunctionDeclarations() {
    const declarations = [];
    for (const [serverId, entry] of this.servers.entries()) {
      if (entry.status !== 'connected') continue;
      for (const tool of entry.tools) {
        declarations.push({
          name: `${serverId}__${tool.name}`,
          description: `[MCP: ${entry.name}] ${tool.description || ''}`,
          parameters: tool.inputSchema || { type: 'object', properties: {} }
        });
      }
    }
    return declarations;
  }
}

export const mcpManager = new MCPManager();
