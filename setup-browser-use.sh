#!/bin/bash

# Browser-Use Cloud API Setup Script
# This script helps you configure the Browser-Use Cloud API key

echo "================================================"
echo "Browser-Use Cloud API Setup"
echo "================================================"
echo ""
echo "The browser-use Cloud API integration is ready!"
echo ""
echo "To activate it, you need to add your API key to the .env file:"
echo ""
echo "1. Get your API key from:"
echo "   https://cloud.browser-use.com/billing"
echo ""
echo "2. Add this line to your .env file:"
echo "   BROWSER_USE_API_KEY=your_api_key_here"
echo ""
echo "3. Restart the application"
echo ""
echo "================================================"
echo ""
echo "Features available after configuration:"
echo "- Ultra-fast browser automation (Groq mode: $0.01/step)"
echo "- Smart browser automation (o3 mode: $0.03/step)"
echo "- Human-in-the-loop collaboration"
echo "- Live browser session viewing in iframe"
echo "- Stealth mode enabled by default"
echo ""
echo "Available tools for Ron:"
echo "- browser_use_cloud_automation"
echo "- browser_use_cloud_pause"
echo "- browser_use_cloud_resume"
echo "- browser_use_cloud_status"
echo "- browser_use_cloud_stop"
echo "- browser_use_cloud_list_active"
echo "- browser_use_cloud_account_status"
echo ""
echo "================================================"

# Check if API key is already configured
if [ -f ".env" ]; then
    if grep -q "BROWSER_USE_API_KEY=" ".env"; then
        echo "✓ BROWSER_USE_API_KEY found in .env file"
        echo ""
        # Test if the key is set to a real value
        if grep -q "BROWSER_USE_API_KEY=YOUR" ".env"; then
            echo "⚠️  But it appears to be a placeholder. Please update with your actual API key."
        else
            echo "✅ Browser-Use Cloud API is configured and ready!"
        fi
    else
        echo "⚠️  BROWSER_USE_API_KEY not found in .env file"
        echo ""
        echo "To add it manually:"
        echo 'echo "BROWSER_USE_API_KEY=your_api_key_here" >> .env'
    fi
else
    echo "⚠️  No .env file found. Please create one or ask your administrator for help."
fi

echo ""
echo "================================================"