#!/usr/bin/env python3
"""Anova Oven Control - Fixed command structure"""
import asyncio, websockets, json, argparse, sys, uuid
from pathlib import Path
from datetime import datetime

TOKEN_FILE = Path.home() / ".config" / "anova" / "token"

class AnovaDevice:
    def __init__(self, token):
        self.token = token.strip()
        self.ws = None
        self.devices = []
        self.current_device = None
        self.message_history = []
        
    def generate_uuid(self):
        return str(uuid.uuid4())
        
    async def connect(self):
        uri = f"wss://devices.anovaculinary.io?token={self.token}&supportedAccessories=APC,APO"
        try:
            self.ws = await websockets.connect(uri)
            await self.wait_for_discovery()
        except Exception as e:
            print(f"Connection error: {e}")
            raise
    
    async def wait_for_discovery(self):
        timeout = 5
        start = asyncio.get_event_loop().time()
        while (asyncio.get_event_loop().time() - start) < timeout:
            try:
                message = await asyncio.wait_for(self.ws.recv(), timeout=1.0)
                data = json.loads(message)
                self.message_history.append(data)
                
                if data.get("command") == "EVENT_APC_WIFI_LIST" and "payload" in data:
                    for device in data["payload"]:
                        if not any(d["id"] == device["cookerId"] for d in self.devices):
                            self.devices.append({
                                "id": device["cookerId"],
                                "name": device.get("name", "Anova Precision Cooker"),
                                "type": "APC",
                                "device_type": device.get("type", "unknown"),
                                "data": device
                            })
                
                elif data.get("command") == "EVENT_APO_WIFI_LIST" and "payload" in data:
                    for device in data["payload"]:
                        if not any(d["id"] == device["cookerId"] for d in self.devices):
                            self.devices.append({
                                "id": device["cookerId"],
                                "name": device.get("name", "Anova Precision Oven"),
                                "type": "APO",
                                "device_type": device.get("type", "unknown"),
                                "data": device
                            })
                
                if self.devices:
                    break
            except asyncio.TimeoutError:
                continue
            except json.JSONDecodeError:
                continue
    
    async def discover_devices(self):
        await self.connect()
        return self.devices
    
    async def get_working_elements(self):
        """Detect which heating elements are working (not failed)"""
        # Wait for a state message with element status
        for _ in range(20):
            try:
                message = await asyncio.wait_for(self.ws.recv(), timeout=0.5)
                data = json.loads(message)
                self.message_history.append(data)
                
                if data.get("command") == "EVENT_APO_STATE":
                    payload = data.get("payload", {})
                    nodes = payload.get("state", {}).get("nodes", {})
                    elements = nodes.get("heatingElements", {})
                    
                    working = []
                    for element in ["top", "bottom", "rear"]:
                        if element in elements and not elements[element].get("failed", False):
                            working.append(element)
                    
                    if working:
                        return working
            except (asyncio.TimeoutError, json.JSONDecodeError):
                continue
        
        # Fallback: return bottom + rear (safe default)
        return ["bottom", "rear"]
    
    async def send_command(self, command):
        await self.ws.send(json.dumps(command))
        try:
            response = await asyncio.wait_for(self.ws.recv(), timeout=5.0)
            return json.loads(response)
        except asyncio.TimeoutError:
            return None
    
    async def start_cook(self, temp, unit="F", duration=None, elements=None, fan_speed=None, 
                        humidity=None, probe_temp=None):
        """Start cooking - simplified to match official Anova structure"""
        temp_c = temp if unit == "C" else (temp - 32) * 5/9
        temp_f = temp if unit == "F" else (temp * 9/5) + 32
        
        # Default settings - auto-detect working elements
        if elements is None:
            # Try to detect which elements are working
            working_elements = await self.get_working_elements()
            elements = working_elements
            print(f"Auto-detected working elements: {', '.join(elements)}")
        if fan_speed is None:
            fan_speed = 50
            
        heating_elements = {
            "top": {"on": "top" in elements},
            "bottom": {"on": "bottom" in elements},
            "rear": {"on": "rear" in elements}
        }
        
        # Build temperature bulbs - always use DRY mode
        temp_bulbs = {
            "mode": "dry",
            "dry": {
                "setpoint": {
                    "celsius": temp_c,
                    "fahrenheit": temp_f
                }
            }
        }
        
        # Preheat stage
        preheat_stage = {
            "stepType": "stage",
            "id": self.generate_uuid(),
            "title": "",
            "description": "",
            "type": "preheat",
            "userActionRequired": False,
            "temperatureBulbs": temp_bulbs,
            "heatingElements": heating_elements,
            "fan": {"speed": fan_speed},
            "vent": {"open": False},
            "rackPosition": 3,
            "stageTransitionType": "automatic"
        }
        
        # Add steam if humidity specified
        if humidity is not None:
            preheat_stage["steamGenerators"] = {
                "mode": "relative-humidity",
                "relativeHumidity": {"setpoint": humidity}
            }
        
        # Cook stage
        cook_stage = {
            "stepType": "stage",
            "id": self.generate_uuid(),
            "title": "",
            "description": "",
            "type": "cook",
            "userActionRequired": False,
            "temperatureBulbs": temp_bulbs,
            "heatingElements": heating_elements,
            "fan": {"speed": fan_speed},
            "vent": {"open": False},
            "rackPosition": 3,
            "stageTransitionType": "automatic"
        }
        
        if humidity is not None:
            cook_stage["steamGenerators"] = {
                "mode": "relative-humidity",
                "relativeHumidity": {"setpoint": humidity}
            }
        
        # Timer or probe
        if probe_temp is not None:
            probe_temp_c = probe_temp if unit == "C" else (probe_temp - 32) * 5/9
            probe_temp_f = probe_temp if unit == "F" else (probe_temp * 9/5) + 32
            cook_stage["temperatureProbe"] = {
                "setpoint": {
                    "celsius": probe_temp_c,
                    "fahrenheit": probe_temp_f
                }
            }
        elif duration:
            cook_stage["timer"] = {
                "initial": duration * 60
            }
        
        command = {
            "command": "CMD_APO_START",
            "payload": {
                "id": self.current_device["id"],
                "payload": {
                    "cookId": self.generate_uuid(),
                    "cookerId": self.current_device["id"],
                    "cookableId": "",
                    "title": "",
                    "type": self.current_device["device_type"],
                    "originSource": "api",
                    "cookableType": "manual",
                    "stages": [preheat_stage, cook_stage]
                },
                "type": "CMD_APO_START"
            },
            "requestId": self.generate_uuid()
        }
        
        return await self.send_command(command)
    
    async def stop_cook(self):
        command = {
            "command": "CMD_APO_STOP",
            "payload": {
                "id": self.current_device["id"],
                "type": "CMD_APO_STOP"
            },
            "requestId": self.generate_uuid()
        }
        return await self.send_command(command)
    
    async def monitor(self, duration=60):
        start = datetime.now()
        print(f"Monitoring device for {duration} seconds...\n")
        try:
            while (datetime.now() - start).seconds < duration:
                try:
                    message = await asyncio.wait_for(self.ws.recv(), timeout=1.0)
                    data = json.loads(message)
                    self.message_history.append(data)
                    if data.get("command") == f"EVENT_{self.current_device['type']}_STATE":
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        payload = data.get("payload", {})
                        print(f"[{timestamp}] {json.dumps(payload, indent=2)}")
                except asyncio.TimeoutError:
                    continue
                except json.JSONDecodeError:
                    continue
        except KeyboardInterrupt:
            print("\nMonitoring stopped")
    
    async def close(self):
        if self.ws:
            await self.ws.close()

