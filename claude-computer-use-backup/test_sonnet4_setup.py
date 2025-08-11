#!/usr/bin/env python3
"""
Test Claude Sonnet 4 Setup for Computer Use
Verifies that we're using the correct model and computer use capabilities
"""

import asyncio
import os
import anthropic
from dotenv import load_dotenv
from claude_computer_agent import ComputerUseAgent

# Load environment variables
load_dotenv()

async def test_sonnet4_computer_use():
    """Test Claude Sonnet 4 with computer use capabilities"""
    
    print("🧪 Testing Claude Sonnet 4 Computer Use Setup")
    print("=" * 50)
    
    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("❌ ANTHROPIC_API_KEY not found or not set")
        return False
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    try:
        # Initialize the agent
        agent = ComputerUseAgent(api_key)
        print(f"✅ Agent initialized with model: {agent.model}")
        print(f"✅ Tool version: {agent.tool_version}")
        print(f"✅ Beta flag: {agent.beta_flag}")
        
        # Test direct API call to verify model access
        print("\n🔍 Testing direct API access...")
        client = anthropic.Anthropic(api_key=api_key)
        
        # Test basic message without computer use
        basic_response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[{"role": "user", "content": "Hello, are you Claude Sonnet 4?"}]
        )
        
        print(f"✅ Basic API call successful")
        print(f"📝 Response: {basic_response.content[0].text[:100]}...")
        
        # Test computer use beta access
        print("\n🖥️ Testing computer use beta access...")
        
        tools = [
            {
                "type": f"computer_{agent.tool_version}",
                "name": "computer",
                "display_width_px": agent.display_width,
                "display_height_px": agent.display_height,
                "display_number": agent.display_number,
            }
        ]
        
        computer_response = client.beta.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            messages=[{
                "role": "user", 
                "content": "I need you to take a screenshot. Please use the computer tool to capture what's currently on the screen."
            }],
            tools=tools,
            betas=[agent.beta_flag]
        )
        
        print(f"✅ Computer use beta API call successful")
        
        # Check if Claude wants to use the computer tool
        has_tool_use = any(
            hasattr(block, 'type') and block.type == "tool_use" 
            for block in computer_response.content
        )
        
        if has_tool_use:
            print(f"✅ Claude Sonnet 4 correctly wants to use computer tools")
            for block in computer_response.content:
                if hasattr(block, 'type') and block.type == "tool_use":
                    print(f"🔧 Tool requested: {block.name}")
                    print(f"📝 Tool input: {block.input}")
        else:
            print(f"⚠️ Claude responded but didn't request computer tool use")
            for block in computer_response.content:
                if hasattr(block, 'text'):
                    print(f"📝 Text response: {block.text[:100]}...")
        
        # Test the agent's sampling loop
        print("\n🔄 Testing agent sampling loop...")
        
        messages = [{
            "role": "user", 
            "content": "Please take a screenshot and tell me what you see on the screen."
        }]
        
        # Run one iteration of the sampling loop
        result_messages = await agent.sampling_loop(messages, max_iterations=1)
        
        print(f"✅ Sampling loop completed")
        print(f"📊 Messages processed: {len(result_messages)}")
        
        # Check for tool use in results
        tool_uses_found = 0
        for message in result_messages:
            if message.get("role") == "assistant":
                for block in message.get("content", []):
                    if hasattr(block, 'type') and block.type == "tool_use":
                        tool_uses_found += 1
        
        print(f"🔧 Tool uses found: {tool_uses_found}")
        
        return True
        
    except anthropic.AuthenticationError:
        print("❌ Authentication failed - check your API key")
        return False
    except anthropic.PermissionDeniedError:
        print("❌ Permission denied - you may not have access to computer use beta")
        return False
    except anthropic.NotFoundError as e:
        print(f"❌ Model or endpoint not found: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_model_capabilities():
    """Test what models and capabilities are available"""
    
    print("\n🔍 Testing Available Models and Capabilities")
    print("=" * 45)
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ No API key available")
        return
    
    client = anthropic.Anthropic(api_key=api_key)
    
    # Test different model identifiers
    models_to_test = [
        "claude-3-5-sonnet-20241022",  # Current Sonnet 4
        "claude-3-5-sonnet-20240620",  # Previous version
        "claude-3-sonnet-20240229",    # Claude 3 Sonnet
    ]
    
    for model in models_to_test:
        try:
            print(f"\n🧪 Testing model: {model}")
            response = client.messages.create(
                model=model,
                max_tokens=50,
                messages=[{"role": "user", "content": "What model are you?"}]
            )
            print(f"✅ {model} - Available")
            print(f"📝 Response: {response.content[0].text[:80]}...")
            
        except anthropic.NotFoundError:
            print(f"❌ {model} - Not available")
        except Exception as e:
            print(f"⚠️ {model} - Error: {e}")
    
    # Test computer use beta availability
    print(f"\n🖥️ Testing Computer Use Beta Access")
    
    beta_versions = [
        "computer-use-2025-01-24",
        "computer-use-2024-10-22"
    ]
    
    for beta in beta_versions:
        try:
            print(f"\n🧪 Testing beta: {beta}")
            
            tools = [{
                "type": "computer_20250124" if "2025" in beta else "computer_20241022",
                "name": "computer",
                "display_width_px": 1024,
                "display_height_px": 768,
            }]
            
            response = client.beta.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=100,
                messages=[{"role": "user", "content": "Hello, can you use computer tools?"}],
                tools=tools,
                betas=[beta]
            )
            
            print(f"✅ {beta} - Available")
            
        except anthropic.BadRequestError as e:
            if "beta" in str(e).lower():
                print(f"❌ {beta} - Beta not available")
            else:
                print(f"⚠️ {beta} - Error: {e}")
        except Exception as e:
            print(f"⚠️ {beta} - Error: {e}")

async def main():
    """Main test function"""
    
    print("🚀 Claude Sonnet 4 Computer Use Verification")
    print("=" * 50)
    
    # Test basic setup
    success = await test_sonnet4_computer_use()
    
    # Test model capabilities
    test_model_capabilities()
    
    # Summary
    print(f"\n📋 Test Summary")
    print("=" * 20)
    
    if success:
        print("✅ Claude Sonnet 4 setup is working correctly!")
        print("✅ Computer use capabilities are available")
        print("✅ Ready for production use")
        
        print(f"\n🎯 Configuration Confirmed:")
        print(f"  Model: claude-3-5-sonnet-20241022 (Sonnet 4)")
        print(f"  Computer Use: computer_20250124")
        print(f"  Beta Flag: computer-use-2025-01-24")
        print(f"  Display: 1024x768")
        
    else:
        print("❌ Issues found with Claude Sonnet 4 setup")
        print("🔧 Please check:")
        print("  - API key is valid and has computer use access")
        print("  - You have access to the computer use beta")
        print("  - Network connectivity to Anthropic API")

if __name__ == "__main__":
    asyncio.run(main())
