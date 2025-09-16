"""
Orchestrator Hooks Extension - Integrates with Claude hooks for better agent visibility
"""
import asyncio
import json
import os
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

from backend.agents.claudeAgent.claude_tools.orchestrator_tools import (
    orchestrator,
    SharedAgentMemory
)

logger = logging.getLogger(__name__)

class HooksIntegratedOrchestrator:
    """
    Extended orchestrator that integrates with Claude hooks for agent output persistence
    """

    def __init__(self):
        self.base_orchestrator = orchestrator
        self.hooks_db_path = Path("/Users/timhunter/ron-ai/.claude/agent_outputs.db")
        self.session_extensions_path = Path("/Users/timhunter/ron-ai/.claude/session_extensions")
        self.frontend_exports_path = Path("/Users/timhunter/ron-ai/.claude/frontend_exports")

        # Monitor hook activity
        self.hook_activity = {
            "last_capture": None,
            "total_agents_captured": 0,
            "active_sessions": [],
            "failed_captures": 0
        }

    async def spawn_agent_with_hooks(
        self,
        agent_id: str,
        system_prompt: str,
        task: str,
        allowed_tools: List[str],
        context: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Spawn agent with hook integration"""

        # Set environment for hooks
        os.environ["ORCHESTRATOR_AGENT_ID"] = agent_id
        os.environ["ORCHESTRATOR_SESSION_ID"] = f"orch_{datetime.now().timestamp()}"

        logger.info(f"🔗 Spawning agent with hooks integration: {agent_id}")

        # Use base orchestrator
        result = await self.base_orchestrator.spawn_agent(
            agent_id=agent_id,
            system_prompt=system_prompt,
            task=task,
            allowed_tools=allowed_tools,
            context=context,
            **kwargs
        )

        if result.get("success"):
            # Track in hook activity
            self.hook_activity["active_sessions"].append({
                "agent_id": agent_id,
                "spawned_at": datetime.now().isoformat(),
                "session_id": result.get("session_id", "unknown")
            })

            logger.info(f"✅ Agent spawned with hooks: {agent_id}")

        return result

    async def execute_agent_with_hooks(self, agent_id: str) -> Dict[str, Any]:
        """Execute agent with enhanced hook monitoring"""

        logger.info(f"🚀 Executing agent with hooks monitoring: {agent_id}")

        # Execute with base orchestrator
        result = await self.base_orchestrator.execute_agent(agent_id)

        if result.get("success"):
            # Validate hook capture
            await self._validate_hook_capture(agent_id, result)

            # Update hook activity
            self.hook_activity["last_capture"] = datetime.now().isoformat()
            self.hook_activity["total_agents_captured"] += 1

            logger.info(f"✅ Agent executed with hooks validation: {agent_id}")
        else:
            self.hook_activity["failed_captures"] += 1
            logger.warning(f"⚠️ Agent execution failed, no hooks capture: {agent_id}")

        return result

    async def _validate_hook_capture(self, agent_id: str, result: Dict[str, Any]) -> bool:
        """Validate that hooks properly captured agent output"""

        try:
            # Check database capture
            db_captured = self._check_database_capture(agent_id)

            # Check file export
            file_exported = self._check_file_export(agent_id)

            # Check session extension
            session_extended = self._check_session_extension(agent_id)

            validation_status = {
                "agent_id": agent_id,
                "database_captured": db_captured,
                "file_exported": file_exported,
                "session_extended": session_extended,
                "fully_captured": db_captured and file_exported,
                "events_count": len(result.get("events", [])),
                "output_size": len(result.get("text", "")),
                "validated_at": datetime.now().isoformat()
            }

            # Log validation results
            if validation_status["fully_captured"]:
                logger.info(f"✅ Hook capture validated for {agent_id}: DB={db_captured}, File={file_exported}")
            else:
                logger.warning(f"⚠️ Incomplete hook capture for {agent_id}: DB={db_captured}, File={file_exported}")

            # Store validation record
            await self._store_validation_record(validation_status)

            return validation_status["fully_captured"]

        except Exception as e:
            logger.error(f"❌ Error validating hook capture for {agent_id}: {e}")
            return False

    def _check_database_capture(self, agent_id: str) -> bool:
        """Check if agent output was captured in database"""
        try:
            if not self.hooks_db_path.exists():
                return False

            conn = sqlite3.connect(str(self.hooks_db_path))
            cursor = conn.cursor()

            cursor.execute(
                "SELECT COUNT(*) FROM agent_outputs WHERE agent_id = ? AND status = 'captured'",
                (agent_id,)
            )

            count = cursor.fetchone()[0]
            conn.close()

            return count > 0

        except Exception as e:
            logger.error(f"Error checking database capture: {e}")
            return False

    def _check_file_export(self, agent_id: str) -> bool:
        """Check if agent output was exported to file"""
        try:
            export_file = self.frontend_exports_path / f"{agent_id}_latest.json"
            return export_file.exists()
        except Exception as e:
            logger.error(f"Error checking file export: {e}")
            return False

    def _check_session_extension(self, agent_id: str) -> bool:
        """Check if session was extended for this agent"""
        try:
            extension_file = self.session_extensions_path / "active_extensions.json"
            if not extension_file.exists():
                return False

            with open(extension_file, 'r') as f:
                data = json.load(f)

            sessions = data.get("sessions", [])
            return any(s.get("agent_id") == agent_id for s in sessions)

        except Exception as e:
            logger.error(f"Error checking session extension: {e}")
            return False

    async def _store_validation_record(self, validation_status: Dict[str, Any]):
        """Store validation record for monitoring"""
        try:
            validation_dir = Path("/Users/timhunter/ron-ai/.claude/validation")
            validation_dir.mkdir(exist_ok=True)

            validation_file = validation_dir / f"{validation_status['agent_id']}_validation.json"

            with open(validation_file, 'w') as f:
                json.dump(validation_status, f, indent=2)

        except Exception as e:
            logger.error(f"Error storing validation record: {e}")

    async def get_captured_agents_status(self) -> Dict[str, Any]:
        """Get status of all captured agents"""
        try:
            # Get database agents
            db_agents = self._get_database_agents()

            # Get file exports
            file_agents = self._get_file_agents()

            # Get session extensions
            extended_sessions = self._get_extended_sessions()

            # Combine status
            status = {
                "hook_activity": self.hook_activity,
                "database_agents": len(db_agents),
                "file_exports": len(file_agents),
                "extended_sessions": len(extended_sessions),
                "total_captured": len(set([a["agent_id"] for a in db_agents] + [a["agent_id"] for a in file_agents])),
                "last_updated": datetime.now().isoformat(),
                "agents": {
                    "database": db_agents,
                    "files": file_agents,
                    "extensions": extended_sessions
                }
            }

            return status

        except Exception as e:
            logger.error(f"Error getting captured agents status: {e}")
            return {"error": str(e)}

    def _get_database_agents(self) -> List[Dict[str, Any]]:
        """Get agents from database"""
        try:
            if not self.hooks_db_path.exists():
                return []

            conn = sqlite3.connect(str(self.hooks_db_path))
            cursor = conn.cursor()

            cursor.execute("""
                SELECT agent_id, agent_type, timestamp, status, session_id
                FROM agent_outputs
                WHERE timestamp > ?
                ORDER BY timestamp DESC
            """, ((datetime.now() - timedelta(hours=6)).isoformat(),))

            results = cursor.fetchall()
            conn.close()

            return [
                {
                    "agent_id": row[0],
                    "agent_type": row[1],
                    "timestamp": row[2],
                    "status": row[3],
                    "session_id": row[4],
                    "source": "database"
                }
                for row in results
            ]

        except Exception as e:
            logger.error(f"Error getting database agents: {e}")
            return []

    def _get_file_agents(self) -> List[Dict[str, Any]]:
        """Get agents from file exports"""
        try:
            if not self.frontend_exports_path.exists():
                return []

            agents = []
            for export_file in self.frontend_exports_path.glob("*_latest.json"):
                if export_file.name == "agent_index.json":
                    continue

                try:
                    with open(export_file, 'r') as f:
                        data = json.load(f)

                    agents.append({
                        "agent_id": data.get("agent_id", "unknown"),
                        "agent_type": data.get("agent_type", "unknown"),
                        "timestamp": data.get("timestamp", ""),
                        "status": "exported",
                        "session_id": data.get("session_id", ""),
                        "source": "file",
                        "file": export_file.name
                    })

                except Exception as e:
                    logger.warning(f"Error reading export file {export_file}: {e}")

            return agents

        except Exception as e:
            logger.error(f"Error getting file agents: {e}")
            return []

    def _get_extended_sessions(self) -> List[Dict[str, Any]]:
        """Get extended sessions"""
        try:
            extension_file = self.session_extensions_path / "active_extensions.json"
            if not extension_file.exists():
                return []

            with open(extension_file, 'r') as f:
                data = json.load(f)

            return data.get("sessions", [])

        except Exception as e:
            logger.error(f"Error getting extended sessions: {e}")
            return []

    async def cleanup_expired_captures(self):
        """Clean up expired captures and sessions"""
        try:
            # Clean up database records older than 24 hours
            if self.hooks_db_path.exists():
                conn = sqlite3.connect(str(self.hooks_db_path))
                cursor = conn.cursor()

                cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
                cursor.execute("DELETE FROM agent_outputs WHERE expires_at < ?", (cutoff,))

                deleted_count = cursor.rowcount
                conn.commit()
                conn.close()

                if deleted_count > 0:
                    logger.info(f"🧹 Cleaned up {deleted_count} expired database records")

            # Clean up old file exports
            if self.frontend_exports_path.exists():
                cutoff_time = datetime.now() - timedelta(hours=12)
                cleaned_files = 0

                for export_file in self.frontend_exports_path.glob("*_latest.json"):
                    if export_file.name == "agent_index.json":
                        continue

                    if export_file.stat().st_mtime < cutoff_time.timestamp():
                        export_file.unlink()
                        cleaned_files += 1

                if cleaned_files > 0:
                    logger.info(f"🧹 Cleaned up {cleaned_files} expired export files")

        except Exception as e:
            logger.error(f"Error cleaning up expired captures: {e}")

# Global instance
hooks_integrated_orchestrator = HooksIntegratedOrchestrator()

# Tool functions for Claude to use

async def spawn_agent_with_visibility(
    agent_id: str,
    specialty: str,
    task: str,
    allowed_tools: List[str],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Spawn agent with full hooks-based visibility and persistence
    """
    from backend.agents.claudeAgent.claude_tools.orchestrator_tools import spawn_healthcare_agent

    logger.info(f"🔗 Spawning agent with hooks-based visibility: {agent_id}")

    # Use the base spawn function but with hooks monitoring
    result = await hooks_integrated_orchestrator.spawn_agent_with_hooks(
        agent_id=agent_id,
        system_prompt=get_specialty_system_prompt(specialty),
        task=task,
        allowed_tools=allowed_tools,
        context=context
    )

    return result

async def execute_agent_with_visibility(agent_id: str) -> Dict[str, Any]:
    """
    Execute agent with hooks-based output capture and validation
    """
    logger.info(f"🚀 Executing agent with visibility: {agent_id}")

    result = await hooks_integrated_orchestrator.execute_agent_with_hooks(agent_id)

    return result

async def get_captured_agents_summary() -> Dict[str, Any]:
    """
    Get summary of all captured agent outputs
    """
    logger.info("📊 Getting captured agents summary")

    status = await hooks_integrated_orchestrator.get_captured_agents_status()

    return {
        "success": True,
        "summary": status,
        "message": f"Found {status.get('total_captured', 0)} captured agents"
    }

def get_specialty_system_prompt(specialty: str) -> str:
    """Get system prompt for specialty"""
    prompts = {
        "clinical_researcher": (
            "You are a Clinical Research Agent specializing in evidence-based medicine. "
            "Your outputs will be captured and made visible to the frontend for user access."
        ),
        "insurance_researcher": (
            "You are an Insurance Research Agent specializing in coverage and authorization. "
            "Your outputs will be captured and made visible to the frontend for user access."
        ),
        "patient_advocate": (
            "You are a Patient Advocate Agent helping navigate healthcare systems. "
            "Your outputs will be captured and made visible to the frontend for user access."
        )
    }

    return prompts.get(specialty, f"You are a {specialty} healthcare agent.")