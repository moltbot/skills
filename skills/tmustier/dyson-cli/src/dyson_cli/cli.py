"""Main CLI entry point for dyson-cli."""

import json
import sys
import time
from typing import Optional

import click
from rich.console import Console
from rich.table import Table

from .config import (
    CONFIG_FILE,
    get_device,
    load_config,
    save_config,
    set_default_device,
)

console = Console()

# Device type mapping (from libdyson)
DEVICE_TYPE_NAMES = {
    "455": "Dyson Pure Hot+Cool Link",
    "469": "Dyson Pure Cool Link Desk",
    "475": "Dyson Pure Cool Link Tower",
    "520": "Dyson Pure Cool Desk",
    "527": "Dyson Pure Hot+Cool",
    "527K": "Dyson Purifier Hot+Cool Formaldehyde (HP09)",
    "438": "Dyson Pure Cool Tower",
    "358": "Dyson Pure Humidify+Cool",
    "358E": "Dyson Pure Humidify+Cool Formaldehyde",
    "527E": "Dyson Purifier Hot+Cool Formaldehyde",
    "664": "Dyson Purifier Big+Quiet Formaldehyde",
}


def get_device_type_name(product_type: str) -> str:
    """Get human-readable device type name."""
    return DEVICE_TYPE_NAMES.get(product_type, f"Dyson Device ({product_type})")


@click.group()
@click.version_option()
def cli():
    """Control Dyson devices from the command line."""
    pass


