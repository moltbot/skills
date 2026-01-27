---
name: ham-radio-dx
description: Monitor DX clusters for rare station spots, track active DX expeditions, and get daily band activity digests for amateur radio operators.
version: 1.0.0
author: captmarbles
---

# Ham Radio DX Monitor 📻

Monitor DX clusters in real-time, get notified of rare DX stations, and track active DX expeditions. Perfect for ham radio operators who want to catch rare contacts!

## Features

📡 **Live DX Spots** - Connect to global DX cluster network  
🌍 **Rare DX Alerts** - Notify when rare stations appear  
📊 **Daily Digest** - Band activity summary  
🗺️ **DX Expeditions** - Track active expeditions  
⏰ **Automated Monitoring** - Run via cron for alerts  

## Quick Start

### Watch Live Spots

```bash
# Get latest DX spots
python3 dx-monitor.py watch

# Specific cluster node
python3 dx-monitor.py watch --cluster ea7jxh

# Use your callsign
python3 dx-monitor.py watch --callsign KN4XYZ

# Only show NEW spots (filters duplicates)
python3 dx-monitor.py watch --new-only
```

**Output:**
```
📡 Latest DX Spots from EA7JXH

   20m   SSB      14.195   K1ABC        - CQ Contest
   40m   CW        7.015   VP8/G3XYZ    - Falklands
   15m   FT8      21.074   ZL2ABC       - New Zealand
```

### Daily Digest

```bash
python3 dx-monitor.py digest
```

**Output:**
```
# 📡 DX Digest - 2026-01-27

## Band Activity (last 100 spots)

   20m   ████████████ 24
   40m   ████████ 16
   15m   ██████ 12
   10m   ████ 8

## Rare DX Spotted

   🌍 VP8/G3XYZ    40m      7.015 - Falklands Expedition
   🌍 ZL2ABC       15m     21.074 - New Zealand
```

## DX Cluster Nodes

Available clusters:
- **ea7jxh** - dx.ea7jxh.eu:7373 (Europe)
- **om0rx** - cluster.om0rx.com:7300 (Europe)
- **oh2aq** - oh2aq.kolumbus.fi:7373 (Finland)
- **ab5k** - ab5k.net:7373 (USA)
- **w6rk** - telnet.w6rk.com:7373 (USA West Coast)

## Automated Monitoring

### Real-Time Alerts (Check Every 5 Minutes)

```bash
# Add to crontab
*/5 * * * * cd ~/clawd && python3 skills/ham-radio-dx/dx-monitor.py watch --new-only --callsign YOUR_CALL >> /tmp/dx-alerts.log
```

This checks for new DX spots every 5 minutes and logs them.

### Daily Digest (9am Every Day)

```bash
# Add to crontab
0 9 * * * cd ~/clawd && python3 skills/ham-radio-dx/dx-monitor.py digest >> ~/dx-digest-$(date +\%Y-\%m-\%d).txt
```

### Telegram Notifications

Integrate with Clawdbot message tool:

```bash
# When rare DX appears, send Telegram alert
python3 dx-monitor.py watch --new-only | grep -E "(VP8|ZL|VK|ZS|P5)" && \
  echo "🚨 Rare DX spotted!" | # Send via Clawdbot message tool
```

## Example Prompts for Clawdbot

- *"Check the DX cluster for new spots"*
- *"What's active on 20 meters?"*
- *"Show me today's DX digest"*
- *"Any rare DX on the air?"*
- *"Monitor for VP8 or ZL prefixes"*

## Rare DX Prefixes to Watch

**Most Wanted:**
- **VP8** - Falkland Islands
- **VK0** - Heard Island
- **3Y0** - Bouvet Island
- **FT5** - Amsterdam & St. Paul Islands
- **P5** - North Korea
- **BS7** - Scarborough Reef

**Other Rare:**
- **ZL** - New Zealand
- **VK** - Australia
- **ZS** - South Africa
- **9G** - Ghana
- **S9** - São Tomé and Príncipe

## DX Expedition Resources

Track active expeditions:
- **NG3K Calendar:** https://www.ng3k.com/misc/adxo.html
- **DX News:** https://www.dx-world.net/
- **425 DX News:** http://www.425dxn.org/

## Band Plans

Common DX frequencies:
- **160m:** 1.830-1.840 (CW), 1.840-1.850 (Digital)
- **80m:** 3.500-3.600 (CW), 3.790-3.800 (Digital)
- **40m:** 7.000-7.040 (CW), 7.070-7.080 (Digital)
- **30m:** 10.100-10.140 (CW/Digital only)
- **20m:** 14.000-14.070 (CW), 14.070-14.100 (Digital)
- **17m:** 18.068-18.100 (CW), 18.100-18.110 (Digital)
- **15m:** 21.000-21.070 (CW), 21.070-21.120 (Digital)
- **12m:** 24.890-24.920 (CW), 24.920-24.930 (Digital)
- **10m:** 28.000-28.070 (CW), 28.070-28.120 (Digital)

## Tips

1. **Use Your Callsign** - Some clusters require valid callsigns
2. **Check Multiple Clusters** - Coverage varies by region
3. **Filter by Band** - Focus on bands you can work
4. **Track Rare Prefixes** - Set up alerts for most-wanted
5. **Morning Check** - Best DX often in early morning

## Technical Details

- **Protocol:** Telnet to DX cluster nodes
- **Format:** Standard PacketCluster/AR-Cluster format
- **State Tracking:** `/tmp/dx-monitor-state.json`
- **Dependencies:** Python 3.6+ (stdlib only)

## Future Ideas

- Band-specific filtering
- DXCC entity tracking
- Propagation prediction integration
- Log integration (check if you need that one)
- Contest mode (filter contest stations)
- FT8/FT4 integration via PSKReporter

73 and good DX! 📻🌍
