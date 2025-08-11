# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import logging
import re
from collections.abc import AsyncGenerator
from typing import Literal

from google.adk.agents import BaseAgent, LlmAgent, LoopAgent, SequentialAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.adk.planners import BuiltInPlanner
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool
# Assuming these specialist tools are defined and available
from google.adk.tools import pubmed_search, perplexity_sonar, get_fda_drug_summary
from google.genai import types as genai_types
from pydantic import BaseModel, Field

from .config import config


# --- Structured Output Models ---
class SearchQuery(BaseModel):
    """Model representing a specific search query for web search."""
    search_query: str = Field(
        description="A highly specific and targeted query for web search."
    )


class Feedback(BaseModel):
    """Model for providing evaluation feedback on research quality."""
    grade: Literal["pass", "fail"] = Field(
        description="Evaluation result. 'pass' if the research is sufficient, 'fail' if it needs revision."
    )
    comment: str = Field(
        description="Detailed explanation of the evaluation, highlighting strengths and/or weaknesses of the research."
    )
    follow_up_queries: list[SearchQuery] | None = Field(
        default=None,
        description="A list of specific, targeted follow-up search queries needed to fix research gaps. This should be null or empty if the grade is 'pass'.",
    )


# --- Callbacks & State Management ---
def accumulate_findings_callback(callback_context: CallbackContext) -> None:
    """Appends the latest research finding to a cumulative list in the session state."""
    session_state = callback_context.state
    current_finding = session_state.get("current_research_finding")
    if not current_finding:
        return

    cumulative_findings = session_state.get("research_findings", [])
    cumulative_findings.append(f"\n---\n{current_finding}\n---\n")
    session_state["research_findings"] = cumulative_findings
    del session_state["current_research_finding"]


def collect_research_sources_callback(callback_context: CallbackContext) -> None:
    """Collects and organizes web-based research sources from agent events."""
    session = callback_context._invocation_context.session
    url_to_short_id = callback_context.state.get("url_to_short_id", {})
    sources = callback_context.state.get("sources", {})
    id_counter = len(url_to_short_id) + 1
    for event in session.events:
        if not (event.grounding_metadata and event.grounding_metadata.grounding_chunks):
            continue
        chunks_info = {}
        for idx, chunk in enumerate(event.grounding_metadata.grounding_chunks):
            if not chunk.web:
                continue
            url = chunk.web.uri
            title = (
                chunk.web.title
                if chunk.web.title and chunk.web.title != chunk.web.domain
                else chunk.web.domain
            )
            if url not in url_to_short_id:
                short_id = f"src-{id_counter}"
                url_to_short_id[url] = short_id
                sources[short_id] = {
                    "short_id": short_id,
                    "title": title,
                    "url": url,
                    "domain": chunk.web.domain,
                    "supported_claims": [],
                }
                id_counter += 1
            chunks_info[idx] = url_to_short_id[url]
        if event.grounding_metadata.grounding_supports:
            for support in event.grounding_metadata.grounding_supports:
                confidence_scores = support.confidence_scores or []
                chunk_indices = support.grounding_chunk_indices or []
                for i, chunk_idx in enumerate(chunk_indices):
                    if chunk_idx in chunks_info:
                        short_id = chunks_info[chunk_idx]
                        confidence = (
                            confidence_scores[i] if i < len(confidence_scores) else 0.5
                        )
                        text_segment = support.segment.text if support.segment else ""
                        sources[short_id]["supported_claims"].append(
                            {"text_segment": text_segment, "confidence": confidence}
                        )
    callback_context.state["url_to_short_id"] = url_to_short_id
    callback_context.state["sources"] = sources


def citation_replacement_callback(
    callback_context: CallbackContext,
) -> genai_types.Content:
    """Replaces citation tags in a report with Markdown-formatted links."""
    final_report = callback_context.state.get("final_cited_report", "")
    sources = callback_context.state.get("sources", {})

    def tag_replacer(match: re.Match) -> str:
        short_id = match.group(1)
        if not (source_info := sources.get(short_id)):
            logging.warning(f"Invalid citation tag found and removed: {match.group(0)}")
            return ""
        display_text = source_info.get("title", source_info.get("domain", short_id))
        return f" [{display_text}]({source_info['url']})"

    processed_report = re.sub(
        r'<cite\s+source\s*=\s*["\']?\s*(src-\d+)\s*["\']?\s*/>',
        tag_replacer,
        final_report,
    )
    processed_report = re.sub(r"\s+([.,;:])", r"\1", processed_report)
    callback_context.state["final_report_with_citations"] = processed_report
    return genai_types.Content(parts=[genai_types.Part(text=processed_report)])


