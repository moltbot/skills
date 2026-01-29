#!/usr/bin/env python3
"""
Todozi SDK - Async client + LangChain tools for Todozi API

Dataclasses:
    - TodoziTask, TodoziMatrix, TodoziStats
    - RecurrenceRule, Reminder, Attachment

Tools:
    - todozi_create_task, todozi_list_tasks
    - todozi_complete_task, todozi_get_stats
    - todozi_get_user_preferences, todozi_update_user_preferences

Usage:
    # As SDK
    from todozi import TodoziClient
    client = TodoziClient(api_key="your_key")
    matrices = await client.list_matrices()
    task = await client.create_task("Build feature", priority="high")

    # As CLI (TODO: add CLI interface)
    python todozi.py list-tasks
    python todozi.py create-task "Task name" --priority=high

    # As LangChain tools
    from todozi import TODOZI_TOOLS
    # Add to agent tools list
"""

import asyncio
import hashlib
import os
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Awaitable, Dict, List, Optional
import httpx
from langchain.agents import create_agent
from langchain.agents.middleware import (
    AgentMiddleware,
    AgentState,
    ModelRequest,
    ModelResponse,
)
from langchain.messages import SystemMessage
from langchain_core.tools import BaseTool, tool
from langgraph.runtime import Runtime

HAS_HTTPX = False
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    pass


@dataclass
class RecurrenceRule:
    frequency: str
    interval: int = 1
    days_of_week: List[int] = field(default_factory=list)
    day_of_month: Optional[int] = None
    end_date: Optional[str] = None
    count: Optional[int] = None


@dataclass
class Reminder:
    id: str
    reminder_time: str
    notification_type: str = "system"
    snooze_until: Optional[str] = None


@dataclass
class Attachment:
    id: str
    filename: str
    url: str
    mime_type: str
    size: int


@dataclass
class TodoziTask:
    id: str
    title: str
    description: str = ""
    type: str = "task"
    status: str = "todo"
    priority: str = "medium"
    progress: int = 0
    due_date: Optional[str] = None
    estimated_duration: int = 0
    actual_duration: int = 0
    time_started: Optional[str] = None
    time_completed: Optional[str] = None
    thread_id: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    blocked_by: List[str] = field(default_factory=list)
    notes: str = ""
    subtasks: List["TodoziTask"] = field(default_factory=list)
    attachments: List[Attachment] = field(default_factory=list)
    recurrence: Optional[RecurrenceRule] = None
    reminders: List[Reminder] = field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed: bool = False


@dataclass
class TodoziMatrix:
    id: str
    name: str
    category: str = "do"
    description: str = ""
    parent_id: Optional[str] = None
    task_count: int = 0
    goal_count: int = 0
    note_count: int = 0
    color: str = "#ffffff"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class TodoziStats:
    total_tasks: int = 0
    total_goals: int = 0
    total_notes: int = 0
    total_matrices: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    by_category: Dict[str, int] = field(default_factory=dict)
    by_priority: Dict[str, int] = field(default_factory=dict)


