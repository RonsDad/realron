#!/usr/bin/env python3
"""
Quick test to show actual generated code from Claude
"""

import asyncio
import os
from anthropic import AsyncAnthropic

async def show_real_code_generation():
    api_key = "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"
    
    claude = AsyncAnthropic(api_key=api_key)
    
    print("🚀 Generating real healthcare code with Claude...")
    
    response = await claude.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": """Create a simple but complete Python script for a medication cost calculator. 

Requirements:
- Calculate monthly medication costs
- Compare generic vs brand name prices
- Show potential savings
- Include proper error handling
- Make it immediately runnable

Format as:

### medication_calculator.py
```python
[complete working code]
```"""
        }]
    )
    
    content = response.content[0].text
    print("✅ Code generated! Here's what Claude created:\n")
    print("="*60)
    print(content)
    print("="*60)
    
    # Extract just the Python code
    import re
    code_match = re.search(r'```python\n(.*?)\n```', content, re.DOTALL)
    if code_match:
        code = code_match.group(1)
        
        # Save to file
        with open('/Users/timhunter/ron-ai/aws-native-implementation/generated_medication_calculator.py', 'w') as f:
            f.write(code)
        
        print(f"\n💾 Code saved to: generated_medication_calculator.py")
        print(f"📝 Code length: {len(code)} characters")
        print(f"📄 Lines of code: {len(code.split('\\n'))}")
        
        # Try to run it
        print(f"\n🚀 Testing the generated code...")
        try:
            exec(code)
            print("✅ Code executed successfully!")
        except Exception as e:
            print(f"⚠️  Code needs input or has dependencies: {e}")
    
    return content

if __name__ == "__main__":
    asyncio.run(show_real_code_generation())
