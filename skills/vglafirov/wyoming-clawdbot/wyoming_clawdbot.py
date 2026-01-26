#!/usr/bin/env python3
"""Wyoming protocol server for Clawdbot integration."""

import argparse
import asyncio
import json
import logging

from wyoming.asr import Transcript
from wyoming.event import Event, async_read_event, async_write_event
from wyoming.info import Attribution, Describe, Info, HandleProgram, HandleModel
from wyoming.handle import Handled, NotHandled

_LOGGER = logging.getLogger(__name__)


class ClawdbotHandler:
    """Handle Wyoming events for Clawdbot."""

    def __init__(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
        clawdbot_args: list[str],
    ) -> None:
        self.reader = reader
        self.writer = writer
        self.clawdbot_args = clawdbot_args

    async def handle_event(self, event: Event) -> bool:
        """Handle incoming Wyoming event."""
        _LOGGER.debug("Received event type: %s", event.type)
        
        if Describe.is_type(event.type):
            # Return service info - expose as handle (conversation) service
            info = Info(
                handle=[
                    HandleProgram(
                        name="clawdbot",
                        description="Clawdbot AI Assistant",
                        attribution=Attribution(
                            name="Clawdbot",
                            url="https://clawd.bot",
                        ),
                        installed=True,
                        version="1.0.0",
                        models=[
                            HandleModel(
                                name="clawdbot",
                                description="Clawdbot multilingual assistant",
                                attribution=Attribution(
                                    name="Clawdbot",
                                    url="https://clawd.bot",
                                ),
                                installed=True,
                                version="1.0.0",
                                languages=["en", "ru", "de", "fr", "es", "it", "pt", "nl", "pl", "uk"],
                            )
                        ],
                    )
                ]
            )
            await async_write_event(info.event(), self.writer)
            _LOGGER.debug("Sent info response")
            return True

        # Handle Transcript events from Home Assistant
        if Transcript.is_type(event.type):
            transcript = Transcript.from_event(event)
            _LOGGER.info("Received transcript: %s", transcript.text)

            try:
                # Call clawdbot agent
                response_text = await self._call_clawdbot(transcript.text)
                _LOGGER.info("Clawdbot response: %s", response_text)

                # Return handled response
                handled = Handled(text=response_text)
                await async_write_event(handled.event(), self.writer)

            except Exception as e:
                _LOGGER.error("Error calling Clawdbot: %s", e)
                not_handled = NotHandled(text=f"Ошибка: {e}")
                await async_write_event(not_handled.event(), self.writer)

            return True

        _LOGGER.warning("Unexpected event type: %s", event.type)
        return True

    async def _call_clawdbot(self, text: str) -> str:
        """Call Clawdbot CLI and return response."""
        cmd = ["clawdbot", "agent", "--message", text, "--json"] + self.clawdbot_args

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            raise RuntimeError(f"Clawdbot failed: {error_msg}")

        # Parse JSON response
        try:
            result = json.loads(stdout.decode())
            # Extract the assistant's reply from nested structure
            if isinstance(result, dict):
                # Try result.payloads[0].text first
                payloads = result.get("result", {}).get("payloads", [])
                if payloads and isinstance(payloads[0], dict):
                    text = payloads[0].get("text")
                    if text:
                        return text
                # Fallback to other common fields
                return result.get("reply", result.get("text", str(result)))
            return str(result)
        except json.JSONDecodeError:
            # Return raw output if not JSON
            return stdout.decode().strip()

    async def run(self) -> None:
        """Run the handler loop."""
        try:
            while True:
                event = await async_read_event(self.reader)
                if event is None:
                    break
                if not await self.handle_event(event):
                    break
        finally:
            self.writer.close()


async def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Wyoming server for Clawdbot")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=10400, help="Port to listen on")
    parser.add_argument("--agent", help="Clawdbot agent id")
    parser.add_argument("--session-id", help="Clawdbot session id for context")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    # Build extra clawdbot args
    clawdbot_args = []
    if args.agent:
        clawdbot_args.extend(["--agent", args.agent])
    if args.session_id:
        clawdbot_args.extend(["--session-id", args.session_id])

    _LOGGER.info("Starting Wyoming-Clawdbot server on %s:%d", args.host, args.port)

    async def handle_client(
        reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        handler = ClawdbotHandler(reader, writer, clawdbot_args)
        await handler.run()

    server = await asyncio.start_server(handle_client, args.host, args.port)

    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())
