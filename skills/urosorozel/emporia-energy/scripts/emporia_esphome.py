#!/usr/bin/env python3
import asyncio
import base64
import sys

from aioesphomeapi import APIClient

from common import (
    die,
    get_env,
    match_channels,
    now_iso,
    pick_total_channel,
    print_json,
    top_circuits,
)


def parse_args(argv):
    if len(argv) < 2:
        return "summary", None
    command = argv[1].lower()
    if command in ("summary", "list"):
        return command, None
    if command == "circuit":
        if len(argv) < 3:
            die("Usage: emporia_esphome.py circuit <name>")
        return command, " ".join(argv[2:]).strip()
    die("Usage: emporia_esphome.py [summary|list|circuit <name>]")


def parse_encryption(api_key, password):
    if api_key:
        try:
            decoded = base64.b64decode(api_key)
            if len(decoded) == 32:
                return None, decoded
        except Exception:
            pass
        return api_key, None
    return password, None


def state_value(state):
    for attr in ("state", "value", "text"):
        if hasattr(state, attr):
            return getattr(state, attr)
    return None


async def fetch_states(host, port, password, noise_psk):
    client = APIClient(host, port, password=password, noise_psk=noise_psk)
    await client.connect(login=True)
    entities, _ = await client.list_entities_services()
    states = await client.get_states()
    await client.disconnect()
    return entities, states


def build_channels(entities, states):
    entity_by_key = {entity.key: entity for entity in entities}
    channels = []
    for state in states:
        info = entity_by_key.get(state.key)
        name = getattr(info, "name", None)
        unit = getattr(info, "unit_of_measurement", None)
        value = state_value(state)
        if not isinstance(value, (int, float)):
            continue
        channels.append(
            {
                "key": state.key,
                "name": name,
                "unit": unit,
                "value": round(float(value), 3),
            }
        )
    return channels


def main(argv):
    command, query = parse_args(argv)
    host = get_env("ESPHOME_HOST")
    port = int(get_env("ESPHOME_PORT", required=False, default="6053"))
    api_key = get_env("ESPHOME_API_KEY", required=False, default=None)
    password = get_env("ESPHOME_PASSWORD", required=False, default=None)
    password, noise_psk = parse_encryption(api_key, password)

    try:
        entities, states = asyncio.run(fetch_states(host, port, password, noise_psk))
    except Exception as exc:
        die(f"Failed to query ESPHome API: {exc}")

    channels = build_channels(entities, states)
    if not channels:
        die("No numeric sensor channels found from ESPHome")

    if command == "list":
        payload = {
            "timestamp": now_iso(),
            "mode": "esphome",
            "count": len(channels),
            "channels": [
                {"key": ch["key"], "name": ch["name"], "unit": ch["unit"]}
                for ch in channels
            ],
        }
        print_json(payload)
        return

    if command == "circuit":
        matches = match_channels(channels, query)
        payload = {
            "timestamp": now_iso(),
            "mode": "esphome",
            "query": query,
            "matches": matches,
        }
        print_json(payload)
        return

    total_channel = pick_total_channel(channels)
    top = top_circuits(channels, total_channel)
    unit = total_channel.get("unit") if total_channel else None
    payload = {
        "timestamp": now_iso(),
        "mode": "esphome",
        "unit": unit,
        "total": total_channel,
        "top_circuits": top,
        "channels_used": len(channels),
    }
    print_json(payload)


if __name__ == "__main__":
    main(sys.argv)