# --- Custom Agent for Loop Control ---
class EscalationChecker(BaseAgent):
    """Checks research evaluation and escalates to stop the loop if grade is 'pass'."""
    def __init__(self, name: str):
        super().__init__(name=name)

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        evaluation_result = ctx.session.state.get("research_evaluation")
        if evaluation_result and evaluation_result.get("grade") == "pass":
            logging.info(
                f"[{self.name}] Research evaluation passed. Escalating to stop loop."
            )
            yield Event(author=self.name, actions=EventActions(escalate=True))
        else:
            logging.info(
                f"[{self.name}] Research evaluation failed or not found. Loop will continue."
            )
            yield Event(author=self.name)


# --- SPECIALIST RESEARCH AGENTS ---

perplexity_pro_researcher = LlmAgent(
    model=config.worker_model,
    name="perplexity_pro_researcher",
    description="Your primary agent for fast, accurate, and broad real-time web research using Perplexity Sonar Pro.",
    planner=BuiltInPlanner(thinking_config=genai_types.ThinkingConfig(include_thoughts=True)),
    instruction="""
    You are a research agent powered by Perplexity Sonar Pro. Your mission is to conduct broad, real-time web research.
    You MUST use the `perplexity_sonar` tool with `mode="standard"`.
    If the topic is academic or scientific, set `search_domain="academic"`.
    Synthesize your findings into a clear, comprehensive summary.
    """,
    tools=[perplexity_sonar],
    output_key="current_research_finding",
    after_agent_callback=collect_research_sources_callback,
)

perplexity_reasoning_researcher = LlmAgent(
    model=config.worker_model,
    name="perplexity_reasoning_researcher",
    description="A specialist for complex analytical tasks requiring step-by-step reasoning (e.g., 'why', 'how', 'compare').",
    planner=BuiltInPlanner(thinking_config=genai_types.ThinkingConfig(include_thoughts=True)),
    instruction="""
    You are a specialized analytical agent using Perplexity Sonar Reasoning Pro. Your purpose is to tackle complex questions requiring logical deduction.
    You MUST use the `perplexity_sonar` tool with `mode="reasoning"`.
    Break down the problem, show your step-by-step analysis, and present a well-supported conclusion.
    """,
    tools=[perplexity_sonar],
    output_key="current_research_finding",
    after_agent_callback=collect_research_sources_callback,
)

perplexity_deep_research_agent = LlmAgent(
    model=config.worker_model,
    name="perplexity_deep_research_agent",
    description="A specialist for exhaustive, multi-faceted deep-dive investigations on a complex topic.",
    planner=BuiltInPlanner(thinking_config=genai_types.ThinkingConfig(include_thoughts=True)),
    instruction="""
    You are a deep research specialist using Perplexity Sonar Deep Research. Your goal is exhaustive, comprehensive coverage.
    You MUST use the `perplexity_sonar` tool with `mode="deep-research"`.
    Explore the topic from multiple dimensions (historical, technical, social, economic) to produce a definitive, in-depth report.
    """,
    tools=[perplexity_sonar],
    output_key="current_research_finding",
    after_agent_callback=collect_research_sources_callback,
)

pubmed_researcher = LlmAgent(
    model=config.worker_model,
    name="pubmed_researcher",
    description="A specialized agent for medical and scientific literature research using the PubMed database.",
    planner=BuiltInPlanner(thinking_config=genai_types.ThinkingConfig(include_thoughts=True)),
    instruction="""
    You are a medical literature specialist. Your only tool is `pubmed_search`.
    Use it to find relevant peer-reviewed articles for the given medical research task.
    Synthesize the findings, noting study types, key outcomes, and consensus in the literature.
    """,
    tools=[pubmed_search],
    output_key="current_research_finding",
)

fda_drug_researcher = LlmAgent(
    model=config.worker_model,
    name="fda_drug_researcher",
    description="Retrieves official FDA drug labeling information for specified medications.",
    planner=BuiltInPlanner(thinking_config=genai_types.ThinkingConfig(include_thoughts=True)),
    instruction="""
    You are an FDA drug information specialist. You will be given a task involving a specific medication.
    Use the `get_fda_drug_summary` tool to retrieve its official labeling data.
    Present the key information clearly and always include a disclaimer to consult a healthcare provider.
    """,
    tools=[get_fda_drug_summary],
    output_key="current_research_finding",
)


