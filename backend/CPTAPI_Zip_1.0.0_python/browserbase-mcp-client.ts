/**
 * Browserbase MCP Client Integration
 * Official Documentation: https://docs.browserbase.com/integrations/mcp/introduction
 * GitHub: https://github.com/browserbase/mcp-server-browserbase
 * 
 * Implementation based on verified Browserbase MCP Server v1.x specifications
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

/**
 * MCP Tool Result types
 */
interface MCPToolContent {
  type: 'text';
  text: any;
}

interface MCPToolResult {
  content: MCPToolContent[];
  isError?: boolean;
}

/**
 * Transport configuration types as per MCP documentation
 */
export type TransportType = 'stdio' | 'sse' | 'smithery';

/**
 * Browserbase session configuration based on official tool parameters
 * Source: Smithery.ai and GitHub documentation
 */
export interface BrowserbaseSessionConfig {
  sessionName?: string;
  browserWidth?: number;  // Default: 1024
  browserHeight?: number; // Default: 768
  keepAlive?: boolean;
  contextId?: string;
  proxies?: boolean;
  advancedStealth?: boolean;
}

/**
 * MCP Client configuration
 */
export interface MCPClientConfig {
  transportType: TransportType;
  smitheryUrl?: string;
  browserbaseApiKey: string;
  browserbaseProjectId: string;
  modelName?: string; // Default: 'google/gemini-2.0-flash'
  modelApiKey?: string;
}

/**
 * Session tracking for multi-session management
 */
interface ActiveSession {
  id: string;
  name: string;
  createdAt: Date;
  browserbaseSessionId?: string;
}

export class BrowserbaseMCPClient {
  private client: Client | null = null;
  private activeSessions: Map<string, ActiveSession> = new Map();
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  /**
   * Initialize MCP connection based on transport type
   */
  async initialize(): Promise<void> {
    try {
      const transport = await this.createTransport();
      
      this.client = new Client(
        { 
          name: "browserbase-mcp-client", 
          version: "1.0.0" 
        },
        { 
          capabilities: {} 
        }
      );

      await this.client.connect(transport);
      console.log('✅ Browserbase MCP Client connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Browserbase MCP Client:', error);
      throw error;
    }
  }

  /**
   * Create transport based on configuration
   */
  private async createTransport() {
    switch (this.config.transportType) {
      case 'smithery':
      case 'sse':
        if (!this.config.smitheryUrl) {
          throw new Error('Smithery URL required for SSE transport');
        }
        return new SSEClientTransport(new URL(this.config.smitheryUrl));
      
      case 'stdio':
        const args = [
          '@browserbasehq/mcp-server-browserbase'
        ];

        // Add optional flags based on configuration
        if (this.config.modelName) {
          args.push('--modelName', this.config.modelName);
        }
        if (this.config.modelApiKey) {
          args.push('--modelApiKey', this.config.modelApiKey);
        }

        const childProcess = spawn('npx', args, {
          env: {
            ...process.env,
            BROWSERBASE_API_KEY: this.config.browserbaseApiKey,
            BROWSERBASE_PROJECT_ID: this.config.browserbaseProjectId,
            GEMINI_API_KEY: this.config.modelApiKey || ''
          }
        });

        return new StdioClientTransport({
          command: 'npx',
          args,
          // Remove invalid 'env' property from childProcess; pass only command and args.
        });
      
      default:
        throw new Error(`Unsupported transport type: ${this.config.transportType}`);
    }
  }

  /**
   * Create a new browser session for multi-session workflows
   * Tool: multi_browserbase_stagehand_session_create
   */
  async createSession(config: BrowserbaseSessionConfig): Promise<ActiveSession> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: 'multi_browserbase_stagehand_session_create',
        arguments: {
          sessionName: config.sessionName || `session-${Date.now()}`,
          browserWidth: config.browserWidth || 1024,
          browserHeight: config.browserHeight || 768,
          keepAlive: config.keepAlive !== false,
          ...(config.contextId && { contextId: config.contextId }),
          ...(config.proxies && { proxies: true }),
          ...(config.advancedStealth && { advancedStealth: true })
        }
      }) as MCPToolResult;

      const session: ActiveSession = {
        id: result.content[0].text.sessionId,
        name: config.sessionName || `session-${Date.now()}`,
        createdAt: new Date(),
        browserbaseSessionId: result.content[0].text.browserbaseSessionId
      };

      this.activeSessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * List all active browser sessions
   * Tool: multi_browserbase_stagehand_session_list
   */
  async listSessions(): Promise<ActiveSession[]> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: 'multi_browserbase_stagehand_session_list',
        arguments: {}
      });

      // Update local tracking with server state
      return Array.from(this.activeSessions.values());
    } catch (error) {
      console.error('Failed to list sessions:', error);
      throw error;
    }
  }

  /**
   * Navigate to a URL in a specific session
   * Tool: multi_browserbase_stagehand_navigate_session
   */
  async navigateSession(sessionId: string, url: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      await this.client.callTool({
        name: 'multi_browserbase_stagehand_navigate_session',
        arguments: {
          sessionId,
          url
        }
      });
    } catch (error) {
      console.error(`Failed to navigate session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Perform an action in a specific session using natural language
   * Tool: multi_browserbase_stagehand_act_session
   */
  async actInSession(sessionId: string, action: string): Promise<any> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: 'multi_browserbase_stagehand_act_session',
        arguments: {
          sessionId,
          action
        }
      }) as MCPToolResult;
      return result.content[0].text;
    } catch (error) {
      console.error(`Failed to act in session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Extract data from a page in a specific session
   * Tool: multi_browserbase_stagehand_extract_session
   */
  async extractFromSession(sessionId: string, instruction: string, schema?: any): Promise<any> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: 'multi_browserbase_stagehand_extract_session',
        arguments: {
          sessionId,
          instruction,
          ...(schema && { schema })
        }
      }) as MCPToolResult;
      return result.content[0].text;
    } catch (error) {
      console.error(`Failed to extract from session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Take a screenshot in a specific session
   * Tool: multi_browserbase_stagehand_screenshot_session
   */
  async screenshotSession(sessionId: string, fullPage: boolean = false): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: 'multi_browserbase_stagehand_screenshot_session',
        arguments: {
          sessionId,
          fullPage
        }
      }) as MCPToolResult;
      return result.content[0].text.screenshotUrl;
    } catch (error) {
      console.error(`Failed to screenshot session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Close a specific browser session
   * Tool: multi_browserbase_stagehand_session_close
   */
  async closeSession(sessionId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      await this.client.callTool({
        name: 'multi_browserbase_stagehand_session_close',
        arguments: {
          sessionId
        }
      });
      this.activeSessions.delete(sessionId);
    } catch (error) {
      console.error(`Failed to close session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get debug information for a session including Live View URLs
   * Tool: browserbase_stagehand_debug_session
   */
  async getSessionDebugInfo(sessionId: string): Promise<{
    debuggerFullscreenUrl: string;
    pages: Array<{ url: string; debuggerFullscreenUrl: string }>;
  }> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: 'browserbase_stagehand_debug_session',
        arguments: {
          sessionId
        }
      }) as MCPToolResult;
      return result.content[0].text;
    } catch (error) {
      console.error(`Failed to get debug info for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup all active sessions
   */
  async cleanup(): Promise<void> {
    const sessions = Array.from(this.activeSessions.keys());
    
    for (const sessionId of sessions) {
      try {
        await this.closeSession(sessionId);
      } catch (error) {
        console.error(`Failed to close session ${sessionId} during cleanup:`, error);
      }
    }

    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}