@cli.command()
@click.option("--email", prompt="Dyson account email", help="Your Dyson account email")
@click.option(
    "--region",
    type=click.Choice(["US", "CA", "CN", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "IE"]),
    default="GB",
    help="Dyson account region (country code)",
)
def setup(email: str, region: str):
    """Set up device credentials via Dyson account."""
    try:
        from libdyson.cloud.account import DysonAccount
        from libdyson.exceptions import DysonLoginFailure, DysonServerError
    except ImportError:
        console.print("[red]Error: libdyson not installed. Run: pip install libdyson[/red]")
        sys.exit(1)

    account = DysonAccount()

    console.print(f"Sending OTP to {email}...")
    try:
        verify_func = account.login_email_otp(email, region)
    except DysonServerError as e:
        console.print(f"[red]Server error. Try a different region (e.g., GB, US, DE)[/red]")
        sys.exit(1)
    except DysonLoginFailure as e:
        console.print(f"[red]Login failed: {e}[/red]")
        sys.exit(1)

    console.print("[green]OTP sent! Check your email.[/green]")
    otp = click.prompt("Enter the OTP code from your email")
    password = click.prompt("Enter your Dyson account password", hide_input=True)

    console.print("Verifying...")
    try:
        verify_func(otp, password)
    except DysonLoginFailure as e:
        console.print(f"[red]Verification failed: {e}[/red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)

    console.print("Fetching devices...")
    devices = account.devices()

    if not devices:
        console.print("[yellow]No devices found in your Dyson account.[/yellow]")
        sys.exit(0)

    config = load_config()
    config["devices"] = []

    for device in devices:
        device_info = {
            "name": device.name,
            "serial": device.serial,
            "credential": device.credential,
            "product_type": device.product_type,
        }
        config["devices"].append(device_info)
        console.print(
            f"  Found: {device.name} ({get_device_type_name(device.product_type)})"
        )

    if config["devices"] and not config.get("default_device"):
        config["default_device"] = config["devices"][0]["name"]

    save_config(config)
    console.print(f"\n[green]✓ Saved {len(devices)} device(s) to {CONFIG_FILE}[/green]")


@cli.command("list")
@click.option("--check", "-c", is_flag=True, help="Check if devices are reachable")
def list_devices(check: bool):
    """List configured devices."""
    config = load_config()
    devices = config.get("devices", [])

    if not devices:
        console.print("[yellow]No devices configured. Run 'dyson setup' first.[/yellow]")
        return

    table = Table(title="Configured Devices")
    table.add_column("Name", style="cyan")
    table.add_column("Type", style="green")
    table.add_column("IP", style="dim")
    table.add_column("Default", style="yellow")
    if check:
        table.add_column("Status", style="green")

    default = config.get("default_device")
    for device in devices:
        is_default = "✓" if device.get("name") == default else ""
        ip = device.get("ip", "Not configured")
        
        status = None
        if check and device.get("ip"):
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            try:
                sock.connect((device["ip"], 1883))
                status = "[green]Online[/green]"
            except:
                status = "[red]Offline[/red]"
            finally:
                sock.close()
        
        row = [
            device.get("name", "Unknown"),
            get_device_type_name(device.get("product_type", "")),
            ip,
            is_default,
        ]
        if check:
            row.append(status or "[dim]Skipped[/dim]")
        table.add_row(*row)

    console.print(table)


@cli.command()
@click.option("--device", "-d", help="Device name or serial")
@click.option("--json", "as_json", is_flag=True, help="Output as JSON")
def status(device: Optional[str], as_json: bool):
    """Show device status."""
    device_config = get_device(device)
    if not device_config:
        console.print("[red]No device found. Run 'dyson setup' first.[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
        from libdyson import DEVICE_TYPE_PURE_HOT_COOL, DEVICE_TYPE_PURE_HOT_COOL_LINK
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    ip = device_config.get("ip")
    if not ip:
        console.print("[yellow]No IP address configured. Trying auto-discovery...[/yellow]")
        try:
            from libdyson.discovery import DysonDiscovery

            discovery = DysonDiscovery()
            discovery.start_discovery()
            time.sleep(5)
            discovery.stop_discovery()

            discovered = discovery.devices
            for serial, info in discovered.items():
                if serial == device_config["serial"]:
                    ip = info.address
                    device_config["ip"] = ip
                    config = load_config()
                    for d in config["devices"]:
                        if d["serial"] == serial:
                            d["ip"] = ip
                    save_config(config)
                    console.print(f"[green]Discovered device at {ip}[/green]")
                    break
        except Exception as e:
            console.print(f"[red]Discovery failed: {e}[/red]")

    if not ip:
        console.print("[red]Could not find device IP. Please add 'ip' to config manually.[/red]")
        sys.exit(1)

    console.print(f"Connecting to {device_config['name']} at {ip}...")

    try:
        dyson_device.connect(ip)
        time.sleep(2)  # Wait for state update

        # Raw state for JSON output
        raw_state = {
            "name": device_config["name"],
            "serial": device_config["serial"],
            "type": get_device_type_name(device_config["product_type"]),
            "connected": dyson_device.is_connected,
            "is_on": dyson_device.is_on if hasattr(dyson_device, "is_on") else None,
            "auto_mode": getattr(dyson_device, "auto_mode", None),
            "speed": getattr(dyson_device, "speed", None),
            "oscillation": getattr(dyson_device, "oscillation", None),
            "oscillation_angle_low": getattr(dyson_device, "oscillation_angle_low", None),
            "oscillation_angle_high": getattr(dyson_device, "oscillation_angle_high", None),
            "night_mode": getattr(dyson_device, "night_mode", None),
            "heat_mode_is_on": getattr(dyson_device, "heat_mode_is_on", None),
            "heat_target": getattr(dyson_device, "heat_target", None),
            "temperature": getattr(dyson_device, "temperature", None),
            "humidity": getattr(dyson_device, "humidity", None),
        }

        dyson_device.disconnect()

        if as_json:
            console.print(json.dumps(raw_state, indent=2))
        else:
            table = Table(title=f"{device_config['name']}")
            table.add_column("", style="cyan")
            table.add_column("", style="green")

            # Connected
            connected = "[green]✓[/green]" if raw_state["connected"] else "[red]✗[/red]"
            table.add_row("Connected", connected)

            # Fan speed
            if raw_state.get("auto_mode"):
                fan_display = "Auto"
            elif raw_state.get("speed") is not None:
                fan_display = str(raw_state["speed"])
            else:
                fan_display = "[dim]Off[/dim]"
            table.add_row("Fan Speed", fan_display)

            # Oscillation
            if raw_state.get("oscillation"):
                angle_low = raw_state.get("oscillation_angle_low", 0)
                angle_high = raw_state.get("oscillation_angle_high", 0)
                angle_range = angle_high - angle_low
                osc_display = f"{angle_range}° ({angle_low}°–{angle_high}°)"
            else:
                osc_display = "[dim]Off[/dim]"
            table.add_row("Oscillation", osc_display)

            # Heat (Hot+Cool models)
            if raw_state.get("heat_mode_is_on") is not None:
                if raw_state["heat_mode_is_on"]:
                    target_k = raw_state.get("heat_target", 293)
                    target_c = target_k - 273
                    heat_display = f"On → {target_c:.0f}°C"
                else:
                    heat_display = "[dim]Off[/dim]"
                table.add_row("Heat", heat_display)

            # Environment
            if raw_state.get("temperature") is not None:
                temp_c = raw_state["temperature"] - 273
                table.add_row("Temperature", f"{temp_c:.1f}°C")
            
            if raw_state.get("humidity") is not None:
                table.add_row("Humidity", f"{raw_state['humidity']}%")

            # Night mode (quieter + dims display)
            night = "[green]✓[/green]" if raw_state.get("night_mode") else "[dim]Off[/dim]"
            table.add_row("Night Mode", night)

            console.print(table)

    except Exception as e:
        console.print(f"[red]Connection failed: {e}[/red]")
        sys.exit(1)


@cli.command()
@click.option("--device", "-d", help="Device name or serial")
def on(device: Optional[str]):
    """Turn device on."""
    _control_power(device, True)


@cli.command()
@click.option("--device", "-d", help="Device name or serial")
def off(device: Optional[str]):
    """Turn device off."""
    _control_power(device, False)


def _control_power(device_name: Optional[str], power_on: bool):
    """Control device power."""
    device_config = get_device(device_name)
    if not device_config:
        console.print("[red]No device found.[/red]")
        sys.exit(1)

    ip = device_config.get("ip")
    if not ip:
        console.print("[red]No IP configured. Run 'dyson status' first to discover.[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    try:
        dyson_device.connect(ip)
        time.sleep(1)

        if power_on:
            dyson_device.turn_on()
            console.print(f"[green]✓ {device_config['name']} turned on[/green]")
        else:
            dyson_device.turn_off()
            console.print(f"[green]✓ {device_config['name']} turned off[/green]")

        dyson_device.disconnect()

    except Exception as e:
        console.print(f"[red]Failed: {e}[/red]")
        sys.exit(1)


@cli.group()
def fan():
    """Fan control commands."""
    pass


@fan.command("speed")
@click.argument("speed")
@click.option("--device", "-d", help="Device name or serial")
def fan_speed(speed: str, device: Optional[str]):
    """Set fan speed (1-10 or 'auto')."""
    device_config = get_device(device)
    if not device_config:
        console.print("[red]No device found.[/red]")
        sys.exit(1)

    ip = device_config.get("ip")
    if not ip:
        console.print("[red]No IP configured.[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    try:
        dyson_device.connect(ip)
        time.sleep(1)

        if speed.lower() == "auto":
            dyson_device.enable_auto_mode()
            console.print("[green]✓ Fan set to auto[/green]")
        else:
            speed_int = int(speed)
            if not 1 <= speed_int <= 10:
                console.print("[red]Speed must be 1-10 or 'auto'[/red]")
                sys.exit(1)
            dyson_device.disable_auto_mode()
            dyson_device.set_speed(speed_int)
            console.print(f"[green]✓ Fan speed set to {speed_int}[/green]")

        dyson_device.disconnect()

    except ValueError:
        console.print("[red]Speed must be a number 1-10 or 'auto'[/red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Failed: {e}[/red]")
        sys.exit(1)


@fan.command("oscillate")
@click.argument("state", type=click.Choice(["on", "off"]))
@click.option("--angle", "-a", type=int, help="Oscillation range in degrees (45, 90, 180, or 350)")
@click.option("--device", "-d", help="Device name or serial")
def fan_oscillate(state: str, angle: Optional[int], device: Optional[str]):
    """Enable or disable oscillation. Use --angle to set range (e.g., 90 for 90 degrees)."""
    device_config = get_device(device)
    if not device_config:
        console.print("[red]No device found.[/red]")
        sys.exit(1)

    ip = device_config.get("ip")
    if not ip:
        console.print("[red]No IP configured.[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    try:
        dyson_device.connect(ip)
        time.sleep(1)

        if state == "on":
            if angle:
                # Center the oscillation around current position (or 180 degrees)
                center = 180
                half = angle // 2
                angle_low = max(5, center - half)
                angle_high = min(355, center + half)
                dyson_device.enable_oscillation(angle_low=angle_low, angle_high=angle_high)
                console.print(f"[green]✓ Oscillation enabled ({angle}° range)[/green]")
            else:
                dyson_device.enable_oscillation()
                console.print("[green]✓ Oscillation enabled[/green]")
        else:
            dyson_device.disable_oscillation()
            console.print("[green]✓ Oscillation disabled[/green]")

        dyson_device.disconnect()

    except Exception as e:
        console.print(f"[red]Failed: {e}[/red]")
        sys.exit(1)


@cli.group()
def heat():
    """Heat control commands (Hot+Cool models only)."""
    pass


@heat.command("on")
@click.option("--device", "-d", help="Device name or serial")
def heat_on(device: Optional[str]):
    """Enable heat mode."""
    _control_heat(device, True)


@heat.command("off")
@click.option("--device", "-d", help="Device name or serial")
def heat_off(device: Optional[str]):
    """Disable heat mode."""
    _control_heat(device, False)


def _control_heat(device_name: Optional[str], enable: bool):
    """Control heat mode."""
    device_config = get_device(device_name)
    if not device_config:
        console.print("[red]No device found.[/red]")
        sys.exit(1)

    ip = device_config.get("ip")
    if not ip:
        console.print("[red]No IP configured.[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    try:
        dyson_device.connect(ip)
        time.sleep(1)

        if not hasattr(dyson_device, "enable_heat_mode"):
            console.print("[red]This device does not support heat mode.[/red]")
            sys.exit(1)

        if enable:
            dyson_device.enable_heat_mode()
            console.print("[green]✓ Heat mode enabled[/green]")
        else:
            dyson_device.disable_heat_mode()
            console.print("[green]✓ Heat mode disabled[/green]")

        dyson_device.disconnect()

    except Exception as e:
        console.print(f"[red]Failed: {e}[/red]")
        sys.exit(1)


@heat.command("target")
@click.argument("temperature", type=int)
@click.option("--device", "-d", help="Device name or serial")
def heat_target(temperature: int, device: Optional[str]):
    """Set target temperature in Celsius (1-37)."""
    device_config = get_device(device)
    if not device_config:
        console.print("[red]No device found.[/red]")
        sys.exit(1)

    ip = device_config.get("ip")
    if not ip:
        console.print("[red]No IP configured.[/red]")
        sys.exit(1)

    if not 1 <= temperature <= 37:
        console.print("[red]Temperature must be between 1 and 37°C[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    try:
        dyson_device.connect(ip)
        time.sleep(1)

        if not hasattr(dyson_device, "set_heat_target"):
            console.print("[red]This device does not support heat target.[/red]")
            sys.exit(1)

        # libdyson uses Kelvin internally
        dyson_device.set_heat_target(temperature + 273)
        console.print(f"[green]✓ Target temperature set to {temperature}°C[/green]")

        dyson_device.disconnect()

    except Exception as e:
        console.print(f"[red]Failed: {e}[/red]")
        sys.exit(1)


@cli.command()
@click.argument("state", type=click.Choice(["on", "off"]))
@click.option("--device", "-d", help="Device name or serial")
def night(state: str, device: Optional[str]):
    """Enable or disable night mode."""
    device_config = get_device(device)
    if not device_config:
        console.print("[red]No device found.[/red]")
        sys.exit(1)

    ip = device_config.get("ip")
    if not ip:
        console.print("[red]No IP configured.[/red]")
        sys.exit(1)

    try:
        from libdyson import get_device as libdyson_get_device
    except ImportError:
        console.print("[red]Error: libdyson not installed.[/red]")
        sys.exit(1)

    dyson_device = libdyson_get_device(
        device_config["serial"],
        device_config["credential"],
        device_config["product_type"],
    )

    try:
        dyson_device.connect(ip)
        time.sleep(1)

        enable = state == "on"
        dyson_device.enable_night_mode() if enable else dyson_device.disable_night_mode()
        console.print(f"[green]✓ Night mode {'enabled' if enable else 'disabled'}[/green]")

        dyson_device.disconnect()

    except Exception as e:
        console.print(f"[red]Failed: {e}[/red]")
        sys.exit(1)


@cli.command("default")
@click.argument("name")
def set_default(name: str):
    """Set the default device."""
    if set_default_device(name):
        console.print(f"[green]✓ Default device set to {name}[/green]")
    else:
        console.print(f"[red]Device '{name}' not found.[/red]")
        sys.exit(1)


@cli.command("remove")
@click.argument("name")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation")
def remove_device(name: str, force: bool):
    """Remove a device from the config."""
    config = load_config()
    devices = config.get("devices", [])
    
    # Find device
    device = None
    for d in devices:
        if d.get("name", "").lower() == name.lower() or d.get("serial", "").lower() == name.lower():
            device = d
            break
    
    if not device:
        console.print(f"[red]Device '{name}' not found.[/red]")
        sys.exit(1)
    
    if not force:
        if not click.confirm(f"Remove {device.get('name')} ({device.get('serial')})?"):
            console.print("Cancelled.")
            return
    
    config["devices"] = [d for d in devices if d.get("serial") != device.get("serial")]
    
    # Update default if needed
    if config.get("default_device") == device.get("name"):
        config["default_device"] = config["devices"][0]["name"] if config["devices"] else None
    
    save_config(config)
    console.print(f"[green]✓ Removed {device.get('name')}[/green]")


if __name__ == "__main__":
    cli()