# --- DYNAMIC WORKFLOW AGENTS ---

task_dispatcher = LlmAgent(
    name="task_dispatcher",
    model=config.worker_model,
    description="Intelligently routes a research task to the most appropriate specialist agent.",
    instruction="""
    You are a hyper-efficient dispatcher. Your ONLY job is to analyze the provided research task and delegate it to the single most appropriate specialist agent.

    **REASONING DECISION TREE:**
    1.  **Medical Literature:** If the task mentions "PubMed", "clinical trials", "meta-analysis", "peer-reviewed", or specific medical research terminology, delegate to `pubmed_researcher`.
    2.  **FDA Drug Info:** If the task asks for "FDA information", "drug safety", "dosage", "side effects", or official data on a specific medication, delegate to `fda_drug_researcher`.
    3.  **Complex Reasoning:** If the task involves analysis, comparison, causality, or asks "why" or "how" (e.g., compare economic impacts, explain a process), delegate to `perplexity_reasoning_researcher`.
    4.  **Exhaustive Deep Dive:** If the task requires an "exhaustive report", a "deep dive", a "comprehensive overview", or investigates a broad, multi-faceted topic, delegate to `perplexity_deep_research_agent`.
    5.  **Default High-Quality Research:** For all other general research tasks, current events, or fact-finding, delegate to `perplexity_pro_researcher` as your primary, high-quality tool.

    Do NOT answer the question yourself. Your output must be a delegation call to the single best agent for the job.
    """,
    sub_agents=[
        perplexity_pro_researcher,
        perplexity_reasoning_researcher,
        perplexity_deep_research_agent,
        pubmed_researcher,
        fda_drug_researcher,
    ],
)

research_execution_loop = LoopAgent(
    name="research_execution_loop",
    description="Executes all [RESEARCH] tasks from the plan by dispatching them to specialist agents.",
    loop_control_key="research_task_list",
    sub_agents=[
        AgentTool(task_dispatcher, output_key="current_research_finding"),
        BaseAgent(
            name="result_accumulator",
            after_agent_callback=accumulate_findings_callback,
        ),
    ],
)

research_evaluator = LlmAgent(
    model=config.critic_model,
    name="research_evaluator",
    description="Critically evaluates the accumulated research findings.",
    instruction=f"""
    You are a meticulous quality assurance analyst evaluating the 'research_findings'.
    Your ONLY job is to assess the quality, depth, and completeness of the research.
    If you find significant gaps, assign "fail", write a detailed comment, and generate 5-7 specific follow-up queries.
    If the research is thorough, grade "pass".

    Current date: {datetime.datetime.now().strftime("%Y-%m-%d")}
    Your response must be a single, raw JSON object validating against the 'Feedback' schema.
    """,
    output_schema=Feedback,
    output_key="research_evaluation",
)

enhanced_search_executor = LlmAgent(
    model=config.worker_model,
    name="enhanced_search_executor",
    description="Executes follow-up searches and integrates new findings.",
    planner=BuiltInPlanner(thinking_config=genai_types.ThinkingConfig(include_thoughts=True)),
    instruction="""
    You are a specialist researcher executing a refinement pass. The previous research was graded as 'fail'.
    1. Review the 'research_evaluation' state key to understand the feedback.
    2. For EACH query in 'follow_up_queries', use the `task_dispatcher` tool to execute it with the most appropriate research agent.
    3. Synthesize the new findings from these queries and COMBINE them with the existing 'research_findings'.
    4. Your output MUST be the new, complete, and improved set of research findings.
    """,
    tools=[AgentTool(task_dispatcher)],
    output_key="research_findings",
    after_agent_callback=collect_research_sources_callback,
)


# --- PLANNING AND COMPOSITION AGENTS ---

