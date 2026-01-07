---
name: printer
description: Manage printers via CUPS on macOS (discover, add, print, queue, status, wake).
metadata: {"clawdbot":{"emoji":"🖨️","os":["darwin"],"requires":{"bins":["lp","lpstat","lpadmin"]}}}
---

# Printer (CUPS)

Control printers on macOS using built-in CUPS commands. No external CLI needed.

## Discover printers

```bash
# Network printers (Bonjour/AirPrint)
dns-sd -B _ipp._tcp . 2>/dev/null & sleep 3; kill $! 2>/dev/null

# Get printer details (host, port, resource path)
dns-sd -L "Printer Name" _ipp._tcp . 2>/dev/null & sleep 3; kill $! 2>/dev/null

# CUPS-native discovery
lpstat -e                         # available network destinations
lpinfo --include-schemes dnssd -v # dnssd backends

# IPP discovery
ippfind --timeout 5
```

## Add a printer (driverless IPP Everywhere)

```bash
# Recommended: driverless queue
lpadmin -p MyPrinter -E -v "ipp://printer.local:631/ipp/print" -m everywhere

# Set as default
lpadmin -d MyPrinter

# Enable SNMP supply reporting (toner levels)
sudo lpadmin -p MyPrinter -o cupsSNMPSupplies=true
```

## Print files

```bash
lp filename.pdf                      # to default printer
lp -d MyPrinter filename.pdf         # specific printer
lp -d MyPrinter -n 2 file.pdf        # 2 copies
lp -d MyPrinter -o sides=two-sided-long-edge file.pdf  # duplex
lp -d MyPrinter -o media=letter file.pdf
lp -d MyPrinter -o ColorModel=Gray file.pdf  # grayscale

# Print text directly
echo "Hello World" | lp -d MyPrinter
```

## Queue management

```bash
# Check status
lpstat -p MyPrinter        # printer status
lpstat -o MyPrinter        # queued jobs
lpstat -t                  # everything
lpq -P MyPrinter           # BSD-style queue view

# Cancel jobs
cancel JOB_ID
cancel -a MyPrinter        # cancel all

# Enable/disable
cupsenable MyPrinter       # resume printing
cupsdisable MyPrinter      # pause printer
cupsaccept MyPrinter       # accept new jobs
cupsreject MyPrinter       # reject new jobs
```

## Printer options

```bash
# List available options for a printer
lpoptions -p MyPrinter -l

# Set default options (per-user)
lpoptions -p MyPrinter -o sides=two-sided-long-edge

# Set server-side defaults
sudo lpadmin -p MyPrinter -o sides-default=two-sided-long-edge
```

## Status and diagnostics

```bash
# IPP status query (detailed)
ipptool -t ipp://PRINTER_IP/ipp/print get-printer-attributes.test

# Filter for key info
ipptool -t ipp://PRINTER_IP/ipp/print get-printer-attributes.test \
  | grep -iE 'printer-state|marker|supply|media|error'
```

## Wake printer from sleep

```bash
# IPP poke (usually wakes the printer)
ipptool -q -T 5 ipp://PRINTER_IP/ipp/print get-printer-attributes.test

# HTTP poke (wakes web UI stack)
curl -s -m 5 http://PRINTER_IP/ >/dev/null

# TCP connect test
nc -zw2 PRINTER_IP 631
```

## Keep-alive (prevent deep sleep)

```bash
# Poll every 5 minutes (runs in foreground)
ipptool -q -T 3 -i 300 ipp://PRINTER_IP/ipp/print get-printer-attributes.test
```

For persistent keep-alive, create a launchd agent.

## Toner levels via SNMP

Requires `brew install net-snmp`:

```bash
snmpwalk -v2c -c public PRINTER_IP 1.3.6.1.2.1.43.11.1.1
```

Note: SNMP may be disabled on the printer. Check Remote UI settings.

## Remote UI (web interface)

Most network printers expose a web UI at `http://PRINTER_IP/` for:
- Sleep/timer settings (Settings > Timer Settings > Auto Sleep Time)
- Network protocol config (enable/disable IPP, SNMP, raw 9100)
- Consumables status

## Troubleshooting

```bash
# Printer stuck/disabled? Re-enable it
cupsenable MyPrinter

# Check device URI
lpstat -v MyPrinter

# Remove and re-add printer
lpadmin -x MyPrinter
lpadmin -p MyPrinter -E -v "ipp://..." -m everywhere

# CUPS error log
tail -f /var/log/cups/error_log
```

## Notes

- Prefer `ipp://` or `ipps://` URIs over raw 9100 or LPD
- `-m everywhere` auto-configures from printer's IPP capabilities
- Option names vary by printer; use `lpoptions -l` to discover
- Sleep settings are best configured via printer's Remote UI
- Auto-sleep (1 min) keeps services alive - print jobs wake the printer automatically
- **If the printer is completely unresponsive** (IPP port closed, HTTP timeout), it's likely in deep sleep or powered off. Message the user to check/wake the printer physically.