# Fix for deep research endpoint to ensure it uses the actual deep research agent

# In backend/api.py, replace the deep_research_sse function (lines 690-872) with:

@app.post("/api/run_sse")
async def deep_research_sse(request: DeepResearchRequest):
    """
    Deep Research Agent SSE endpoint.
    Streams research progress and results in real-time.
    """
    logger.info(f"=== DEEP RESEARCH ENDPOINT CALLED ===")
    logger.info(f"DEEP_RESEARCH_AVAILABLE: {DEEP_RESEARCH_AVAILABLE}")
    logger.info(f"Request: sessionId={request.sessionId}, userId={request.userId}, message={request.message[:100]}...")
    
    if not DEEP_RESEARCH_AVAILABLE:
        logger.warning("Deep Research Agent not available, falling back to Claude")
        # Fallback to regular Claude chat with enhanced research prompt
        try:
            # Create enhanced research prompt
            research_prompt = f"""Conduct deep research on the following topic. Use web search extensively to gather comprehensive information from multiple sources. Provide a detailed analysis with citations.

Topic: {request.message}

Please:
1. Search for relevant information from multiple authoritative sources
2. Synthesize findings into a comprehensive report
3. Include citations for all claims
4. Highlight key insights and recommendations
5. Consider multiple perspectives on the topic"""
            
            # Stream the response in SSE format
            async def event_stream():
                async for event in claude_agent.execute_with_tools(
                    messages=[{"role": "user", "content": research_prompt}],
                    temperature=0.0,
                    max_tokens=32000,
                    enable_caching=True,
                    cache_ttl="5m",
                    enable_thinking=True,
                    thinking_budget=30000,
                    enable_citations=True,
                    stream=True
                ):
                    # Convert to deep research SSE format
                    sse_event = {
                        "content": {
                            "parts": [{"text": getattr(event, 'delta', {}).get('text', '')}],
                            "role": "model"
                        },
                        "author": "research_agent",
                        "actions": {"stateDelta": {}, "artifactDelta": {}},
                        "id": f"event_{datetime.now().timestamp()}",
                        "timestamp": datetime.now().timestamp()
                    }
                    yield f"data: {json.dumps(sse_event)}\n\n"
            
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            logger.error(f"Error in Claude fallback: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Original deep research implementation with ADK agents
    logger.info("Using actual Deep Research Agent with Google ADK")
    try:
        logger.info(f"Deep research request received - sessionId: {request.sessionId}, userId: {request.userId}")
        
        # Import required classes
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        
        # Create session service
        session_service = InMemorySessionService()
        
        # Create session with the provided session ID
        await session_service.create_session(
            app_name=request.appName or APP_NAME,
            user_id=request.userId,
            session_id=request.sessionId
        )
        
        # Create runner with the session service
        runner = Runner(
            agent=deep_research_root_agent,
            app_name=request.appName or APP_NAME,
            session_service=session_service
        )
        
        # Create message for agent directly from the request
        message = genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=request.message)]
        )
        
        logger.info("Starting deep research agent execution...")
        
        # Stream response
        async def event_stream():
            try:
                event_count = 0
                # Run the agent and stream events
                async for event in runner.run_async(
                    user_id=request.userId,
                    session_id=request.sessionId,
                    new_message=message
                ):
                    event_count += 1
                    if event_count % 10 == 0:
                        logger.info(f"Processed {event_count} events from deep research agent")
                    
                    # Convert event to format expected by frontend
                    event_data = {
                        "content": None,
                        "usageMetadata": {
                            "candidatesTokenCount": 0,
                            "promptTokenCount": 0, 
                            "totalTokenCount": 0
                        },
                        "author": getattr(event, 'author', 'unknown'),
                        "actions": {
                            "stateDelta": {},
                            "artifactDelta": {},
                            "requestedAuthConfigs": {}
                        },
                        "longRunningToolIds": [],
                        "id": getattr(event, 'id', f"event_{datetime.now().timestamp()}"),
                        "timestamp": datetime.now().timestamp()
                    }
                    
                    # Add content if available
                    if hasattr(event, 'content') and event.content:
                        event_data["content"] = {
                            "parts": [{"text": str(event.content)}],
                            "role": "model"
                        }
                    
                    # Add state delta information from event actions
                    if hasattr(event, 'actions') and event.actions:
                        if hasattr(event.actions, 'state_delta') and event.actions.state_delta:
                            event_data["actions"]["stateDelta"] = event.actions.state_delta
                        if hasattr(event.actions, 'artifact_delta') and event.actions.artifact_delta:
                            event_data["actions"]["artifactDelta"] = event.actions.artifact_delta
                    
                    # Add session state information
                    # Get the session from the session service
                    session = await session_service.get_session(
                        app_name=request.appName or APP_NAME,
                        user_id=request.userId,
                        session_id=request.sessionId
                    )
                    if session and hasattr(session, 'state') and session.state:
                        # Add research plan if available
                        if "research_plan" in session.state:
                            event_data["actions"]["stateDelta"]["research_plan"] = session.state["research_plan"]
                        
                        # Add final report if available  
                        if "final_report_with_citations" in session.state:
                            event_data["actions"]["stateDelta"]["final_report_with_citations"] = session.state["final_report_with_citations"]
                        
                        # Add other important state fields
                        if "section_research_findings" in session.state:
                            event_data["actions"]["stateDelta"]["section_research_findings"] = session.state["section_research_findings"]
                        if "report_sections" in session.state:
                            event_data["actions"]["stateDelta"]["report_sections"] = session.state["report_sections"]
                        if "research_evaluation" in session.state:
                            event_data["actions"]["stateDelta"]["research_evaluation"] = session.state["research_evaluation"]
                        
                        # Add sources and url mapping
                        if "sources" in session.state:
                            event_data["actions"]["stateDelta"]["sources"] = session.state["sources"]
                        if "url_to_short_id" in session.state:
                            event_data["actions"]["stateDelta"]["url_to_short_id"] = session.state["url_to_short_id"]
                    
                    yield f"data: {json.dumps(event_data)}\n\n"
                
                logger.info(f"Deep research completed. Total events: {event_count}")
                    
            except Exception as e:
                logger.error(f"Error in deep research event stream: {str(e)}", exc_info=True)
                error_event = {
                    "content": {
                        "parts": [{"text": f"Error: {str(e)}"}],
                        "role": "model"
                    },
                    "author": "error_handler",
                    "actions": {"stateDelta": {}, "artifactDelta": {}, "requestedAuthConfigs": {}},
                    "id": f"error_{datetime.now().timestamp()}",
                    "timestamp": datetime.now().timestamp()
                }
                yield f"data: {json.dumps(error_event)}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in deep research implementation: {str(e)}", exc_info=True)
        # Don't fall back to Claude here - raise the actual error
        raise HTTPException(status_code=500, detail=f"Deep Research Agent error: {str(e)}")