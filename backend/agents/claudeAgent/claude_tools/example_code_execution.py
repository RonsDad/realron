"""
Example usage of Anthropic Code Execution functionality
This demonstrates how to use the code execution tools in your application
"""

import asyncio
import os
from typing import Dict, Any

# Assuming this is imported from your tools module
from backend.agents.claudeAgent.claude_tools.tools import (
    execute_code,
    create_data_visualization,
    analyze_data_with_output
)


async def example_basic_execution():
    """Example: Execute simple Python code"""
    print("=== Example 1: Basic Code Execution ===\n")
    
    code = """
# Calculate factorial
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Test the function
for i in range(1, 6):
    print(f"factorial({i}) = {factorial(i)}")
"""
    
    result = await execute_code(code=code, language="python")
    
    if result['success']:
        print("Output:")
        print(result['output'])
    else:
        print(f"Error: {result['error']}")


async def example_create_visualization():
    """Example: Create a data visualization"""
    print("\n=== Example 2: Create Data Visualization ===\n")
    
    plot_code = """
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create the plot
plt.figure(figsize=(12, 6))

plt.subplot(1, 2, 1)
plt.plot(x, y1, 'b-', label='sin(x)')
plt.plot(x, y2, 'r-', label='cos(x)')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Trigonometric Functions')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.scatter(x[::5], y1[::5], c='blue', s=50, alpha=0.6, label='sin(x) samples')
plt.scatter(x[::5], y2[::5], c='red', s=50, alpha=0.6, label='cos(x) samples')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Sample Points')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
"""
    
    result = await create_data_visualization(
        plot_code=plot_code,
        filename="trig_functions.png"
    )
    
    if result['success']:
        print("Visualization created successfully!")
        print(f"Files created: {result['files_created']}")
        if result['files_downloaded']:
            print(f"Downloaded to: {result['files_downloaded'][0]['path']}")
    else:
        print(f"Error: {result['error']}")


async def example_data_analysis():
    """Example: Analyze data and save results"""
    print("\n=== Example 3: Data Analysis with Output ===\n")
    
    analysis_code = """
import numpy as np

# Generate sample sales data
np.random.seed(42)
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
regions = ['North', 'South', 'East', 'West']

# Create sales data
data = []
for month in months:
    for region in regions:
        sales = np.random.randint(10000, 50000)
        profit_margin = np.random.uniform(0.1, 0.3)
        profit = sales * profit_margin
        data.append({
            'Month': month,
            'Region': region,
            'Sales': sales,
            'Profit_Margin': round(profit_margin, 3),
            'Profit': round(profit, 2)
        })

# Create DataFrame
df = pd.DataFrame(data)

# Add summary statistics
df['Quarter'] = pd.cut(range(len(df)), bins=4, labels=['Q1', 'Q2', 'Q3', 'Q4'])

# Calculate regional totals
regional_summary = df.groupby('Region').agg({
    'Sales': 'sum',
    'Profit': 'sum',
    'Profit_Margin': 'mean'
}).round(2)

print("Regional Summary:")
print(regional_summary)
print(f"\\nTotal Sales: ${df['Sales'].sum():,}")
print(f"Total Profit: ${df['Profit'].sum():,.2f}")
print(f"Average Profit Margin: {df['Profit_Margin'].mean():.1%}")
"""
    
    # Save as CSV
    result = await analyze_data_with_output(
        analysis_code=analysis_code,
        output_format="csv"
    )
    
    if result['success']:
        print("Analysis completed successfully!")
        print(f"Output:\n{result['output']}")
        if result['files_downloaded']:
            print(f"\nResults saved to: {result['files_downloaded'][0]['path']}")
    else:
        print(f"Error: {result['error']}")


async def example_code_with_files():
    """Example: Code that creates multiple files"""
    print("\n=== Example 4: Code Creating Multiple Files ===\n")
    
    code = """
import json
import csv

# Create JSON data
config = {
    "app_name": "DataProcessor",
    "version": "1.0.0",
    "settings": {
        "debug": False,
        "max_workers": 4,
        "timeout": 30
    }
}

with open("config.json", "w") as f:
    json.dump(config, f, indent=2)
print("Created config.json")

# Create CSV data
headers = ["ID", "Name", "Value", "Status"]
rows = [
    [1, "Alpha", 100, "Active"],
    [2, "Beta", 200, "Pending"],
    [3, "Gamma", 300, "Active"],
    [4, "Delta", 400, "Inactive"]
]

with open("data.csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)
print("Created data.csv")

# Create a simple text report
report = '''
Data Processing Report
=====================

Date: 2024-12-24
Status: Complete

Summary:
- Files processed: 2
- Records created: 4
- Errors: 0

All operations completed successfully.
'''

with open("report.txt", "w") as f:
    f.write(report)
print("Created report.txt")

print("\\nAll files created successfully!")
"""
    
    result = await execute_code(
        code=code,
        language="python",
        create_files=True,
        download_files=True
    )
    
    if result['success']:
        print("Code executed successfully!")
        print(f"\nOutput:\n{result['output']}")
        print(f"\nFiles created: {len(result['files_created'])}")
        for file_info in result['files_downloaded']:
            print(f"- {file_info['filename']} ({file_info['size']} bytes)")
    else:
        print(f"Error: {result['error']}")


async def main():
    """Run all examples"""
    print("Anthropic Code Execution Examples")
    print("=================================\n")
    
    # Check if API key is set
    if 'ANTHROPIC_API_KEY' not in os.environ:
        print("ERROR: Please set ANTHROPIC_API_KEY environment variable")
        return
    
    try:
        # Run examples
        await example_basic_execution()
        await example_create_visualization()
        await example_data_analysis()
        await example_code_with_files()
        
        print("\n=== All examples completed! ===")
        
    except Exception as e:
        print(f"\nError running examples: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())