---
name: solar-weather
description: Monitor solar weather conditions including geomagnetic storms, solar flares, aurora forecasts, and solar wind data. Uses NOAA Space Weather Prediction Center real-time data.
version: 1.0.0
author: captmarbles
---

# Solar Weather Monitor 🌞

Track space weather conditions in real-time! Monitor solar flares, geomagnetic storms, aurora forecasts, and solar wind data from NOAA's Space Weather Prediction Center.

## Features

🌞 **Current Conditions** - Real-time space weather status  
📅 **3-Day Forecast** - Predict upcoming solar activity  
🌌 **Aurora Forecast** - Will you see the Northern Lights?  
🌊 **Solar Wind** - Track solar wind magnetic field  
🚨 **Alerts** - Active space weather warnings  
📊 **Summary** - Quick comprehensive overview  

Perfect for:
- 📻 Ham radio operators
- 🌌 Aurora chasers & photographers
- 🛰️ Satellite operators
- ⚡ Power grid operators
- 🌍 Space weather enthusiasts

## Usage

### Current Space Weather

```bash
python3 solar-weather.py current
```

**Output:**
```
🌞 Space Weather Conditions
   2026-01-27 18:38:00 UTC

   📻 R0: none ✅
      Radio Blackouts (Solar Flares)

   ☢️  S0: none ✅
      Solar Radiation Storm

   🌍 G0: none ✅
      Geomagnetic Storm
```

### 3-Day Forecast

```bash
python3 solar-weather.py forecast
```

Shows today, tomorrow, and day after with probability percentages for solar events.

### Aurora Forecast

```bash
python3 solar-weather.py aurora
```

**Output:**
```
🌌 Aurora Forecast

Current Conditions:
   Geomagnetic: none
   Solar Wind Bz: -2 nT

Tomorrow (2026-01-28):
   Geomagnetic: minor

🔮 Aurora Outlook:
   ⚠️  MODERATE - Aurora possible at high latitudes
```

### Solar Wind Data

```bash
python3 solar-weather.py solarwind
```

**Output:**
```
🌊 Solar Wind Magnetic Field
   Time: 2026-01-27 18:36:00.000
   Bt: 8 nT (Total Magnitude)
   Bz: -2 nT (North/South Component)

   ✅ Slightly negative Bz
```

**Note:** Negative Bz (especially < -5 nT) is favorable for aurora activity!

### Active Alerts

```bash
python3 solar-weather.py alerts
```

Shows active space weather watches, warnings, and alerts from NOAA.

### Quick Summary

```bash
python3 solar-weather.py summary
```

Comprehensive overview of current conditions, solar wind, and tomorrow's forecast.

## Understanding Space Weather Scales

NOAA uses three scales to measure space weather severity:

### R Scale - Radio Blackouts (Solar Flares)
- **R0**: No impact
- **R1-R2**: Minor/Moderate - HF radio degradation
- **R3-R5**: Strong/Severe/Extreme - HF radio blackout

### S Scale - Solar Radiation Storms
- **S0**: No impact
- **S1-S2**: Minor/Moderate - Satellite anomalies possible
- **S3-S5**: Strong/Severe/Extreme - Satellite damage, astronaut radiation

### G Scale - Geomagnetic Storms (Aurora!)
- **G0**: No storm
- **G1-G2**: Minor/Moderate - Aurora at high latitudes
- **G3-G5**: Strong/Severe/Extreme - **Aurora visible at mid-latitudes!**

## Example Prompts for Clawdbot

- *"What are current space weather conditions?"*
- *"Is there an aurora forecast for tonight?"*
- *"Show me the solar wind data"*
- *"Any geomagnetic storm warnings?"*
- *"Give me a space weather summary"*
- *"Will I see aurora in [location]?"*

## JSON Output

Add `--json` to any command for structured data:

```bash
python3 solar-weather.py current --json
python3 solar-weather.py aurora --json
```

## Data Source

All data comes from **NOAA Space Weather Prediction Center (SWPC)**:
- Official US government space weather monitoring
- Real-time updates
- Free public API
- https://www.swpc.noaa.gov/

## Tips for Aurora Watchers 🌌

**Best conditions for aurora:**
1. **Geomagnetic Storm** (G1 or higher) ✅
2. **Negative Bz** (< -5 nT) ✅
3. **Clear, dark skies** 🌙
4. **High latitude** (or mid-latitude during major storms)

**When to watch:**
- Check `aurora` command daily
- Watch for G-scale warnings
- Monitor solar wind Bz component
- Peak activity often 1-2 hours after sunset

## Ham Radio Operators 📻

**HF propagation:**
- **R-scale events** disrupt HF radio
- **Solar flares** cause sudden ionospheric disturbances
- Check `current` before contests/DXing
- Monitor `alerts` for radio blackout warnings

## Future Ideas

- Location-based aurora visibility
- Push notifications for major events
- Historical storm data
- Solar flare predictions
- Satellite pass warnings during storms

Happy space weather watching! 🌞⚡🌌
