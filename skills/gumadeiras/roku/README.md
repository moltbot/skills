# roku-cli

A pure Bash CLI to control your Roku from the terminal. Built on [python-roku](https://github.com/jcarbaugh/python-roku).

## Features

- 🔍 **Discover** Roku devices on your network
- 🎮 **Control** playback and navigation
- ⌨️ **Text entry** for search fields
- 📱 **Launch** apps by name or ID
- 📊 **Status** monitoring (active app, device info)

## Requirements

- Python 3.7+
- `pip3 install roku`
- Bash 4+

## Installation

```bash
# Install the python-roku library
pip3 install roku

# Download and link the CLI
git clone https://github.com/gumadeiras/roku-cli.git
cd roku-cli
chmod +x roku-cli
ln -sf $(pwd)/roku-cli ~/.local/bin/roku
```

Or install via [ClawdHub](https://clawdhub.com):

```bash
clawdhub install roku
```

## Quick Start

Find your Roku:
```bash
roku discover
```

Control it:
```bash
roku press home        # Go to home screen
roku press select      # OK button
roku press right
roku press play
roku press back
```

Enter text (e.g., in search):
```bash
roku text "netflix"
```

Launch apps:
```bash
roku apps              # List all apps
roku launch Netflix    # By name
roku launch 12         # By app ID
```

Check status:
```bash
roku active            # Current app
roku info              # Device info
```

## Usage

```
Usage: roku [OPTIONS] COMMAND [ARGS]

Options:
  --ip IP       Roku IP address (or set ROKU_IP env var)
  --help        Show this help

Commands:
  discover      Find Roku devices on network
  press BUTTON  Send button press
  text STRING   Enter text
  apps          List installed apps
  launch APP    Launch app (name or ID)
  active        Show active app
  info          Show device info
```

## Buttons

`home`, `back`, `left`, `right`, `up`, `down`, `select`, `enter`, `info`, `play`, `forward`, `reverse`, `replay`, `search`, `backspace`, `channel_up`, `channel_down`

## Environment

Set `ROKU_IP` to avoid specifying `--ip` each time:

```bash
export ROKU_IP="192.168.1.100"
```

## Roku Settings

For external control to work, enable on your Roku:

**Settings → System → Advanced System Settings → Control by Mobile Apps → Enable**

## License

MIT

---

Built with ❤️ using [python-roku](https://github.com/jcarbaugh/python-roku)
