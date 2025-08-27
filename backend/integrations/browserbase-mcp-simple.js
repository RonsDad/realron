#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

// Browserbase MCP Configuration
const SMITHERY_API_KEY = "f4ad379a-392a-4c93-8bde-21d044f966f6"
const PROFILE = "magnetic-barracuda-tEQvAI"
const BROWSERBASE_PROJECT_ID = "b9206c9e-c311-4976-a793-19023e452a25"

// Construct server URL with authentication
const url = new URL("https://server.smithery.ai/@RonsDad/mcp-browserbase/mcp")
url.searchParams.set("api_key", SMITHERY_API_KEY)
url.searchParams.set("profile", PROFILE)
const serverUrl = url.toString()

console.log("🔗 Connecting to:", serverUrl)

class BrowserbaseMCPClient {
  constructor() {
    this.client = null
    this.transport = null
    this.connected = false
    this.currentSessionId = null
  }

  async connect() {
    try {
      // Create transport
      this.transport = new StreamableHTTPClientTransport(serverUrl)

      // Create MCP client
      this.client = new Client({
        name: "Ron AI Browserbase",
        version: "1.0.0"
      })

      // Connect
      await this.client.connect(this.transport)
      this.connected = true
      console.log("✅ Connected to Browserbase MCP server")

      // List available tools
      try {
        const toolsResponse = await this.client.listTools()
        if (toolsResponse && toolsResponse.tools) {
          console.log(`📋 Available tools: ${toolsResponse.tools.map(t => t.name).join(", ")}`)
        } else {
          console.log("📋 No tools information available")
        }
      } catch (error) {
        console.log("📋 Could not list tools:", error.message)
      }
      
      return true
    } catch (error) {
      console.error("❌ Connection failed:", error)
      this.connected = false
      throw error
    }
  }

  async createSession(options = {}) {
    if (!this.connected) {
      await this.connect()
    }

    console.log("🌐 Creating browser session...")
    
    try {
      const result = await this.client.callTool("browserbase_create_session", {
        projectId: BROWSERBASE_PROJECT_ID,
        debug: true,
        ...options
      })

      // Store session ID
      if (result.sessionId) {
        this.currentSessionId = result.sessionId
        console.log("✅ Session created:", result.sessionId)
      }

      // Log debug URLs if available
      if (result.debuggerUrl) {
        console.log("🔍 Debugger URL:", result.debuggerUrl)
      }
      if (result.debuggerFullscreenUrl) {
        console.log("🔍 Fullscreen URL:", result.debuggerFullscreenUrl)
      }

      return result
    } catch (error) {
      console.error("❌ Failed to create session:", error)
      throw error
    }
  }

  async navigate(url, sessionId = null) {
    const sid = sessionId || this.currentSessionId
    if (!sid) {
      throw new Error("No active session. Create a session first.")
    }

    console.log(`🧭 Navigating to ${url}...`)
    
    try {
      const result = await this.client.callTool("browserbase_navigate", {
        sessionId: sid,
        url: url
      })
      
      console.log("✅ Navigation complete")
      return result
    } catch (error) {
      console.error("❌ Navigation failed:", error)
      throw error
    }
  }

  async screenshot(sessionId = null) {
    const sid = sessionId || this.currentSessionId
    if (!sid) {
      throw new Error("No active session. Create a session first.")
    }

    console.log("📸 Taking screenshot...")
    
    try {
      const result = await this.client.callTool("browserbase_screenshot", {
        sessionId: sid
      })
      
      console.log("✅ Screenshot captured")
      return result
    } catch (error) {
      console.error("❌ Screenshot failed:", error)
      throw error
    }
  }

  async click(selector, sessionId = null) {
    const sid = sessionId || this.currentSessionId
    if (!sid) {
      throw new Error("No active session. Create a session first.")
    }

    console.log(`🖱️ Clicking on ${selector}...`)
    
    try {
      const result = await this.client.callTool("browserbase_click", {
        sessionId: sid,
        selector: selector
      })
      
      console.log("✅ Click complete")
      return result
    } catch (error) {
      console.error("❌ Click failed:", error)
      throw error
    }
  }

  async type(selector, text, sessionId = null) {
    const sid = sessionId || this.currentSessionId
    if (!sid) {
      throw new Error("No active session. Create a session first.")
    }

    console.log(`⌨️ Typing into ${selector}...`)
    
    try {
      const result = await this.client.callTool("browserbase_type", {
        sessionId: sid,
        selector: selector,
        text: text
      })
      
      console.log("✅ Typing complete")
      return result
    } catch (error) {
      console.error("❌ Typing failed:", error)
      throw error
    }
  }

  async closeSession(sessionId = null) {
    const sid = sessionId || this.currentSessionId
    if (!sid) {
      console.log("No active session to close")
      return
    }

    console.log("🔚 Closing session...")
    
    try {
      const result = await this.client.callTool("browserbase_close_session", {
        sessionId: sid
      })
      
      if (sid === this.currentSessionId) {
        this.currentSessionId = null
      }
      
      console.log("✅ Session closed")
      return result
    } catch (error) {
      console.error("❌ Failed to close session:", error)
      throw error
    }
  }

  async disconnect() {
    if (this.currentSessionId) {
      await this.closeSession()
    }

    if (this.client) {
      await this.client.close()
      this.connected = false
      console.log("👋 Disconnected from MCP server")
    }
  }

  // Helper method to get debugger URL from a session
  getDebuggerUrl() {
    // This would be populated from the createSession response
    return this.debuggerUrl || null
  }
}

// Export for use in other modules
export default BrowserbaseMCPClient
export { 
  BrowserbaseMCPClient,
  SMITHERY_API_KEY,
  PROFILE,
  BROWSERBASE_PROJECT_ID
}

// Run as standalone if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const client = new BrowserbaseMCPClient()
    
    try {
      // Connect to server
      await client.connect()
      
      // Create a session with debug enabled
      const session = await client.createSession({
        debug: true
      })
      
      // Store debugger URL if available
      if (session.debuggerUrl || session.debuggerFullscreenUrl) {
        client.debuggerUrl = session.debuggerFullscreenUrl || session.debuggerUrl
        console.log("\n🌐 Live View Available:", client.debuggerUrl)
      }
      
      // Navigate to a test page
      await client.navigate("https://example.com")
      
      // Take a screenshot
      await client.screenshot()
      
      console.log("\n🔧 Session is active. Press Ctrl+C to close and exit.")
      console.log("📺 View live at:", client.getDebuggerUrl())
      
      // Handle cleanup on exit
      process.on("SIGINT", async () => {
        console.log("\n\n🧹 Cleaning up...")
        await client.disconnect()
        process.exit(0)
      })
      
      // Keep process alive
      await new Promise(() => {})
      
    } catch (error) {
      console.error("Failed:", error)
      await client.disconnect()
      process.exit(1)
    }
  }
  
  main()
}