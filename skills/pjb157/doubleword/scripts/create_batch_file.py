#!/usr/bin/env python3
"""
Create a batch request JSONL file for Doubleword API.

Usage:
    python create_batch_file.py output.jsonl

The script reads requests from stdin (JSON array) or can be modified to
accept other input formats.
"""

import json
import sys
from typing import List, Dict, Any


def create_batch_request(
    custom_id: str,
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 1.0,
    max_tokens: int | None = None,
    **kwargs: Any
) -> Dict[str, Any]:
    """
    Create a single batch request object.

    Args:
        custom_id: Unique identifier for this request (max 64 characters)
        model: Model name to use
        messages: List of message dicts with 'role' and 'content'
        temperature: Sampling temperature (default: 1.0)
        max_tokens: Maximum tokens in response (optional)
        **kwargs: Additional API parameters

    Returns:
        Dict representing a single batch request line
    """
    body = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    if max_tokens is not None:
        body["max_tokens"] = max_tokens

    # Add any additional parameters
    body.update(kwargs)

    return {
        "custom_id": custom_id,
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": body
    }


def write_batch_file(requests: List[Dict[str, Any]], output_path: str) -> None:
    """
    Write batch requests to JSONL file.

    Args:
        requests: List of batch request objects
        output_path: Path to output JSONL file
    """
    with open(output_path, 'w') as f:
        for request in requests:
            f.write(json.dumps(request) + '\n')


def main():
    if len(sys.argv) != 2:
        print("Usage: python create_batch_file.py output.jsonl", file=sys.stderr)
        sys.exit(1)

    output_path = sys.argv[1]

    # Example: Create sample batch requests
    requests = [
        create_batch_request(
            custom_id="request-1",
            model="anthropic/claude-3-5-sonnet",
            messages=[
                {"role": "user", "content": "What is the capital of France?"}
            ]
        ),
        create_batch_request(
            custom_id="request-2",
            model="anthropic/claude-3-5-sonnet",
            messages=[
                {"role": "user", "content": "Explain quantum computing in one sentence."}
            ],
            max_tokens=100
        ),
    ]

    write_batch_file(requests, output_path)
    print(f"Created batch file: {output_path} with {len(requests)} requests")


if __name__ == "__main__":
    main()
