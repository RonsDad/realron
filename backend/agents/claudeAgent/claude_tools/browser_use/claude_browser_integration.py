import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
from lmnr import Laminar

load_dotenv()
Laminar.initialize()

from browser_use import Agent
from browser_use.llm import ChatOpenAI

# Get and validate OpenAI API key
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Log that we're using the key (first 10 chars only for security)
import logging
logger = logging.getLogger(__name__)
logger.info(f"Using OpenAI API key: {openai_api_key[:10]}...")

llm = ChatOpenAI(model='gpt-4o', api_key=openai_api_key, temperature=0.0)

async def run_agent(task_prompt, max_steps=100):  # Set to 100 for complex tasks
    """
    Run browser agent with dynamic task prompt
    
    Args:
        task_prompt (str): The task prompt to execute
        max_steps (int): Maximum number of steps for the agent
    """
    agent = Agent(
        task=task_prompt,
        llm=llm,
    )
    
    return await agent.run(max_steps=max_steps)

class ClaudeBrowserIntegration:
    async def analyze_healthcare_task(self, task, context):
        return await run_agent(task, max_steps=100)  # Set to 100 for complex tasks
        
    async def cleanup(self):
        pass

async def main():
    # Example usage - replace with your actual task prompt
    task = """{{DYNAMIC_TASK_PROMPT}}"""
    
    result = await run_agent(task, max_steps=100)  # Set to 100 for complex tasks
    return result

if __name__ == "__main__":
    asyncio.run(main())