class TodoziClient:
    """Async client for Todozi API."""
    
    BASE_URL = "https://todozi.com/api"
    CATEGORY_COLORS = {
        "do": "#ff6b6b",
        "delegate": "#4ecdc4",
        "defer": "#ffe66d",
        "done": "#95e1d3",
        "dream": "#a8e6cf",
        "dont": "#c44d58",
    }

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv("TODOZI_API_KEY")
        self.base_url = base_url or os.getenv("TODOZI_BASE", self.BASE_URL)
        self.headers = {
            "x-api-key": self.api_key or "",
            "Content-Type": "application/json",
        }

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Dict:
        """Make async HTTP request."""
        url = f"{self.base_url}/{endpoint}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method.upper() == "GET":
                response = await client.get(url, headers=self.headers, params=params)
            elif method.upper() == "POST":
                response = await client.post(url, headers=self.headers, json=data or {})
            elif method.upper() == "PUT":
                response = await client.put(url, headers=self.headers, json=data or {})
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            response.raise_for_status()
            return response.json()

    def _get_category_color(self, category: str) -> str:
        return self.CATEGORY_COLORS.get(category, "#ffffff")

    def _parse_task(self, data: Dict[str, Any]) -> TodoziTask:
        """Parse API response into TodoziTask dataclass."""
        task_data = data.get("item", data)
        
        attachments = [
            Attachment(
                id=att.get("id", ""),
                filename=att.get("filename", ""),
                url=att.get("url", ""),
                mime_type=att.get("mime_type", ""),
                size=att.get("size", 0),
            )
            for att in task_data.get("attachments", [])
        ]
        
        reminders = [
            Reminder(
                id=rem.get("id", ""),
                reminder_time=rem.get("reminder_time", ""),
                notification_type=rem.get("notification_type", "system"),
                snooze_until=rem.get("snooze_until"),
            )
            for rem in task_data.get("reminders", [])
        ]
        
        recurrence = None
        if task_data.get("recurrence"):
            rec = task_data["recurrence"]
            recurrence = RecurrenceRule(
                frequency=rec.get("frequency", "daily"),
                interval=rec.get("interval", 1),
                days_of_week=rec.get("days_of_week", []),
                day_of_month=rec.get("day_of_month"),
                end_date=rec.get("end_date"),
                count=rec.get("count"),
            )
        
        return TodoziTask(
            id=task_data.get("id", ""),
            title=task_data.get("title", ""),
            description=task_data.get("description", ""),
            type=task_data.get("type", "task"),
            status=task_data.get("status", "todo"),
            priority=task_data.get("priority", "medium"),
            progress=task_data.get("progress", 0),
            due_date=task_data.get("due_date"),
            estimated_duration=task_data.get("estimated_duration", 0),
            actual_duration=task_data.get("actual_duration", 0),
            time_started=task_data.get("time_started"),
            time_completed=task_data.get("time_completed"),
            thread_id=task_data.get("thread_id"),
            project_id=task_data.get("project_id"),
            tags=task_data.get("tags", []),
            blocked_by=task_data.get("blocked_by", []),
            notes=task_data.get("notes", ""),
            subtasks=[self._parse_task(sub) for sub in task_data.get("subtasks", [])],
            attachments=attachments,
            recurrence=recurrence,
            reminders=reminders,
            created_at=task_data.get("created_at"),
            updated_at=task_data.get("updated_at"),
            completed=task_data.get("status") == "done",
        )

    # === Matrix Operations ===
    
    async def list_matrices(self, thread_id: Optional[str] = None) -> List[TodoziMatrix]:
        """List all matrices."""
        data = await self._request("GET", "matrix", params={"thread_id": thread_id})
        return [
            TodoziMatrix(
                id=m.get("id", ""),
                name=m.get("name", ""),
                category=m.get("category", "do"),
                description=m.get("description", ""),
                parent_id=m.get("parent_id"),
                task_count=m.get("task_count", 0),
                goal_count=m.get("goal_count", 0),
                note_count=m.get("note_count", 0),
                color=self._get_category_color(m.get("category", "do")),
                created_at=m.get("created_at"),
                updated_at=m.get("updated_at"),
            )
            for m in data.get("matrices", [])
        ]

    async def create_matrix(
        self,
        name: str,
        category: str = "do",
        description: str = "",
        thread_id: Optional[str] = None,
    ) -> TodoziMatrix:
        """Create a new matrix."""
        data = await self._request(
            "POST", "matrix",
            {"name": name, "category": category, "description": description, "thread_id": thread_id}
        )
        matrix_data = data.get("matrix", data)
        return TodoziMatrix(
            id=matrix_data.get("id", ""),
            name=matrix_data.get("name", ""),
            category=matrix_data.get("category", category),
            description=matrix_data.get("description", description),
            color=self._get_category_color(category),
        )

    async def get_matrix(self, matrix_id: str) -> TodoziMatrix:
        """Get matrix with items."""
        data = await self._request("GET", f"matrix/{matrix_id}")
        m = data.get("matrix", data)
        return TodoziMatrix(
            id=m.get("id", ""),
            name=m.get("name", ""),
            category=m.get("category", "do"),
            description=m.get("description", ""),
            color=self._get_category_color(m.get("category", "do")),
        )

    async def delete_matrix(self, matrix_id: str) -> bool:
        """Delete a matrix."""
        try:
            await self._request("DELETE", f"matrix/{matrix_id}")
            return True
        except Exception:
            return False

    # === Item Operations ===

    async def create_task(
        self,
        title: str,
        thread_id: Optional[str] = None,
        description: str = "",
        priority: str = "medium",
        due_date: Optional[str] = None,
        tags: Optional[List[str]] = None,
        estimated_duration: int = 0,
    ) -> TodoziTask:
        """Create a new task."""
        # Auto-create default matrix if needed
        if not thread_id:
            matrices = await self.list_matrices()
            for matrix in matrices:
                if matrix.name.lower() in ["default", "general", "do"]:
                    thread_id = matrix.id
                    break
            if not thread_id:
                default = await self.create_matrix(name="Default", category="do", description="Default matrix")
                thread_id = default.id
        
        data = await self._request(
            "POST", f"matrix/{thread_id}/task",
            {"title": title, "type": "task", "description": description, 
             "priority": priority, "due_date": due_date, "tags": tags or [], 
             "estimated_duration": estimated_duration}
        )
        return self._parse_task(data)

    async def create_goal(
        self, title: str, thread_id: Optional[str] = None, description: str = "", priority: str = "medium"
    ) -> TodoziTask:
        """Create a new goal."""
        endpoint = f"matrix/{thread_id}/goal" if thread_id else "goal"
        data = await self._request("POST", endpoint, {"title": title, "description": description, "priority": priority})
        return self._parse_task(data)

    async def create_note(
        self, title: str, thread_id: Optional[str] = None, description: str = ""
    ) -> TodoziTask:
        """Create a new note."""
        endpoint = f"matrix/{thread_id}/note" if thread_id else "note"
        data = await self._request("POST", endpoint, {"title": title, "description": description})
        return self._parse_task(data)

    async def get_item(self, item_id: str) -> TodoziTask:
        """Get item by ID."""
        data = await self._request("GET", f"item/{item_id}")
        return self._parse_task(data)

    async def update_item(self, item_id: str, updates: Dict[str, Any]) -> TodoziTask:
        """Update an item."""
        data = await self._request("PUT", f"item/{item_id}", updates)
        return self._parse_task(data)

    async def complete_item(self, item_id: str) -> bool:
        """Mark item as complete."""
        try:
            await self._request("POST", f"item/{item_id}/complete")
            return True
        except Exception:
            return False

    async def delete_item(self, item_id: str) -> bool:
        """Delete an item."""
        try:
            await self._request("DELETE", f"item/{item_id}")
            return True
        except Exception:
            return False

    # === List Operations ===

    async def list_tasks(
        self, status: Optional[str] = None, priority: Optional[str] = None, thread_id: Optional[str] = None
    ) -> List[TodoziTask]:
        """List tasks with optional filters."""
        params = {}
        if status: params["status"] = status
        if priority: params["priority"] = priority
        endpoint = f"matrix/{thread_id}/tasks" if thread_id else "list-tasks"
        data = await self._request("GET", endpoint, params=params)
        return [self._parse_task(t) for t in data.get("tasks", [])]

    async def list_goals(self, thread_id: Optional[str] = None) -> List[TodoziTask]:
        """List all goals."""
        endpoint = f"matrix/{thread_id}/goals" if thread_id else "list-goals"
        data = await self._request("GET", endpoint)
        return [self._parse_task(g) for g in data.get("goals", [])]

    async def list_notes(self, thread_id: Optional[str] = None) -> List[TodoziTask]:
        """List all notes."""
        endpoint = f"matrix/{thread_id}/notes" if thread_id else "list-notes"
        data = await self._request("GET", endpoint)
        return [self._parse_task(n) for n in data.get("notes", [])]

    async def list_all(self) -> Dict[str, Any]:
        """Get everything."""
        return await self._request("GET", "list-all")

    # === Search ===

    async def search(
        self, query: str, type_: Optional[str] = None, status: Optional[str] = None,
        priority: Optional[str] = None, category: Optional[str] = None,
        tags: Optional[List[str]] = None, limit: int = 20
    ) -> List[TodoziTask]:
        """Search items (searches title, description, tags only - NOT content)."""
        params = {"q": query, "limit": limit}
        if type_: params["type"] = type_
        if status: params["status"] = status
        if priority: params["priority"] = priority
        if category: params["category"] = category
        if tags: params["tags"] = ",".join(tags)
        
        data = await self._request("GET", "search", params=params)
        return [self._parse_task(item) for item in data.get("items", [])]

    # === Bulk Operations ===

    async def bulk_update(self, items: List[Dict[str, Any]]) -> bool:
        """Update multiple items."""
        try:
            await self._request("POST", "bulk/update", items)
            return True
        except Exception:
            return False

    async def bulk_complete(self, item_ids: List[str]) -> bool:
        """Complete multiple items."""
        try:
            await self._request("POST", "bulk/complete", item_ids)
            return True
        except Exception:
            return False

    async def bulk_delete(self, item_ids: List[str]) -> bool:
        """Delete multiple items."""
        try:
            await self._request("POST", "bulk/delete", item_ids)
            return True
        except Exception:
            return False

    # === Webhooks ===

    async def create_webhook(self, url: str, events: List[str]) -> Dict:
        """Create a webhook."""
        return await self._request("POST", "webhook", {"url": url, "events": events})

    async def list_webhooks(self) -> List[Dict]:
        """List all webhooks."""
        data = await self._request("GET", "webhook")
        return data.get("webhooks", [])

    async def update_webhook(self, webhook_id: str, url: str, events: List[str]) -> Dict:
        """Update a webhook."""
        return await self._request("PUT", f"webhook/{webhook_id}", {"url": url, "events": events})

    async def delete_webhook(self, webhook_id: str) -> bool:
        """Delete a webhook."""
        try:
            await self._request("DELETE", f"webhook/{webhook_id}")
            return True
        except Exception:
            return False

    # === System ===

    async def get_stats(self) -> TodoziStats:
        """Get statistics."""
        data = await self._request("GET", "stats")
        return TodoziStats(
            total_tasks=data.get("total_tasks", 0),
            total_goals=data.get("total_goals", 0),
            total_notes=data.get("total_notes", 0),
            total_matrices=data.get("total_matrices", 0),
            completed_tasks=data.get("completed_tasks", 0),
            overdue_tasks=data.get("overdue_tasks", 0),
            by_category=data.get("by_category", {}),
            by_priority=data.get("by_priority", {}),
        )

    async def health_check(self) -> Dict:
        """Health check."""
        return await self._request("GET", "health")

    async def validate_api_key(self) -> bool:
        """Validate API key."""
        try:
            await self._request("GET", "matrix")
            return True
        except Exception:
            return False

    # === User Preferences ===

    async def get_user_preferences(self) -> Dict[str, Any]:
        """Get user preferences."""
        return await self._request("GET", "users/preference")

    async def update_user_preferences(
        self, preferences: Optional[Dict[str, Any]] = None, learned_context: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Update user preferences."""
        data = {}
        if preferences: data["preferences"] = preferences
        if learned_context: data["learned_context"] = learned_context
        return await self._request("POST", "users/preference", data)

    # === Registration ===

    async def register(self, webhook: Optional[str] = None) -> Dict[str, str]:
        """Register for API key."""
        data = {}
        if webhook: data["webhook"] = webhook
        result = await self._request("POST", "register", data)
        return {
            "public_key": result.get("public_key", ""),
            "private_key": result.get("private_key", ""),
            "user_id": result.get("user_id", ""),
        }


# === LangChain Tools ===

@tool
def todozi_create_task(
    title: str,
    priority: str = "medium",
    due_date: Optional[str] = None,
    description: str = "",
    thread_id: Optional[str] = None,
    tags: Optional[str] = None,
    estimated_minutes: int = 0,
) -> str:
    """Create a new task in Todozi."""
    try:
        client = _get_todozi_client()
        if not client:
            return "Todozi not configured. Set TODOZI_API_KEY."
        tag_list = [t.strip() for t in tags.split(",")] if tags else []
        task = asyncio.run(client.create_task(
            title=title, priority=priority, due_date=due_date,
            description=description, thread_id=thread_id, tags=tag_list,
            estimated_duration=estimated_minutes,
        ))
        return f"✅ Task created: {task.title} [ID: {task.id}]"
    except Exception as e:
        return f"❌ Error creating task: {str(e)}"


@tool
def todozi_list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    thread_id: Optional[str] = None,
    limit: int = 20,
) -> str:
    """List tasks from Todozi with optional filters."""
    try:
        client = _get_todozi_client()
        if not client:
            return "Todozi not configured."
        tasks = asyncio.run(client.list_tasks(status=status, priority=priority, thread_id=thread_id))[:limit]
        if not tasks:
            return "No tasks found"
        
        status_icon = {"done": "✅", "in_progress": "🔄", "todo": "○"}
        priority_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        
        lines = [f"📋 Tasks ({len(tasks)}):"]
        for task in tasks:
            s = status_icon.get(task.status, "○")
            p = priority_icon.get(task.priority, "⚪")
            due = f" (due: {task.due_date})" if task.due_date else ""
            lines.append(f"  {s} {p} {task.title}{due}")
        return "\n".join(lines)
    except Exception as e:
        return f"❌ Error listing tasks: {str(e)}"


@tool
def todozi_complete_task(task_id: str) -> str:
    """Mark a task as complete in Todozi."""
    try:
        client = _get_todozi_client()
        if not client:
            return "Todozi not configured."
        success = asyncio.run(client.complete_item(task_id))
        return f"✅ Task {task_id} completed!" if success else f"❌ Could not complete {task_id}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


@tool
def todozi_get_stats() -> str:
    """Get Todozi statistics."""
    try:
        client = _get_todozi_client()
        if not client:
            return "Todozi not configured."
        stats = asyncio.run(client.get_stats())
        rate = round((stats.completed_tasks / stats.total_tasks * 100), 1) if stats.total_tasks > 0 else 0
        return f"""📊 Todozi Stats
────────────────
Tasks: {stats.total_tasks} ({stats.completed_tasks} done, {rate}% complete)
Overdue: {stats.overdue_tasks}
Goals: {stats.total_goals}
Notes: {stats.total_notes}
Matrices: {stats.total_matrices}"""
    except Exception as e:
        return f"❌ Error: {str(e)}"


@tool
def todozi_search(
    query: str,
    type_: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 10,
) -> str:
    """Search Todozi items (searches title, description, tags only)."""
    try:
        client = _get_todozi_client()
        if not client:
            return "Todozi not configured."
        results = asyncio.run(client.search(query, type_=type_, status=status, priority=priority, limit=limit))
        if not results:
            return "No results found"
        lines = [f"🔍 Search results for '{query}':"]
        for item in results[:limit]:
            lines.append(f"  • {item.title} [{item.type}] [ID: {item.id}]")
        return "\n".join(lines)
    except Exception as e:
        return f"❌ Error: {str(e)}"


@tool
def todozi_list_matrices() -> str:
    """List all Todozi matrices."""
    try:
        client = _get_todozi_client()
        if not client:
            return "Todozi not configured."
        matrices = asyncio.run(client.list_matrices())
        if not matrices:
            return "No matrices found"
        lines = ["📁 Matrices:"]
        for m in matrices:
            lines.append(f"  • {m.name} [{m.category}] ({m.task_count} tasks)")
        return "\n".join(lines)
    except Exception as e:
        return f"❌ Error: {str(e)}"


TODOZI_TOOLS = [
    todozi_create_task,
    todozi_list_tasks,
    todozi_complete_task,
    todozi_get_stats,
    todozi_search,
    todozi_list_matrices,
]


# === Client Factory ===

_todozi_client: Optional[TodoziClient] = None

def _get_todozi_client() -> Optional[TodoziClient]:
    """Get or create TodoziClient singleton."""
    global _todozi_client
    if _todozi_client is None:
        api_key = os.getenv("TODOZI_API_KEY")
        if api_key:
            _todozi_client = TodoziClient(api_key=api_key)
        else:
            print("TODOZI_API_KEY not set")
            _todozi_client = None
    return _todozi_client


__all__ = [
    "TodoziClient",
    "TodoziTask",
    "TodoziMatrix",
    "TodoziStats",
    "TodoziStats",
    "RecurrenceRule",
    "Reminder",
    "Attachment",
    "TODOZI_TOOLS",
    "todozi_create_task",
    "todozi_list_tasks",
    "todozi_complete_task",
    "todozi_get_stats",
    "todozi_search",
    "todozi_list_matrices",
]
