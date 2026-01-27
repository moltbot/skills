#!/usr/bin/env python3
"""
Ham Radio DX Cluster Monitor
Monitor DX clusters for spots and expeditions, with notifications
"""

import argparse
import socket
import time
import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import sys

# Popular DX Cluster nodes
DX_CLUSTERS = {
    'ea7jxh': ('dx.ea7jxh.eu', 7373),
    'om0rx': ('cluster.om0rx.com', 7300),
    'oh2aq': ('oh2aq.kolumbus.fi', 7373),
    'ab5k': ('ab5k.net', 7373),
    'w6rk': ('telnet.w6rk.com', 7373),
}

STATE_FILE = "/tmp/dx-monitor-state.json"


class DXClusterClient:
    """Simple DX Cluster telnet client."""
    
    def __init__(self, host: str, port: int, callsign: str = "N0CALL"):
        self.host = host
        self.port = port
        self.callsign = callsign
        self.sock = None
        
    def connect(self):
        """Connect to DX cluster."""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(10)
            self.sock.connect((self.host, self.port))
            
            # Read login prompt
            self._read_until(b'login:', timeout=5)
            
            # Send callsign
            self.sock.sendall(f"{self.callsign}\n".encode())
            
            # Read welcome messages
            time.sleep(1)
            self._read_available()
            
            return True
        except Exception as e:
            print(f"Connection error: {e}", file=sys.stderr)
            return False
    
    def _read_until(self, marker: bytes, timeout: float = 5):
        """Read until marker found."""
        data = b''
        start = time.time()
        while time.time() - start < timeout:
            try:
                chunk = self.sock.recv(1024)
                if not chunk:
                    break
                data += chunk
                if marker in data:
                    return data
            except socket.timeout:
                break
        return data
    
    def _read_available(self):
        """Read all available data."""
        self.sock.settimeout(0.1)
        data = b''
        try:
            while True:
                chunk = self.sock.recv(4096)
                if not chunk:
                    break
                data += chunk
        except socket.timeout:
            pass
        self.sock.settimeout(10)
        return data
    
    def get_spots(self, count: int = 20) -> List[Dict]:
        """Get recent DX spots."""
        if not self.sock:
            return []
        
        # Request spots
        self.sock.sendall(f"show/dx {count}\n".encode())
        time.sleep(0.5)
        
        # Read response
        data = self._read_available().decode('utf-8', errors='ignore')
        
        # Parse spots
        spots = []
        for line in data.split('\n'):
            spot = self._parse_spot_line(line)
            if spot:
                spots.append(spot)
        
        return spots
    
    def _parse_spot_line(self, line: str) -> Optional[Dict]:
        """Parse a DX spot line."""
        # Format: DX de CALL: FREQ DX COMMENT TIME
        # Example: DX de W1AW: 14.195 K1ABC CQ 1234Z
        
        if not line.startswith('DX de '):
            return None
        
        try:
            parts = line.split()
            if len(parts) < 5:
                return None
            
            spotter = parts[2].rstrip(':')
            freq = float(parts[3])
            dx_call = parts[4]
            comment = ' '.join(parts[5:-1]) if len(parts) > 5 else ''
            time_str = parts[-1] if len(parts) > 5 else ''
            
            return {
                'spotter': spotter,
                'frequency': freq,
                'dx_station': dx_call,
                'comment': comment,
                'time': time_str,
                'band': self._freq_to_band(freq),
                'mode': self._guess_mode(freq, comment),
                'raw': line
            }
        except:
            return None
    
    def _freq_to_band(self, freq: float) -> str:
        """Convert frequency to band name."""
        if freq < 2:
            return '160m'
        elif freq < 4:
            return '80m'
        elif freq < 7.5:
            return '40m'
        elif freq < 11:
            return '30m'
        elif freq < 15:
            return '20m'
        elif freq < 19:
            return '17m'
        elif freq < 22:
            return '15m'
        elif freq < 25:
            return '12m'
        elif freq < 30:
            return '10m'
        elif freq < 55:
            return '6m'
        else:
            return f'{freq:.3f}MHz'
    
    def _guess_mode(self, freq: float, comment: str) -> str:
        """Guess mode from frequency and comment."""
        comment_upper = comment.upper()
        
        if 'CW' in comment_upper or 'QRQ' in comment_upper:
            return 'CW'
        elif 'SSB' in comment_upper or 'PHONE' in comment_upper:
            return 'SSB'
        elif 'FT8' in comment_upper or 'FT4' in comment_upper:
            return comment_upper.split()[0] if 'FT' in comment_upper else 'FT8'
        elif 'RTTY' in comment_upper:
            return 'RTTY'
        elif 'PSK' in comment_upper:
            return 'PSK'
        
        # Guess by frequency
        frac = freq - int(freq)
        if frac < 0.05:  # Lower part of band
            return 'CW'
        elif frac > 0.1:  # Upper part
            return 'SSB'
        
        return 'UNKNOWN'
    
    def close(self):
        """Close connection."""
        if self.sock:
            try:
                self.sock.sendall(b"bye\n")
                self.sock.close()
            except:
                pass


def load_state() -> Dict:
    """Load previous state."""
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except:
        return {'last_spots': [], 'last_check': 0}


