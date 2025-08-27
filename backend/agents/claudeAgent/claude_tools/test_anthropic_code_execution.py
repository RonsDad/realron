"""
Test script for Anthropic code execution functionality
"""

import asyncio
import os
import sys
import logging

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from backend.agents.claudeAgent.claude_tools.anthropic_code_execution import (
    execute_code, create_visualization, analyze_data
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_basic_code_execution():
    """Test basic code execution without file creation"""
    print("\n=== Test 1: Basic Code Execution ===")
    
    code = """
print("Hello from Anthropic Code Execution!")
x = 5
y = 10
result = x + y
print(f"The result of {x} + {y} = {result}")
"""
    
    result = await execute_code(code=code, language="python")
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    print(f"Error: {result.get('error', 'None')}")
    return result


async def test_code_with_file_creation():
    """Test code execution with file creation"""
    print("\n=== Test 2: Code Execution with File Creation ===")
    
    code = """
import json

# Create some data
data = {
    "test": "successful",
    "timestamp": "2024-12-24T12:00:00Z",
    "results": [1, 2, 3, 4, 5]
}

# Save to file
with open("test_output.json", "w") as f:
    json.dump(data, f, indent=2)

print("File created successfully!")
"""
    
    result = await execute_code(
        code=code, 
        language="python", 
        create_files=True, 
        download_files=True
    )
    
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    print(f"Files created: {result['files_created']}")
    print(f"Files downloaded: {result['files_downloaded']}")
    return result


async def test_matplotlib_visualization():
    """Test matplotlib visualization creation"""
    print("\n=== Test 3: Matplotlib Visualization ===")
    
    plot_code = """
# Create sample data
x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

# Create a simple line plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-o', linewidth=2, markersize=8)
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Simple Line Plot Test')
plt.grid(True, alpha=0.3)
"""
    
    result = await create_visualization(
        plot_code=plot_code,
        filename="test_plot.png"
    )
    
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    print(f"Files created: {result['files_created']}")
    print(f"Files downloaded: {result['files_downloaded']}")
    return result


async def test_data_analysis():
    """Test data analysis with output"""
    print("\n=== Test 4: Data Analysis with Output ===")
    
    analysis_code = """
# Create sample data for analysis
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'Score': [85, 92, 78, 91, 88],
    'Department': ['HR', 'IT', 'Sales', 'IT', 'HR']
}

# Create DataFrame
df = pd.DataFrame(data)

# Add some calculated columns
df['Pass'] = df['Score'] >= 80
df['Age_Group'] = pd.cut(df['Age'], bins=[0, 30, 35, 100], labels=['Young', 'Mid', 'Senior'])

print(f"Data analysis complete. Shape: {df.shape}")
print(f"\\nSummary statistics:\\n{df.describe()}")
"""
    
    # Test CSV output
    result_csv = await analyze_data(
        analysis_code=analysis_code,
        output_format="csv"
    )
    
    print(f"CSV Success: {result_csv['success']}")
    print(f"Files created: {result_csv['files_created']}")
    
    # Test JSON output
    result_json = await analyze_data(
        analysis_code=analysis_code,
        output_format="json"
    )
    
    print(f"JSON Success: {result_json['success']}")
    print(f"Files created: {result_json['files_created']}")
    
    return result_csv, result_json


async def test_error_handling():
    """Test error handling"""
    print("\n=== Test 5: Error Handling ===")
    
    # Test with syntax error
    bad_code = """
print("This will work")
this will cause a syntax error
"""
    
    result = await execute_code(code=bad_code, language="python")
    print(f"Success: {result['success']}")
    print(f"Error: {result.get('error', 'None')}")
    
    return result


async def main():
    """Run all tests"""
    print("Starting Anthropic Code Execution Tests...")
    print(f"API Key configured: {'ANTHROPIC_API_KEY' in os.environ}")
    
    if 'ANTHROPIC_API_KEY' not in os.environ:
        print("\nERROR: ANTHROPIC_API_KEY environment variable not set!")
        print("Please set your Anthropic API key before running tests.")
        return
    
    try:
        # Run tests
        await test_basic_code_execution()
        await test_code_with_file_creation()
        await test_matplotlib_visualization()
        await test_data_analysis()
        await test_error_handling()
        
        print("\n=== All Tests Completed ===")
        
    except Exception as e:
        logger.error(f"Test failed with error: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(main())