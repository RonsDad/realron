# Fix Browserbase MCP API Key Configuration

## Issue

Browserbase Stagehand tools (observe, act, extract) are failing because they need `GOOGLE_GENERATIVE_AI_API_KEY` but your .env file has `GEMINI_API_KEY`.

## Solution

Add this line to your `.env` file:

```bash
# Add this line to fix Browserbase Stagehand tools
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyAhvI0pRk0fZhwMtJ6x-MxSMwox6-Xf_KY
```

## What This Fixes

- ✅ browserbase_stagehand_observe will work
- ✅ browserbase_stagehand_act will work
- ✅ browserbase_stagehand_extract will work
- ✅ All intelligent browser automation will be functional

## Current Status

- ✅ Live session URLs working: `https://www.browserbase.com/sessions/[session-id]`
- ✅ Basic navigation and screenshots working
- ❌ Intelligent tools blocked by missing API key

## After Adding the API Key

1. Restart the Ron AI backend to pick up the new environment variable
2. Test the Browserbase tools again
3. Live session URLs should be embeddable in Ron AI's iframe for real-time browser automation visibility

The API key value is already in your .env file as GEMINI_API_KEY - just need to duplicate it with the correct variable name that Stagehand expects.
