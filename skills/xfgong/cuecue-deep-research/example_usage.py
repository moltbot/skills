#!/usr/bin/env python3
"""
CueCue Deep Research Skill - Usage Examples

Demonstrates how to use the CueCueDeepResearch client in Python code.
"""

import asyncio
import os

from deep_research_skill import CueCueDeepResearch
from loguru import logger


async def example_basic_research():
    """Example 1: Basic research query"""
    print("\n" + "=" * 60)
    print("Example 1: Basic Research")
    print("=" * 60)

    api_key = os.getenv("CUECUE_API_KEY", "your_api_key")
    base_url = os.getenv("CUECUE_BASE_URL", "http://localhost:8088")

    client = CueCueDeepResearch(api_key=api_key, base_url=base_url)

    result = await client.research(query="What was BYD's Q3 2024 revenue?")

    print(f"\nTasks: {result['tasks']}")
    print(f"Report URL: {result['report_url']}")


async def example_with_template():
    """Example 2: Using a research template"""
    print("\n" + "=" * 60)
    print("Example 2: Using a Template")
    print("=" * 60)

    api_key = os.getenv("CUECUE_API_KEY", "your_api_key")
    base_url = os.getenv("CUECUE_BASE_URL", "http://localhost:8088")
    template_id = os.getenv("CUECUE_TEMPLATE_ID")

    if not template_id:
        print("⚠️  CUECUE_TEMPLATE_ID not set, skipping this example")
        return

    client = CueCueDeepResearch(api_key=api_key, base_url=base_url)

    result = await client.research(
        query="Analyze CATL's competitive advantages", template_id=template_id
    )

    print(f"\nTasks: {result['tasks']}")
    print(f"Report URL: {result['report_url']}")


async def example_save_to_file():
    """Example 3: Save report to file"""
    print("\n" + "=" * 60)
    print("Example 3: Save Report to File")
    print("=" * 60)

    api_key = os.getenv("CUECUE_API_KEY", "your_api_key")
    base_url = os.getenv("CUECUE_BASE_URL", "http://localhost:8088")

    client = CueCueDeepResearch(api_key=api_key, base_url=base_url)

    result = await client.research(
        query="Latest Tesla autopilot technology developments"
    )

    # Save report
    output_file = "tesla_autopilot_report.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(result["report"])

    print(f"\n✅ Report saved to: {output_file}")
    print(f"Report URL: {result['report_url']}")


async def example_continue_conversation():
    """Example 4: Continue an existing conversation"""
    print("\n" + "=" * 60)
    print("Example 4: Continue Conversation")
    print("=" * 60)

    api_key = os.getenv("CUECUE_API_KEY", "your_api_key")
    base_url = os.getenv("CUECUE_BASE_URL", "http://localhost:8088")

    client = CueCueDeepResearch(api_key=api_key, base_url=base_url)

    # First research
    result1 = await client.research(query="BYD's 2024 new energy vehicle sales")

    conversation_id = result1["conversation_id"]
    print(f"\nFirst research complete, conversation ID: {conversation_id}")

    # Continue the same conversation
    result2 = await client.research(
        query="Further analyze its overseas market performance",
        conversation_id=conversation_id,
    )

    print("\nSecond research complete")
    print(f"Report URL: {result2['report_url']}")


async def example_mimic_style():
    """Example 5: Mimic writing style from a URL"""
    print("\n" + "=" * 60)
    print("Example 5: Mimic Writing Style")
    print("=" * 60)

    api_key = os.getenv("CUECUE_API_KEY", "your_api_key")
    base_url = os.getenv("CUECUE_BASE_URL", "http://localhost:8088")

    client = CueCueDeepResearch(api_key=api_key, base_url=base_url)

    result = await client.research(
        query="Analyze the electric vehicle market trends",
        mimic_url="https://example.com/sample-article",
    )

    print(f"\nTasks: {result['tasks']}")
    print(f"Report URL: {result['report_url']}")
    print("\n✅ Report generated with mimicked writing style")


async def example_batch_queries():
    """Example 6: Batch process multiple queries"""
    print("\n" + "=" * 60)
    print("Example 6: Batch Processing")
    print("=" * 60)

    api_key = os.getenv("CUECUE_API_KEY", "your_api_key")
    base_url = os.getenv("CUECUE_BASE_URL", "http://localhost:8088")

    client = CueCueDeepResearch(api_key=api_key, base_url=base_url)

    queries = [
        "BYD Q3 2024 revenue",
        "CATL Q3 2024 revenue",
        "Tesla Q3 2024 revenue",
    ]

    results = []
    for query in queries:
        print(f"\nProcessing: {query}")
        result = await client.research(query=query)
        results.append(result)

    print("\n" + "=" * 60)
    print("Batch Processing Complete")
    print("=" * 60)
    for i, result in enumerate(results):
        print(f"{i+1}. {queries[i]}")
        print(f"   Tasks: {len(result['tasks'])}")
        print(f"   URL: {result['report_url']}")


async def main():
    """Run all examples"""
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>\n",
        level="INFO",
    )

    print("=" * 60)
    print("CueCue Deep Research Skill - Usage Examples")
    print("=" * 60)

    # Check environment variables
    if not os.getenv("CUECUE_API_KEY"):
        print("\n⚠️  Please set CUECUE_API_KEY environment variable")
        print("   export CUECUE_API_KEY='your_api_key'")
        return

    try:
        # Run examples (comment/uncomment as needed)
        await example_basic_research()
        # await example_with_template()
        # await example_save_to_file()
        # await example_continue_conversation()
        # await example_batch_queries()

    except Exception as e:
        logger.error(f"Example execution failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())
