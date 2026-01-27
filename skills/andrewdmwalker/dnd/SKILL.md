---
name: dnd
description: D&D 5e toolkit for players and DMs. Roll dice, look up spells and monsters, generate characters, create encounters, and spawn NPCs. Uses the official D&D 5e SRD API.
version: 1.0.0
author: captmarbles
---

# D&D 5e Toolkit

Your complete Dungeons & Dragons 5th Edition assistant! Look up spells, monsters, roll dice, generate characters, encounters, and NPCs.

## Features

🎲 **Dice Roller** - Roll any dice with modifiers  
✨ **Spell Lookup** - Search the entire SRD spell list  
👹 **Monster Stats** - Get full stat blocks for any creature  
⚔️ **Character Generator** - Random characters with stats  
🗡️ **Encounter Builder** - Generate balanced encounters by CR  
👤 **NPC Generator** - Create random NPCs with personality  

## Usage

All commands use the `dnd.py` script.

### Roll Dice

```bash
# Roll 2d6 with +3 modifier
python3 dnd.py roll 2d6+3

# Roll d20
python3 dnd.py roll 1d20

# Roll with negative modifier
python3 dnd.py roll 1d20-2

# Roll multiple dice
python3 dnd.py roll 8d6
```

**Output:**
```
🎲 Rolling 2d6+3
   Rolls: [4 + 5] +3
   Total: 12
```

### Look Up Spells

```bash
# Search for a spell
python3 dnd.py spell --search fireball

# Direct lookup
python3 dnd.py spell fire-bolt

# List all spells
python3 dnd.py spell --list
```

**Output:**
```
✨ Fireball
   Level: 3 Evocation
   Casting Time: 1 action
   Range: 150 feet
   Components: V, S, M
   Duration: Instantaneous
   
   A bright streak flashes from your pointing finger to a point 
   you choose within range and then blossoms with a low roar into 
   an explosion of flame...
```

### Look Up Monsters

```bash
# Search for a monster
python3 dnd.py monster --search dragon

# Direct lookup
python3 dnd.py monster ancient-red-dragon

# List all monsters
python3 dnd.py monster --list
```

**Output:**
```
👹 Adult Red Dragon
   Huge Dragon, chaotic evil
   CR 17 (18,000 XP)
   
   AC: 19
   HP: 256 (19d12+133)
   Speed: walk 40 ft., climb 40 ft., fly 80 ft.
   
   STR 27 | DEX 10 | CON 25
   INT 16 | WIS 13 | CHA 21
   
   Special Abilities:
   • Legendary Resistance (3/Day): If the dragon fails a saving throw...
   
   Actions:
   • Multiattack: The dragon can use its Frightful Presence...
```

### Generate Random Character

```bash
# Generate character with rolled stats
python3 dnd.py character
```

**Output:**
```
⚔️  Elara
   Race: Elf
   Class: Wizard
   
   Stats:
   STR: 10 (+0)
   DEX: 15 (+2)
   CON: 12 (+1)
   INT: 16 (+3)
   WIS: 13 (+1)
   CHA: 8 (-1)
```

### Generate Random Encounter

```bash
# Generate encounter with challenge rating
python3 dnd.py encounter --cr 5

# Random CR
python3 dnd.py encounter
```

**Output:**
```
🎲 Random Encounter (CR ~5)

   2x Troll (CR 5)
      AC 15, HP 84
   1x Ogre (CR 2)
      AC 11, HP 59
```

### Generate Random NPC

```bash
python3 dnd.py npc
```

**Output:**
```
👤 Finn Shadowend
   Race: Halfling
   Occupation: Merchant
   Trait: Curious
```

## Example Prompts for Clawdbot

- *"Roll 2d20 with advantage"* (I'll roll twice!)
- *"Look up the Fireball spell"*
- *"Show me stats for a Beholder"*
- *"Generate a random character"*
- *"Create an encounter for level 5 party"*
- *"Give me an NPC for my tavern scene"*

## JSON Output

Add `--json` to any command for structured output:

```bash
python3 dnd.py roll 2d6 --json
python3 dnd.py spell --search fireball --json
python3 dnd.py character --json
```

## API Source

Uses the official [D&D 5e API](https://www.dnd5eapi.co/) which includes all System Reference Document (SRD) content.

## Tips

- **Spell names** use lowercase with hyphens: `fireball`, `magic-missile`, `cure-wounds`
- **Monster names** same format: `ancient-red-dragon`, `goblin`, `beholder`
- **Search** if unsure of exact name: `--search dragon` will show all dragons
- **Dice format** is flexible: `1d20`, `2d6+5`, `3d8-2`, `100d100`

## Future Ideas

- Initiative tracker
- Treasure generator
- Quest/plot hook generator
- Random dungeon generator
- Party manager
- Campaign notes

Enjoy your adventure! 🐉⚔️✨
