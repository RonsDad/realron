"""
Agent Message Bus for Inter-Agent Communication
Implements event-driven architecture for agent coordination
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Callable, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from enum import Enum
import uuid

logger = logging.getLogger(__name__)

class MessagePriority(Enum):
    """Message priority levels"""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4

class MessageStatus(Enum):
    """Message delivery status"""
    PENDING = "pending"
    DELIVERED = "delivered"
    ACKNOWLEDGED = "acknowledged"
    PROCESSED = "processed"
    FAILED = "failed"
    TIMEOUT = "timeout"

@dataclass
class Message:
    """Enhanced message structure for agent communication"""
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: Optional[str] = None  # For request-response tracking
    source_agent_id: str = ""
    target_agent_id: Optional[str] = None  # None for broadcasts
    message_type: str = ""  # handoff, delegation, pipeline, broadcast, response
    priority: MessagePriority = MessagePriority.NORMAL
    payload: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    cache_hints: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    expiry: Optional[datetime] = None
    status: MessageStatus = MessageStatus.PENDING
    delivery_attempts: int = 0
    max_retries: int = 3
    requires_acknowledgment: bool = True
    requires_response: bool = False
    response_timeout: int = 300  # seconds

@dataclass
class MessageRoute:
    """Defines message routing rules"""
    route_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source_pattern: Optional[str] = None  # Regex pattern for source agent
    target_pattern: Optional[str] = None  # Regex pattern for target agent
    message_type_pattern: Optional[str] = None  # Regex pattern for message type
    handler: Optional[Callable] = None
    priority: int = 0  # Higher priority routes are evaluated first
    active: bool = True

@dataclass
class Subscription:
    """Agent subscription to message types"""
    subscription_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str = ""
    message_types: List[str] = field(default_factory=list)
    filter_criteria: Dict[str, Any] = field(default_factory=dict)
    callback: Optional[Callable] = None
    active: bool = True

class MessageBus:
    """
    Centralized message bus for agent communication
    Implements pub-sub pattern with routing and persistence
    """
    
    def __init__(self, max_queue_size: int = 10000):
        # Core message handling
        self.message_queue: asyncio.Queue = asyncio.Queue(maxsize=max_queue_size)
        self.priority_queues: Dict[MessagePriority, asyncio.Queue] = {
            priority: asyncio.Queue() for priority in MessagePriority
        }
        
        # Message tracking
        self.messages: Dict[str, Message] = {}
        self.pending_responses: Dict[str, asyncio.Future] = {}
        self.message_history: List[Message] = []
        
        # Routing and subscriptions
        self.routes: List[MessageRoute] = []
        self.subscriptions: Dict[str, List[Subscription]] = {}  # agent_id -> subscriptions
        self.broadcast_subscriptions: Set[str] = set()  # agent_ids subscribed to broadcasts
        
        # Agent registry
        self.registered_agents: Set[str] = set()
        self.agent_handlers: Dict[str, Callable] = {}
        
        # Metrics
        self.metrics = {
            "messages_sent": 0,
            "messages_delivered": 0,
            "messages_failed": 0,
            "average_delivery_time": 0,
            "by_type": {},
            "by_agent": {}
        }
        
        # Background tasks
        self.running = False
        self.processor_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the message bus"""
        self.running = True
        self.processor_task = asyncio.create_task(self._process_messages())
        self.cleanup_task = asyncio.create_task(self._cleanup_expired())
        logger.info("Message bus started")
    
    async def stop(self):
        """Stop the message bus"""
        self.running = False
        if self.processor_task:
            self.processor_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Wait for pending responses
        for future in self.pending_responses.values():
            if not future.done():
                future.cancel()
        
        logger.info("Message bus stopped")
    
    def register_agent(
        self,
        agent_id: str,
        handler: Optional[Callable] = None
    ) -> bool:
        """Register an agent with the message bus"""
        if agent_id in self.registered_agents:
            logger.warning(f"Agent {agent_id} already registered")
            return False
        
        self.registered_agents.add(agent_id)
        if handler:
            self.agent_handlers[agent_id] = handler
        
        # Initialize metrics
        if agent_id not in self.metrics["by_agent"]:
            self.metrics["by_agent"][agent_id] = {
                "sent": 0,
                "received": 0,
                "failed": 0
            }
        
        logger.info(f"Agent {agent_id} registered")
        return True
    
    def unregister_agent(self, agent_id: str) -> bool:
        """Unregister an agent from the message bus"""
        if agent_id not in self.registered_agents:
            return False
        
        self.registered_agents.remove(agent_id)
        self.agent_handlers.pop(agent_id, None)
        
        # Clean up subscriptions
        self.subscriptions.pop(agent_id, None)
        self.broadcast_subscriptions.discard(agent_id)
        
        logger.info(f"Agent {agent_id} unregistered")
        return True
    
    def subscribe(
        self,
        agent_id: str,
        message_types: List[str],
        callback: Optional[Callable] = None,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> str:
        """Subscribe an agent to specific message types"""
        if agent_id not in self.registered_agents:
            raise ValueError(f"Agent {agent_id} not registered")
        
        subscription = Subscription(
            agent_id=agent_id,
            message_types=message_types,
            callback=callback or self.agent_handlers.get(agent_id),
            filter_criteria=filter_criteria or {}
        )
        
        if agent_id not in self.subscriptions:
            self.subscriptions[agent_id] = []
        
        self.subscriptions[agent_id].append(subscription)
        
        # Handle broadcast subscriptions
        if "broadcast" in message_types:
            self.broadcast_subscriptions.add(agent_id)
        
        logger.info(f"Agent {agent_id} subscribed to {message_types}")
        return subscription.subscription_id
    
    def unsubscribe(self, agent_id: str, subscription_id: str) -> bool:
        """Unsubscribe from message types"""
        if agent_id not in self.subscriptions:
            return False
        
        self.subscriptions[agent_id] = [
            s for s in self.subscriptions[agent_id]
            if s.subscription_id != subscription_id
        ]
        
        return True
    
    def add_route(
        self,
        source_pattern: Optional[str] = None,
        target_pattern: Optional[str] = None,
        message_type_pattern: Optional[str] = None,
        handler: Optional[Callable] = None,
        priority: int = 0
    ) -> str:
        """Add a routing rule"""
        route = MessageRoute(
            source_pattern=source_pattern,
            target_pattern=target_pattern,
            message_type_pattern=message_type_pattern,
            handler=handler,
            priority=priority
        )
        
        # Insert in priority order
        insert_pos = 0
        for i, r in enumerate(self.routes):
            if r.priority < priority:
                insert_pos = i
                break
        
        self.routes.insert(insert_pos, route)
        logger.info(f"Added route {route.route_id}")
        return route.route_id
    
    async def send_message(
        self,
        source_agent_id: str,
        target_agent_id: Optional[str],
        message_type: str,
        payload: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        priority: MessagePriority = MessagePriority.NORMAL,
        requires_response: bool = False,
        response_timeout: int = 300
    ) -> str:
        """Send a message through the bus"""
        if source_agent_id not in self.registered_agents:
            raise ValueError(f"Source agent {source_agent_id} not registered")
        
        if target_agent_id and target_agent_id not in self.registered_agents:
            raise ValueError(f"Target agent {target_agent_id} not registered")
        
        message = Message(
            source_agent_id=source_agent_id,
            target_agent_id=target_agent_id,
            message_type=message_type,
            priority=priority,
            payload=payload,
            context=context or {},
            requires_response=requires_response,
            response_timeout=response_timeout,
            expiry=datetime.now() + timedelta(seconds=response_timeout)
        )
        
        # Store message
        self.messages[message.message_id] = message
        self.message_history.append(message)
        
        # Update metrics
        self.metrics["messages_sent"] += 1
        self.metrics["by_agent"][source_agent_id]["sent"] += 1
        
        if message_type not in self.metrics["by_type"]:
            self.metrics["by_type"][message_type] = {"sent": 0, "delivered": 0}
        self.metrics["by_type"][message_type]["sent"] += 1
        
        # Queue message by priority
        await self.priority_queues[priority].put(message)
        
        # Create response future if needed
        if requires_response:
            future = asyncio.Future()
            self.pending_responses[message.message_id] = future
        
        logger.debug(f"Message {message.message_id} sent: {source_agent_id} -> {target_agent_id}")
        
        return message.message_id
    
    async def send_and_wait(
        self,
        source_agent_id: str,
        target_agent_id: str,
        message_type: str,
        payload: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        timeout: int = 300
    ) -> Optional[Dict[str, Any]]:
        """Send a message and wait for response"""
        message_id = await self.send_message(
            source_agent_id=source_agent_id,
            target_agent_id=target_agent_id,
            message_type=message_type,
            payload=payload,
            context=context,
            requires_response=True,
            response_timeout=timeout
        )
        
        if message_id not in self.pending_responses:
            return None
        
        future = self.pending_responses[message_id]
        
        try:
            response = await asyncio.wait_for(future, timeout=timeout)
            return response
        except asyncio.TimeoutError:
            logger.warning(f"Response timeout for message {message_id}")
            self.messages[message_id].status = MessageStatus.TIMEOUT
            return None
        finally:
            self.pending_responses.pop(message_id, None)
    
    async def broadcast(
        self,
        source_agent_id: str,
        message_type: str,
        payload: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        exclude_agents: Optional[Set[str]] = None
    ) -> List[str]:
        """Broadcast message to all subscribed agents"""
        message_ids = []
        exclude = exclude_agents or set()
        
        for agent_id in self.broadcast_subscriptions:
            if agent_id != source_agent_id and agent_id not in exclude:
                message_id = await self.send_message(
                    source_agent_id=source_agent_id,
                    target_agent_id=agent_id,
                    message_type=f"broadcast.{message_type}",
                    payload=payload,
                    context=context,
                    requires_response=False
                )
                message_ids.append(message_id)
        
        logger.info(f"Broadcast from {source_agent_id} to {len(message_ids)} agents")
        return message_ids
    
    async def respond_to_message(
        self,
        original_message_id: str,
        response_payload: Dict[str, Any]
    ) -> bool:
        """Send a response to a message"""
        if original_message_id not in self.messages:
            logger.warning(f"Original message {original_message_id} not found")
            return False
        
        original = self.messages[original_message_id]
        
        if not original.requires_response:
            logger.warning(f"Message {original_message_id} does not require response")
            return False
        
        # Create response message
        response = Message(
            correlation_id=original_message_id,
            source_agent_id=original.target_agent_id,
            target_agent_id=original.source_agent_id,
            message_type="response",
            payload=response_payload,
            context=original.context
        )
        
        # Complete the future if waiting
        if original_message_id in self.pending_responses:
            future = self.pending_responses[original_message_id]
            if not future.done():
                future.set_result(response_payload)
        
        # Update original message status
        original.status = MessageStatus.PROCESSED
        
        logger.debug(f"Response sent for message {original_message_id}")
        return True
    
    async def _process_messages(self):
        """Background task to process message queue"""
        while self.running:
            try:
                # Process priority queues in order
                for priority in MessagePriority:
                    queue = self.priority_queues[priority]
                    
                    if not queue.empty():
                        message = await queue.get()
                        await self._deliver_message(message)
                        break
                else:
                    # No messages in any queue, wait a bit
                    await asyncio.sleep(0.01)
                    
            except Exception as e:
                logger.error(f"Error processing messages: {e}")
                await asyncio.sleep(1)
    
    async def _deliver_message(self, message: Message):
        """Deliver a message to its target(s)"""
        start_time = datetime.now()
        
        try:
            # Check if message expired
            if message.expiry and datetime.now() > message.expiry:
                message.status = MessageStatus.TIMEOUT
                self.metrics["messages_failed"] += 1
                return
            
            # Apply routing rules
            for route in self.routes:
                if self._matches_route(message, route):
                    if route.handler:
                        await route.handler(message)
                    break
            
            # Deliver to target agent(s)
            if message.target_agent_id:
                # Direct message
                await self._deliver_to_agent(message.target_agent_id, message)
            elif message.message_type.startswith("broadcast"):
                # Already handled by broadcast method
                pass
            else:
                # Deliver to subscribers
                await self._deliver_to_subscribers(message)
            
            # Update metrics
            delivery_time = (datetime.now() - start_time).total_seconds()
            self.metrics["messages_delivered"] += 1
            self.metrics["average_delivery_time"] = (
                (self.metrics["average_delivery_time"] * 
                 (self.metrics["messages_delivered"] - 1) + delivery_time) /
                self.metrics["messages_delivered"]
            )
            
            message.status = MessageStatus.DELIVERED
            
        except Exception as e:
            logger.error(f"Failed to deliver message {message.message_id}: {e}")
            message.status = MessageStatus.FAILED
            message.delivery_attempts += 1
            
            # Retry if below max attempts
            if message.delivery_attempts < message.max_retries:
                await asyncio.sleep(2 ** message.delivery_attempts)  # Exponential backoff
                await self.priority_queues[message.priority].put(message)
            else:
                self.metrics["messages_failed"] += 1
    
    async def _deliver_to_agent(self, agent_id: str, message: Message):
        """Deliver message to specific agent"""
        if agent_id not in self.registered_agents:
            raise ValueError(f"Agent {agent_id} not registered")
        
        # Get agent handler
        handler = self.agent_handlers.get(agent_id)
        if handler:
            await handler(message)
        
        # Update metrics
        self.metrics["by_agent"][agent_id]["received"] += 1
        
        if message.message_type not in self.metrics["by_type"]:
            self.metrics["by_type"][message.message_type] = {"sent": 0, "delivered": 0}
        self.metrics["by_type"][message.message_type]["delivered"] += 1
        
        # Mark as acknowledged if required
        if message.requires_acknowledgment:
            message.status = MessageStatus.ACKNOWLEDGED
    
    async def _deliver_to_subscribers(self, message: Message):
        """Deliver message to all subscribers"""
        delivered_to = set()
        
        for agent_id, subs in self.subscriptions.items():
            for subscription in subs:
                if not subscription.active:
                    continue
                
                # Check if message type matches
                if message.message_type not in subscription.message_types:
                    continue
                
                # Check filter criteria
                if not self._matches_filter(message, subscription.filter_criteria):
                    continue
                
                # Deliver to agent
                if agent_id not in delivered_to:
                    await self._deliver_to_agent(agent_id, message)
                    delivered_to.add(agent_id)
    
    def _matches_route(self, message: Message, route: MessageRoute) -> bool:
        """Check if message matches routing rule"""
        if not route.active:
            return False
        
        # Check patterns (simplified, would use regex in real implementation)
        if route.source_pattern and route.source_pattern != message.source_agent_id:
            return False
        
        if route.target_pattern and route.target_pattern != message.target_agent_id:
            return False
        
        if route.message_type_pattern and route.message_type_pattern != message.message_type:
            return False
        
        return True
    
    def _matches_filter(
        self,
        message: Message,
        filter_criteria: Dict[str, Any]
    ) -> bool:
        """Check if message matches filter criteria"""
        for key, value in filter_criteria.items():
            if key == "priority" and message.priority != value:
                return False
            # Add more filter checks as needed
        
        return True
    
    async def _cleanup_expired(self):
        """Background task to clean up expired messages"""
        while self.running:
            try:
                now = datetime.now()
                expired_messages = []
                
                for msg_id, message in self.messages.items():
                    if message.expiry and message.expiry < now:
                        expired_messages.append(msg_id)
                
                for msg_id in expired_messages:
                    message = self.messages.pop(msg_id)
                    message.status = MessageStatus.TIMEOUT
                    
                    # Cancel pending response future
                    if msg_id in self.pending_responses:
                        future = self.pending_responses.pop(msg_id)
                        if not future.done():
                            future.cancel()
                
                # Keep message history size reasonable
                if len(self.message_history) > 10000:
                    self.message_history = self.message_history[-5000:]
                
                await asyncio.sleep(60)  # Cleanup every minute
                
            except Exception as e:
                logger.error(f"Error in cleanup: {e}")
                await asyncio.sleep(60)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get message bus metrics"""
        return {
            "messages_sent": self.metrics["messages_sent"],
            "messages_delivered": self.metrics["messages_delivered"],
            "messages_failed": self.metrics["messages_failed"],
            "average_delivery_time_seconds": self.metrics["average_delivery_time"],
            "pending_messages": sum(q.qsize() for q in self.priority_queues.values()),
            "registered_agents": len(self.registered_agents),
            "active_subscriptions": sum(len(s) for s in self.subscriptions.values()),
            "by_type": self.metrics["by_type"],
            "by_agent": self.metrics["by_agent"]
        }
    
    def get_message_history(
        self,
        agent_id: Optional[str] = None,
        message_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get message history with optional filters"""
        messages = self.message_history
        
        if agent_id:
            messages = [
                m for m in messages
                if m.source_agent_id == agent_id or m.target_agent_id == agent_id
            ]
        
        if message_type:
            messages = [m for m in messages if m.message_type == message_type]
        
        # Return most recent messages
        return [asdict(m) for m in messages[-limit:]]

# Global instance
_message_bus: Optional[MessageBus] = None

def get_message_bus() -> MessageBus:
    """Get or create the message bus instance"""
    global _message_bus
    if _message_bus is None:
        _message_bus = MessageBus()
    return _message_bus

async def initialize_message_bus():
    """Initialize and start the message bus"""
    bus = get_message_bus()
    await bus.start()
    return bus

async def shutdown_message_bus():
    """Shutdown the message bus"""
    bus = get_message_bus()
    await bus.stop()