def save_state(state: Dict):
    """Save state."""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def filter_new_spots(spots: List[Dict], state: Dict) -> List[Dict]:
    """Filter for new spots not seen before."""
    last_spots = set(state.get('last_spots', []))
    new = []
    
    for spot in spots:
        key = f"{spot['dx_station']}:{spot['frequency']:.1f}:{spot['time']}"
        if key not in last_spots:
            new.append(spot)
            last_spots.add(key)
    
    # Keep only last 100 spots
    state['last_spots'] = list(last_spots)[-100:]
    return new


def cmd_watch(args):
    """Watch for new DX spots."""
    cluster_name = args.cluster or 'ea7jxh'
    if cluster_name not in DX_CLUSTERS:
        print(f"Unknown cluster: {cluster_name}", file=sys.stderr)
        print(f"Available: {', '.join(DX_CLUSTERS.keys())}", file=sys.stderr)
        sys.exit(1)
    
    host, port = DX_CLUSTERS[cluster_name]
    callsign = args.callsign or "DX0MON"
    
    print(f"📻 Connecting to {cluster_name} ({host}:{port})...")
    
    client = DXClusterClient(host, port, callsign)
    if not client.connect():
        print("❌ Connection failed", file=sys.stderr)
        sys.exit(1)
    
    print(f"✅ Connected as {callsign}\n")
    
    # Get spots
    spots = client.get_spots(args.limit)
    client.close()
    
    if not spots:
        print("No spots received", file=sys.stderr)
        return
    
    # Load state and filter new
    state = load_state()
    if args.new_only:
        new_spots = filter_new_spots(spots, state)
        save_state(state)
        spots = new_spots
        
        if not spots:
            print("✅ No new spots since last check")
            return
        
        print(f"🚨 {len(spots)} NEW SPOTS!\n")
    
    # Display spots
    if args.json:
        print(json.dumps(spots, indent=2))
    else:
        print(f"📡 Latest DX Spots from {cluster_name.upper()}\n")
        for spot in spots:
            band = spot['band']
            mode = spot['mode']
            print(f"   {band:5} {mode:6} {spot['frequency']:8.1f} {spot['dx_station']:12} - {spot['comment']}")
            if args.verbose:
                print(f"         Spotted by {spot['spotter']} at {spot['time']}")
    
    print()


def cmd_digest(args):
    """Generate daily DX digest."""
    cluster_name = args.cluster or 'ea7jxh'
    host, port = DX_CLUSTERS[cluster_name]
    callsign = args.callsign or "DX0MON"
    
    print(f"📻 Generating DX Digest from {cluster_name}...\n")
    
    client = DXClusterClient(host, port, callsign)
    if not client.connect():
        print("❌ Connection failed", file=sys.stderr)
        sys.exit(1)
    
    # Get many spots to analyze
    spots = client.get_spots(100)
    client.close()
    
    if not spots:
        print("No spots received")
        return
    
    # Analyze by band
    by_band = {}
    rare_dx = []
    
    for spot in spots:
        band = spot['band']
        by_band[band] = by_band.get(band, 0) + 1
        
        # Check for rare DX (prefixes that aren't common)
        call = spot['dx_station']
        if any(prefix in call for prefix in ['VP8', 'ZL', 'VK', 'ZS', 'P5', 'P4', '9G', 'S9']):
            rare_dx.append(spot)
    
    print(f"# 📡 DX Digest - {datetime.now().strftime('%Y-%m-%d')}\n")
    print(f"## Band Activity (last 100 spots)\n")
    
    for band in sorted(by_band.keys(), key=lambda x: float(x.replace('m', '') if 'm' in x else '999')):
        count = by_band[band]
        bar = '█' * (count // 2)
        print(f"   {band:5} {bar} {count}")
    
    print(f"\n## Rare DX Spotted\n")
    if rare_dx:
        for spot in rare_dx[:10]:
            print(f"   🌍 {spot['dx_station']:12} {spot['band']:5} {spot['frequency']:8.1f} - {spot['comment']}")
    else:
        print("   No rare DX in recent spots")
    
    print(f"\n## Active Expeditions\n")
    print("   (Check: https://www.ng3k.com/misc/adxo.html for current expeditions)")
    
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Ham Radio DX Cluster Monitor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  dx-monitor.py watch                    # Watch for spots
  dx-monitor.py watch --new-only         # Only show new spots
  dx-monitor.py watch --cluster ea7jxh   # Specific cluster
  dx-monitor.py digest                   # Daily digest
  
  dx-monitor.py watch --callsign KN4XYZ  # Use your callsign
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', required=True)
    
    # Watch command
    watch = subparsers.add_parser('watch', help='Watch for DX spots')
    watch.add_argument('--cluster', '-c', help='Cluster node (ea7jxh, om0rx, oh2aq, ab5k, w6rk)')
    watch.add_argument('--callsign', help='Your callsign')
    watch.add_argument('--limit', type=int, default=20, help='Number of spots')
    watch.add_argument('--new-only', '-n', action='store_true', help='Only show new spots')
    watch.add_argument('--json', action='store_true', help='JSON output')
    watch.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    # Digest command
    digest = subparsers.add_parser('digest', help='Generate daily digest')
    digest.add_argument('--cluster', '-c', help='Cluster node')
    digest.add_argument('--callsign', help='Your callsign')
    
    args = parser.parse_args()
    
    commands = {
        'watch': cmd_watch,
        'digest': cmd_digest,
    }
    
    commands[args.command](args)


if __name__ == '__main__':
    main()
