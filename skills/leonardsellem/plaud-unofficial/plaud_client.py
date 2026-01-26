#!/usr/bin/env python3
"""
Plaud API Client - Fetch recordings from your Plaud account

Usage:
    1. Token is loaded automatically from .env file
    2. Run: python plaud_client.py details <file_id>

Or set PLAUD_TOKEN environment variable, or use --token flag.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

import requests
from dotenv import load_dotenv

# Load .env from script directory
load_dotenv(Path(__file__).parent / ".env")


class PlaudClient:
    """Client for interacting with the Plaud API."""

    # Region-specific API domains
    API_DOMAINS = {
        "eu-central-1": "https://api-euc1.plaud.ai",
        "us-east-1": "https://api-use1.plaud.ai",  # Assumed pattern
    }

    def __init__(self, token: str, region: str = "eu-central-1"):
        """
        Initialize the Plaud client.

        Args:
            token: Bearer token (with or without 'bearer ' prefix)
            region: AWS region (default: eu-central-1)
        """
        self.token = token if token.startswith("bearer ") else f"bearer {token}"
        self.api_domain = self.API_DOMAINS.get(region, self.API_DOMAINS["eu-central-1"])
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": self.token,
            "Content-Type": "application/json",
        })

    def get_file_details(self, file_id: str) -> dict:
        """
        Get detailed information about a file.

        Args:
            file_id: The 32-character hex file ID

        Returns:
            File details dictionary
        """
        url = f"{self.api_domain}/file/detail/{file_id}"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

    def download_audio(self, file_id: str, output_path: str = None) -> str:
        """
        Download the audio file (MP3) for a recording.

        Args:
            file_id: The 32-character hex file ID
            output_path: Optional output file path. If not provided,
                        uses the file's name from details.

        Returns:
            Path to the downloaded file
        """
        # Get file details for the name if not provided
        if output_path is None:
            details = self.get_file_details(file_id)
            file_name = details.get("data", {}).get("file_name", file_id)
            # Sanitize filename
            file_name = "".join(c for c in file_name if c.isalnum() or c in " -_").strip()
            output_path = f"{file_name}.mp3"

        url = f"{self.api_domain}/file/download/{file_id}"
        response = self.session.get(url, stream=True)
        response.raise_for_status()

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return output_path

    def get_batch_file_details(self, file_ids: list[str]) -> dict:
        """
        Get details for multiple files at once.

        Args:
            file_ids: List of file IDs

        Returns:
            Dictionary with file details
        """
        url = f"{self.api_domain}/file/list"
        response = self.session.post(url, json=file_ids)
        response.raise_for_status()
        return response.json()

    def list_files(self, include_trash: bool = False) -> list[dict]:
        """
        List all files in the account.

        Args:
            include_trash: Whether to include trashed files

        Returns:
            List of file dictionaries with id, filename, duration, etc.
        """
        url = f"{self.api_domain}/file/simple/web"
        response = self.session.get(url)
        response.raise_for_status()
        data = response.json()

        files = data.get("data_file_list", [])
        if not include_trash:
            files = [f for f in files if not f.get("is_trash", False)]
        return files

    def get_file_tags(self) -> dict:
        """Get all file tags/folders."""
        url = f"{self.api_domain}/filetag/"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

    def get_ai_status(self, file_id: str) -> dict:
        """Get AI processing status for a file."""
        url = f"{self.api_domain}/ai/file-task-status"
        response = self.session.get(url, params={"file_ids": file_id})
        response.raise_for_status()
        return response.json()


def format_duration(ms: int) -> str:
    """Format milliseconds as human-readable duration."""
    seconds = ms // 1000
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes:
        return f"{minutes}m {seconds}s"
    return f"{seconds}s"


def main():
    parser = argparse.ArgumentParser(
        description="Plaud API Client - Download your recordings",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # List all files
    python plaud_client.py list

    # List files as JSON
    python plaud_client.py list --json

    # Get file details
    python plaud_client.py details af9e46896091e31b29775331960e66f9

    # Download a recording
    python plaud_client.py download af9e46896091e31b29775331960e66f9

    # Download to specific path
    python plaud_client.py download af9e46896091e31b29775331960e66f9 -o meeting.mp3

    # Download all files
    python plaud_client.py download-all -o ./recordings

    # Get file tags/folders
    python plaud_client.py tags
"""
    )

    parser.add_argument(
        "--token", "-t",
        default=os.environ.get("PLAUD_TOKEN"),
        help="Bearer token (or set PLAUD_TOKEN env var)"
    )
    parser.add_argument(
        "--region", "-r",
        default="eu-central-1",
        help="AWS region (default: eu-central-1)"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # List command
    list_parser = subparsers.add_parser("list", help="List all files")
    list_parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    list_parser.add_argument("--include-trash", action="store_true", help="Include trashed files")

    # Details command
    details_parser = subparsers.add_parser("details", help="Get file details")
    details_parser.add_argument("file_id", help="File ID (32-char hex string)")
    details_parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")

    # Download command
    download_parser = subparsers.add_parser("download", help="Download audio file")
    download_parser.add_argument("file_id", help="File ID (32-char hex string)")
    download_parser.add_argument("--output", "-o", help="Output file path")

    # Download-all command
    download_all_parser = subparsers.add_parser("download-all", help="Download all audio files")
    download_all_parser.add_argument("--output", "-o", default="./plaud_downloads", help="Output directory")
    download_all_parser.add_argument("--include-trash", action="store_true", help="Include trashed files")

    # Tags command
    subparsers.add_parser("tags", help="Get file tags/folders")

    args = parser.parse_args()

    if not args.token:
        print("Error: Token required. Use --token or set PLAUD_TOKEN env var.")
        print("\nTo get your token:")
        print("1. Open https://web.plaud.ai in Chrome")
        print("2. Open DevTools (F12) > Console")
        print("3. Run: localStorage.getItem('tokenstr')")
        print("4. Copy the token (including 'bearer ' prefix)")
        sys.exit(1)

    if not args.command:
        parser.print_help()
        sys.exit(1)

    client = PlaudClient(args.token, args.region)

    try:
        if args.command == "list":
            files = client.list_files(include_trash=args.include_trash)
            if args.json:
                print(json.dumps(files, indent=2, ensure_ascii=False))
            else:
                print(f"Found {len(files)} files:\n")
                for f in files:
                    duration = format_duration(f.get("duration", 0))
                    trash = " [TRASH]" if f.get("is_trash") else ""
                    print(f"  {f['id']}  {duration:>12}  {f['filename']}{trash}")

        elif args.command == "details":
            details = client.get_file_details(args.file_id)
            if args.json:
                print(json.dumps(details, indent=2, ensure_ascii=False))
            else:
                data = details.get("data", {})
                print(f"File: {data.get('file_name', 'Unknown')}")
                print(f"ID: {data.get('file_id')}")
                print(f"Duration: {format_duration(data.get('duration', 0))}")
                print(f"Start Time: {data.get('start_time')}")
                print(f"Trash: {data.get('is_trash', False)}")
                print(f"Scene: {data.get('scene')}")

        elif args.command == "download":
            print(f"Downloading {args.file_id}...")
            output = client.download_audio(args.file_id, args.output)
            print(f"Saved to: {output}")

        elif args.command == "download-all":
            files = client.list_files(include_trash=args.include_trash)
            output_dir = Path(args.output)
            output_dir.mkdir(parents=True, exist_ok=True)

            print(f"Downloading {len(files)} files to {output_dir}\n")
            for i, f in enumerate(files, 1):
                filename = f["filename"]
                safe_name = "".join(c for c in filename if c.isalnum() or c in " -_").strip()
                output_path = output_dir / f"{safe_name}.mp3"

                if output_path.exists():
                    print(f"[{i}/{len(files)}] Skipped (exists): {safe_name}")
                    continue

                print(f"[{i}/{len(files)}] Downloading: {safe_name}...")
                client.download_audio(f["id"], str(output_path))

            print(f"\nDone! Files saved to {output_dir}")

        elif args.command == "tags":
            tags = client.get_file_tags()
            print(json.dumps(tags, indent=2, ensure_ascii=False))

    except requests.HTTPError as e:
        print(f"API Error: {e.response.status_code} - {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
