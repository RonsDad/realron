#!/usr/bin/env python3
"""
Claude CLI Integration
Specialized agent for interacting with Claude Code CLI through computer use
"""

import asyncio
import os
import json
from claude_computer_agent import ComputerUseAgent

class ClaudeCLIAgent(ComputerUseAgent):
    def __init__(self, api_key: str, display_width: int = 1024, display_height: int = 768):
        super().__init__(api_key, display_width, display_height)
        self.terminal_coords = [512, 400]  # Center of screen
        
    async def open_terminal(self):
        """Open a new terminal window"""
        print("🖥️ Opening terminal...")
        
        # Take screenshot to see current state
        await self.execute_computer_action("screenshot")
        
        # Open terminal with keyboard shortcut
        result = self.execute_computer_action("key", key="ctrl+alt+t")
        
        # Wait for terminal to open
        await asyncio.sleep(2)
        
        return result
    
    async def execute_claude_cli_command(self, command: str, interactive: bool = False):
        """Execute Claude CLI command in terminal"""
        print(f"⚡ Executing Claude CLI: {command}")
        
        # Ensure we have a terminal open
        await self.open_terminal()
        
        # Click in terminal to focus
        self.execute_computer_action("left_click", coordinate=self.terminal_coords)
        await asyncio.sleep(0.5)
        
        # Type the command
        self.execute_computer_action("type", text=command)
        await asyncio.sleep(0.5)
        
        # Press Enter to execute
        self.execute_computer_action("key", key="Return")
        
        if interactive:
            print("🎯 Command executed. Terminal is ready for interaction.")
            return {"status": "interactive_mode", "message": "Terminal ready for interaction"}
        else:
            # Wait for command to complete
            await asyncio.sleep(3)
            
            # Take screenshot to see results
            screenshot = self.execute_computer_action("screenshot")
            return {"status": "completed", "screenshot": screenshot}
    
    async def start_claude_interactive_session(self):
        """Start an interactive Claude CLI session"""
        print("🤖 Starting Claude interactive session...")
        
        # Open terminal
        await self.open_terminal()
        
        # Start Claude CLI
        await self.execute_claude_cli_command("claude", interactive=True)
        
        return {"status": "interactive_session_started"}
    
    async def analyze_codebase_with_claude(self, project_path: str):
        """Use Claude CLI to analyze a codebase"""
        print(f"🔍 Analyzing codebase at: {project_path}")
        
        # Navigate to project directory
        await self.execute_claude_cli_command(f"cd {project_path}")
        
        # Run Claude analysis
        command = f"claude -p 'Analyze this codebase and provide insights on architecture, potential improvements, and code quality'"
        result = await self.execute_claude_cli_command(command)
        
        return result
    
    async def claude_code_review(self, file_path: str):
        """Use Claude CLI for code review"""
        print(f"📝 Reviewing code: {file_path}")
        
        command = f"claude -p 'Review this code file for best practices, bugs, and improvements' {file_path}"
        result = await self.execute_claude_cli_command(command)
        
        return result
    
    async def claude_documentation_generation(self, project_path: str):
        """Generate documentation using Claude CLI"""
        print(f"📚 Generating documentation for: {project_path}")
        
        await self.execute_claude_cli_command(f"cd {project_path}")
        
        command = "claude -p 'Generate comprehensive documentation for this project including README, API docs, and code comments'"
        result = await self.execute_claude_cli_command(command)
        
        return result
    
    async def claude_refactoring_suggestions(self, file_path: str):
        """Get refactoring suggestions from Claude CLI"""
        print(f"🔧 Getting refactoring suggestions for: {file_path}")
        
        command = f"claude -p 'Suggest refactoring improvements for this code file' {file_path}"
        result = await self.execute_claude_cli_command(command)
        
        return result

async def demo_claude_cli_integration():
    """Demonstration of Claude CLI integration capabilities"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return
    
    agent = ClaudeCLIAgent(api_key)
    
    print("🚀 Claude CLI Integration Demo")
    print("=" * 50)
    
    # Demo 1: Basic CLI interaction
    print("\n1️⃣ Testing basic Claude CLI...")
    await agent.execute_claude_cli_command("claude --version")
    
    # Demo 2: Interactive session
    print("\n2️⃣ Starting interactive session...")
    await agent.start_claude_interactive_session()
    
    # Wait for user to interact
    input("\n⏸️ Press Enter after interacting with Claude CLI...")
    
    # Demo 3: Code analysis (if project exists)
    project_path = "/home/ubuntu/claude-agent"
    if os.path.exists(project_path):
        print(f"\n3️⃣ Analyzing project: {project_path}")
        await agent.analyze_codebase_with_claude(project_path)
    
    print("\n✅ Demo completed!")

async def interactive_claude_cli():
    """Interactive Claude CLI session through computer use"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return
    
    agent = ClaudeCLIAgent(api_key)
    
    print("🤖 Interactive Claude CLI Agent")
    print("Available commands:")
    print("  analyze <path>     - Analyze codebase")
    print("  review <file>      - Review code file")
    print("  docs <path>        - Generate documentation")
    print("  refactor <file>    - Get refactoring suggestions")
    print("  interactive        - Start interactive session")
    print("  terminal           - Open new terminal")
    print("  screenshot         - Take screenshot")
    print("  quit               - Exit")
    
    while True:
        try:
            user_input = input("\n🎯 Enter command: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                break
            
            parts = user_input.split(' ', 1)
            command = parts[0].lower()
            arg = parts[1] if len(parts) > 1 else ""
            
            if command == "analyze":
                if arg:
                    await agent.analyze_codebase_with_claude(arg)
                else:
                    print("❌ Please provide a path to analyze")
            
            elif command == "review":
                if arg:
                    await agent.claude_code_review(arg)
                else:
                    print("❌ Please provide a file to review")
            
            elif command == "docs":
                if arg:
                    await agent.claude_documentation_generation(arg)
                else:
                    print("❌ Please provide a project path")
            
            elif command == "refactor":
                if arg:
                    await agent.claude_refactoring_suggestions(arg)
                else:
                    print("❌ Please provide a file to refactor")
            
            elif command == "interactive":
                await agent.start_claude_interactive_session()
            
            elif command == "terminal":
                await agent.open_terminal()
            
            elif command == "screenshot":
                result = agent.execute_computer_action("screenshot")
                print("📸 Screenshot taken")
            
            else:
                print(f"❌ Unknown command: {command}")
        
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        asyncio.run(demo_claude_cli_integration())
    else:
        asyncio.run(interactive_claude_cli())
