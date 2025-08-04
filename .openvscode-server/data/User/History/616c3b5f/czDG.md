# MCP Brave Search Docker Setup Guide

## Prerequisites
- Docker installed and running
- VSCode with Cline extension
- MCP Brave Search server source code

## Step 1: Build the Docker Image

1. Clone the MCP servers repository (if not already done):
   ```bash
   git clone https://github.com/modelcontextprotocol/servers.git
   cd servers/src/brave-search
   ```

2. Build the Docker image:
   ```bash
   docker build -t mcp/brave-search:latest .
   ```

## Step 2: Configure VSCode

Add the following to your VSCode settings.json:

```json
{
  "cline.mcpServers": {
    "brave-search": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--env", "BRAVE_API_KEY=your-brave-api-key-here",
        "mcp/brave-search:latest"
      ]
    }
  }
}
```

Note: You'll need to replace `your-brave-api-key-here` with your actual Brave Search API key.

## Step 3: Test the Configuration

1. Restart VSCode or reload the window
2. In Cline, you should now see the brave-search MCP server available
3. Try using it with a query like "search for latest AI news"

## Alternative: Using Docker MCP Gateway

If you're using Docker MCP Gateway, your configuration would be:

```json
{
  "cline.mcpServers": {
    "docker-gateway": {
      "command": "docker",
      "args": [
        "mcp",
        "gateway",
        "run"
      ]
    }
  }
}
```

## Troubleshooting

- Ensure Docker daemon is running
- Check that the image was built successfully: `docker images | grep mcp/brave-search`
- Verify your Brave API key is valid
- Check VSCode Developer Tools console for any MCP connection errors