async def main():
    parser = argparse.ArgumentParser(description="Anova Oven Control")
    parser.add_argument("action", choices=["list", "cook", "stop", "monitor"])
    parser.add_argument("--temp", type=float)
    parser.add_argument("--unit", choices=["C", "F"], default="F")
    parser.add_argument("--duration", type=int, help="Minutes")
    parser.add_argument("--elements", help="Comma-separated: top,bottom,rear")
    parser.add_argument("--fan-speed", type=int, help="0-100")
    parser.add_argument("--humidity", type=int, help="0-100")
    parser.add_argument("--probe-temp", type=float)
    parser.add_argument("--monitor-duration", type=int, default=60)
    args = parser.parse_args()
    
    if not TOKEN_FILE.exists():
        print(f"Error: Token file not found at {TOKEN_FILE}")
        sys.exit(1)
    
    token = TOKEN_FILE.read_text().strip()
    device = AnovaDevice(token)
    
    try:
        if args.action == "list":
            devices = await device.discover_devices()
            if not devices:
                print("No devices found")
                sys.exit(1)
            print(f"Found {len(devices)} device(s):\n")
            for i, dev in enumerate(devices):
                print(f"{i+1}. {dev['name']} ({dev['type']})")
                print(f"   ID: {dev['id']}\n")
        else:
            devices = await device.discover_devices()
            if not devices:
                print("No devices found")
                sys.exit(1)
            device.current_device = devices[0]
            print(f"Using device: {device.current_device['name']}\n")
            
            if args.action == "cook":
                if args.temp is None:
                    print("Error: --temp required")
                    sys.exit(1)
                if not args.duration and not args.probe_temp:
                    print("Error: Either --duration or --probe-temp required")
                    sys.exit(1)
                
                elements = None
                if args.elements:
                    elements = [e.strip() for e in args.elements.split(",")]
                
                desc = f"Cooking at {args.temp}°{args.unit}"
                if args.duration:
                    desc += f" for {args.duration} min"
                if args.probe_temp:
                    desc += f" until probe {args.probe_temp}°{args.unit}"
                if args.humidity:
                    desc += f" with {args.humidity}% humidity"
                if args.elements:
                    desc += f" [elements: {args.elements}]"
                if args.fan_speed:
                    desc += f" [fan: {args.fan_speed}]"
                print(f"{desc}...")
                
                response = await device.start_cook(
                    temp=args.temp,
                    unit=args.unit,
                    duration=args.duration,
                    elements=elements,
                    fan_speed=args.fan_speed,
                    humidity=args.humidity,
                    probe_temp=args.probe_temp
                )
                print("✓ Cook started!")
                if response:
                    print(f"Response: {json.dumps(response, indent=2)}")
            
            elif args.action == "stop":
                print("Stopping cook...")
                response = await device.stop_cook()
                print("✓ Stopped!")
                if response:
                    print(f"Response: {json.dumps(response, indent=2)}")
            
            elif args.action == "monitor":
                await device.monitor(args.monitor_duration)
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await device.close()

if __name__ == "__main__":
    asyncio.run(main())