plan_generator = LlmAgent(
    model=config.worker_model,
    name="plan_generator",
    description="Generates or refines a structured research plan.",
    instruction=f"""
    You are a master research strategist. Your job is to create a high-level ACTION PLAN.

    **RESEARCH PLAN (SO FAR):**
    {{ research_plan? }}

    **CORE INSTRUCTION: CLASSIFY TASK TYPES**
    Each item must be prefixed with `[RESEARCH]` for information gathering or `[DELIVERABLE]` for creating a final output. `[DELIVERABLE]` tasks define the final report's structure.

    **INITIAL PLAN CREATION:**
    - Create a bulleted list of 5 action-oriented `[RESEARCH]` goals.
    - Add at least one `[DELIVERABLE]` goal specifying the final output (e.g., `[DELIVERABLE] Write a comprehensive summary report.`).
    - Proactively add `[DELIVERABLE]` goals for implied outputs (e.g., a comparison goal implies a table).

    **PLAN REFINEMENT:**
    - Integrate user feedback by modifying goals or adding new ones, marking them with `[MODIFIED]` or `[NEW]`.

    **TOOL USE:**
    Strictly forbidden from researching content. Use `google_search` ONLY to clarify an ambiguous topic name.
    Current date: {datetime.datetime.now().strftime("%Y-%m-%d")}
    """,
    tools=[google_search],
)


report_composer = LlmAgent(
    model=config.critic_model,
    name="report_composer_with_citations",
    description="Transforms research data into a final, cited report based on the plan.",
    instruction="""
    You are a master report writer. Your task is to synthesize all available information into a single, polished research report.

    **INPUTS:**
    *   **The Blueprint (`research_plan`):** `{research_plan}`. The `[DELIVERABLE]` tasks define your report's structure.
    *   **The Raw Material (`research_findings`):** `{research_findings}`.
    *   **The Citations (`sources`):** `{sources}`.

    **EXECUTION:**
    1.  Follow the `research_plan`. For each `[DELIVERABLE]` task, generate that specific output (summary, table, etc.) as a section in your report.
    2.  **CRITICAL:** For every claim you make, you MUST insert an inline citation: `<cite source="src-ID_NUMBER" />`.
    3.  Do not include a "References" section. All citations must be inline.

    Produce a single, comprehensive report that fulfills all `[DELIVERABLE]` requirements from the plan.
    """,
    output_key="final_cited_report",
    after_agent_callback=citation_replacement_callback,
)


# --- ROOT AGENT & MAIN PIPELINE ---

class PlanExtractor(BaseAgent):
    """Extracts [RESEARCH] tasks from the plan to feed the execution loop."""
    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        research_plan_str = ctx.session.state.get("research_plan", "")
        research_tasks = re.findall(r"-\s*\[RESEARCH\].*", research_plan_str, re.IGNORECASE)
        ctx.session.state["research_task_list"] = research_tasks
        ctx.session.state["research_findings"] = []
        logging.info(f"Extracted {len(research_tasks)} research tasks for execution.")
        yield Event(author=self.name, content=f"Beginning execution of {len(research_tasks)} research tasks.")


research_pipeline = SequentialAgent(
    name="research_pipeline",
    description="Dynamically executes a research plan, iteratively refines results, and composes a report.",
    sub_agents=[
        PlanExtractor(name="plan_extractor"),
        research_execution_loop,
        LoopAgent(
            name="iterative_refinement_loop",
            max_iterations=config.max_search_iterations,
            sub_agents=[
                research_evaluator,
                EscalationChecker(name="escalation_checker"),
                enhanced_search_executor,
            ],
        ),
        report_composer,
    ],
)


interactive_planner_agent = LlmAgent(
    name="interactive_planner_agent",
    model=config.worker_model,
    description="The primary research assistant. Collaborates with the user to create a plan, then delegates execution.",
    instruction=f"""
    You are a research planning assistant. Your primary function is to convert ANY user request into a research plan.

    **CRITICAL RULE: Never answer a question directly.** Your one and only first step is to use the `plan_generator` tool to propose a research plan.

    **WORKFLOW:**
    1.  **Plan:** When the user provides a topic, immediately call `plan_generator` to create a draft plan. Present this plan to the user.
    2.  **Refine:** Incorporate user feedback, calling `plan_generator` again to refine the plan until it is approved.
    3.  **Delegate:** Once the user gives EXPLICIT approval (e.g., "looks good, run it"), you MUST delegate the task to the `research_pipeline` agent.

    Current date: {datetime.datetime.now().strftime("%Y-%m-%d")}
    Your job is to Plan, Refine, and Delegate. Do not perform any research yourself.
    """,
    sub_agents=[research_pipeline],
    tools=[AgentTool(plan_generator)],
    output_key="research_plan",
)

root_agent = interactive_planner_agent