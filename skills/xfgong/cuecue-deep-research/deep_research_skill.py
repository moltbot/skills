#!/usr/bin/env python3
"""
CueCue Deep Research Skill

A command-line tool for conducting deep research using CueCue's AI-powered
multi-agent system. This skill streams research results in real-time, showing
only the essential information: task titles and the final research report.

Usage:
    python deep_research_skill.py "Your research question" --api-key YOUR_KEY

For more information, see SKILL.md
"""

import argparse
import asyncio
import json
import os
import re
import sys
import uuid
from typing import Optional

import httpx
from loguru import logger


class CueCueDeepResearch:
    """CueCue Deep Research Client

    A client for interacting with CueCue's deep research API. This client
    handles authentication, request formatting, and streaming response parsing.
    """

    def __init__(self, api_key: str, base_url: str = "https://cuecue.cn"):
        """Initialize the CueCue Deep Research client.

        Args:
            api_key: Your CueCue API key (obtain from user settings)
            base_url: The CueCue API base URL (default: https://cuecue.cn)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def research(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        template_id: Optional[str] = None,
        mimic_url: Optional[str] = None,
    ) -> dict:
        """Execute a deep research query.

        Args:
            query: The research question or topic
            conversation_id: Optional conversation ID to continue an existing conversation
            template_id: Optional template ID to use a predefined research framework
            mimic_url: Optional URL to mimic the writing style from

        Returns:
            A dictionary containing:
                - conversation_id: The conversation ID
                - chat_id: The chat message ID
                - tasks: List of task titles from the supervisor agent
                - report: The complete markdown research report
                - report_url: URL to view the report in the web interface

        Raises:
            httpx.HTTPStatusError: If the API request fails
            Exception: For other errors during execution
        """
        print(f"Starting Deep Research: {query}\n")
        # Generate IDs
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        chat_id = str(uuid.uuid4())
        message_id = f"msg_{uuid.uuid4()}"

        # Build request payload
        request_data = {
            "messages": [
                {"role": "user", "content": query, "id": message_id, "type": "text"}
            ],
            "chat_id": chat_id,
            "conversation_id": conversation_id,
            "need_confirm": False,
            "need_analysis": False,
            "need_underlying": False,
            "need_recommend": False,
        }

        if template_id:
            request_data["template_id"] = template_id

        if mimic_url:
            request_data["mimic"] = {"url": mimic_url}

        # Initialize result container
        result = {
            "conversation_id": conversation_id,
            "chat_id": chat_id,
            "tasks": [],
            "report": "",
            "report_url": None,
        }

        # State tracking
        is_reporter = False
        report_content = []

        try:
            async with httpx.AsyncClient(timeout=3600.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat/stream",
                    headers=self.headers,
                    json=request_data,
                ) as response:
                    # Check status code manually for streaming responses
                    if response.status_code != 200:
                        error_text = await response.aread()
                        raise httpx.HTTPStatusError(
                            f"HTTP {response.status_code}: {error_text}",
                            request=response.request,
                            response=response,
                        )

                    # Parse standard SSE format
                    current_event = {"type": "message", "data": None, "id": None}

                    async for line in response.aiter_lines():
                        # Parse SSE field
                        if line.startswith("id: "):
                            current_event["id"] = line[4:]
                        elif line.startswith("event: "):
                            current_event["type"] = line[7:]
                        elif line.startswith("data: "):
                            try:
                                current_event["data"] = json.loads(line[6:])
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse SSE data: {e}")
                                continue
                        elif not line:
                            # Empty line marks end of event
                            if current_event["data"] is not None:
                                event_type = current_event["type"]
                                event_data = current_event["data"]

                                # Handle agent start events
                                if event_type == "start_of_agent":
                                    agent_name = event_data.get("agent_name")

                                    # Capture supervisor tasks
                                    if agent_name == "supervisor":
                                        task_requirement = event_data.get(
                                            "task_requirement"
                                        )
                                        if task_requirement:
                                            result["tasks"].append(task_requirement)
                                            print(f"\n📋 Task: {task_requirement}")

                                    # Mark reporter start
                                    elif agent_name == "reporter":
                                        is_reporter = True
                                        print("\n📝 Generating Report...\n")

                                # Handle agent end events
                                elif event_type == "end_of_agent":
                                    agent_name = event_data.get("agent_name")
                                    if agent_name == "reporter":
                                        is_reporter = False
                                        result["report"] = "".join(report_content)

                                # Handle message streaming (reporter markdown)
                                elif event_type == "message" and is_reporter:
                                    delta = event_data.get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        # Remove citation markers like 【4-4】
                                        cleaned_content = re.sub(
                                            r"【\d+-\d+】", "", content
                                        )
                                        report_content.append(cleaned_content)
                                        print(cleaned_content, end="", flush=True)

                                # Handle workflow completion
                                elif event_type == "final_session_state":
                                    print("\n\n✅ Research complete")

                                # Reset for next event
                                current_event = {
                                    "type": "message",
                                    "data": None,
                                    "id": None,
                                }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise

        # Generate report URL
        result["report_url"] = f"{self.base_url}/c/{conversation_id}"

        return result


async def main():
    """Command-line interface entry point."""
    parser = argparse.ArgumentParser(
        description="CueCue Deep Research - AI-powered research assistant",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic research (using environment variable)
  export CUECUE_API_KEY=your_key
  python deep_research_skill.py "Tesla Q3 2024 revenue"
  
  # Or specify API key directly
  python deep_research_skill.py "Tesla Q3 2024 revenue" --api-key YOUR_KEY
  
  # Save report to file
  python deep_research_skill.py "BYD financial analysis" --output report.md
  
  # Continue existing conversation
  python deep_research_skill.py "Further analysis" --conversation-id CONV_ID
  
  # Use a template
  python deep_research_skill.py "Company analysis" --template-id TEMPLATE_ID
  
  # Mimic writing style from a URL
  python deep_research_skill.py "Market analysis" --mimic-url https://example.com/article

For more information, visit: https://cuecue.cn
        """,
    )
    parser.add_argument("query", help="Research question or topic")
    parser.add_argument(
        "--api-key",
        default=os.getenv("CUECUE_API_KEY"),
        help="CueCue API key (defaults to CUECUE_API_KEY environment variable)",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("CUECUE_BASE_URL", "https://cuecue.cn"),
        help="CueCue API base URL (defaults to CUECUE_BASE_URL env var or https://cuecue.cn)",
    )
    parser.add_argument(
        "--conversation-id",
        help="Conversation ID to continue an existing conversation",
    )
    parser.add_argument(
        "--template-id",
        help="Template ID to use a predefined research framework",
    )
    parser.add_argument(
        "--mimic-url",
        help="URL to mimic the writing style from",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output file path to save the report (markdown format)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Validate API key
    if not args.api_key:
        print("❌ Error: API key is required")
        print("\nPlease provide an API key using one of these methods:")
        print("  1. Set environment variable: export CUECUE_API_KEY='your_key'")
        print("  2. Use command-line argument: --api-key YOUR_KEY")
        print("\nTo obtain an API key:")
        print("  1. Log in to CueCue at https://cuecue.cn")
        print("  2. Go to Settings → API Keys")
        print("  3. Generate a new key")
        sys.exit(1)

    # Configure logging
    logger.remove()
    log_level = "DEBUG" if args.verbose else "INFO"
    logger.add(
        sys.stderr,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level=log_level,
    )

    # Create client
    client = CueCueDeepResearch(api_key=args.api_key, base_url=args.base_url)

    try:
        # Execute research
        result = await client.research(
            query=args.query,
            conversation_id=args.conversation_id,
            template_id=args.template_id,
            mimic_url=args.mimic_url,
        )

        # Print summary
        print("\n" + "=" * 60)
        print("📊 Research Summary")
        print("=" * 60)
        print(f"Conversation ID: {result['conversation_id']}")
        print(f"Tasks completed: {len(result['tasks'])}")
        print(f"Report URL: {result['report_url']}")

        # Save report to file
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(result["report"])
            print(f"✅ Report saved to: {args.output}")

    except Exception as e:
        logger.error(f"Execution failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
