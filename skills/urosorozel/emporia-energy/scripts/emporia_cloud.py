#!/usr/bin/env python3
import sys
from datetime import datetime, timezone

from pyemvue import PyEmVue
from pyemvue.enums import Scale

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
            die("Usage: emporia_cloud.py circuit <name>")
        return command, " ".join(argv[2:]).strip()
    die("Usage: emporia_cloud.py [summary|list|circuit <name>]")


def scale_usage(usage, scale):
    if usage is None:
        return 0.0
    if scale == Scale.MINUTE.value:
        return 60 * 1000 * usage
    if scale == Scale.SECOND.value:
        return 3600 * 1000 * usage
    if scale == Scale.MINUTES_15.value:
        return 4 * 1000 * usage
    return usage


def unit_for_scale(scale):
    if scale in (Scale.MINUTE.value, Scale.SECOND.value, Scale.MINUTES_15.value):
        return "W"
    return "kWh"


def login(vue, email, password):
    if email.startswith("vue_simulator@"):
        host = email.split("@", 1)[1]
        return vue.login_simulator(host)
    return vue.login(email, password)


def collect_devices(vue):
    devices = vue.get_devices()
    device_map = {}
    channel_map = {}
    gids = []
    for device in devices:
        gids.append(device.device_gid)
        device_map[device.device_gid] = device
        for channel in device.channels:
            channel_map[(device.device_gid, channel.channel_num)] = {
                "device": device.device_name,
                "name": channel.name or f"Channel {channel.channel_num}",
                "channel_num": channel.channel_num,
                "device_gid": device.device_gid,
            }
    return gids, device_map, channel_map


def fetch_usage(vue, gids, scale):
    timestamp = datetime.now(timezone.utc)
    usage_devices = vue.get_device_list_usage(gids, timestamp, scale)
    if not usage_devices:
        return [], timestamp
    channels = []
    for usage in usage_devices.values():
        ts = usage.timestamp or timestamp
        if not usage.channels:
            continue
        for ch in usage.channels.values():
            channels.append(
                {
                    "device_gid": ch.device_gid,
                    "channel_num": ch.channel_num,
                    "usage": ch.usage,
                    "timestamp": ts,
                }
            )
    return channels, timestamp


def main(argv):
    command, query = parse_args(argv)
    email = get_env("EMPORIA_EMAIL")
    password = get_env("EMPORIA_PASSWORD")
    scale_env = get_env("EMPORIA_SCALE", required=False, default="MINUTE")

    try:
        scale = Scale[scale_env.upper()].value
    except KeyError:
        die("EMPORIA_SCALE must be one of: MINUTE, SECOND, MINUTES_15, DAY, MONTH")

    vue = PyEmVue()
    if not login(vue, email, password):
        die("Failed to login to Emporia")

    gids, device_map, channel_map = collect_devices(vue)
    if not gids:
        die("No Emporia devices found")

    usage_channels, fallback_ts = fetch_usage(vue, gids, scale)
    unit = unit_for_scale(scale)

    channels = []
    for usage in usage_channels:
        key = (usage["device_gid"], usage["channel_num"])
        meta = channel_map.get(key, {})
        value = scale_usage(usage.get("usage"), scale)
        channels.append(
            {
                "device_gid": usage["device_gid"],
                "device": meta.get("device"),
                "name": meta.get("name"),
                "channel_num": usage["channel_num"],
                "value": round(value, 3),
                "unit": unit,
                "timestamp": now_iso(usage.get("timestamp") or fallback_ts),
            }
        )

    if command == "list":
        payload = {
            "timestamp": now_iso(),
            "mode": "cloud",
            "count": len(channels),
            "channels": [
                {
                    "device_gid": ch["device_gid"],
                    "device": ch["device"],
                    "name": ch["name"],
                    "channel_num": ch["channel_num"],
                }
                for ch in channels
            ],
        }
        print_json(payload)
        return

    if command == "circuit":
        matches = match_channels(channels, query)
        payload = {
            "timestamp": now_iso(),
            "mode": "cloud",
            "query": query,
            "unit": unit,
            "matches": matches,
        }
        print_json(payload)
        return

    total_channel = pick_total_channel(channels)
    top = top_circuits(channels, total_channel)
    payload = {
        "timestamp": now_iso(),
        "mode": "cloud",
        "unit": unit,
        "scale": scale,
        "total": total_channel,
        "top_circuits": top,
        "channels_used": len(channels),
    }
    print_json(payload)


if __name__ == "__main__":
    main(sys.argv)
