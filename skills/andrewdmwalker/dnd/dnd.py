#!/usr/bin/env python3
"""
D&D 5e Toolkit - Character gen, spells, monsters, dice, and DM tools
Uses the D&D 5e API: https://www.dnd5eapi.co/
"""

import argparse
import json
import random
import sys
import urllib.request
import urllib.error
from typing import List, Dict, Optional

API_BASE = "https://www.dnd5eapi.co/api"


def api_get(endpoint: str) -> Dict:
    """Make GET request to D&D 5e API."""
    url = f"{API_BASE}{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"API Error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)


def roll_dice(dice_str: str) -> Dict:
    """Roll dice in XdY+Z format. Returns {rolls, total, modifier}"""
    # Parse XdY+Z or XdY-Z or XdY
    import re
    match = re.match(r'(\d+)d(\d+)([+-]\d+)?', dice_str.lower())
    if not match:
        print(f"Invalid dice format: {dice_str}. Use format like '2d6', '1d20+5', '3d8-2'", file=sys.stderr)
        sys.exit(1)
    
    num_dice = int(match.group(1))
    die_size = int(match.group(2))
    modifier = int(match.group(3) or 0)
    
    rolls = [random.randint(1, die_size) for _ in range(num_dice)]
    total = sum(rolls) + modifier
    
    return {
        'dice': dice_str,
        'rolls': rolls,
        'modifier': modifier,
        'total': total
    }


def cmd_roll(args):
    """Roll dice."""
    result = roll_dice(args.dice)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        rolls_str = ' + '.join(map(str, result['rolls']))
        mod_str = f" {result['modifier']:+d}" if result['modifier'] != 0 else ""
        print(f"🎲 Rolling {result['dice']}")
        print(f"   Rolls: [{rolls_str}]{mod_str}")
        print(f"   Total: {result['total']}")


def cmd_spell(args):
    """Look up a spell."""
    # Get spell list if searching
    if args.search:
        data = api_get("/spells")
        spells = [s for s in data['results'] if args.search.lower() in s['name'].lower()]
        if not spells:
            print(f"No spells found matching: {args.search}", file=sys.stderr)
            sys.exit(1)
        if len(spells) > 1 and not args.list:
            print(f"Multiple spells found. Use --list or be more specific:")
            for spell in spells[:10]:
                print(f"  - {spell['name']}")
            sys.exit(0)
        spell_index = spells[0]['index']
    elif args.list:
        data = api_get("/spells")
        for spell in data['results']:
            print(spell['name'])
        return
    else:
        # Direct lookup by index (lowercase, hyphens)
        spell_index = args.name.lower().replace(' ', '-')
    
    # Get spell details
    spell = api_get(f"/spells/{spell_index}")
    
    if args.json:
        print(json.dumps(spell, indent=2))
    else:
        print(f"✨ {spell['name']}")
        print(f"   Level: {spell['level']} {spell['school']['name']}")
        print(f"   Casting Time: {spell['casting_time']}")
        print(f"   Range: {spell['range']}")
        print(f"   Components: {', '.join(spell.get('components', []))}")
        print(f"   Duration: {spell['duration']}")
        if spell.get('concentration'):
            print(f"   Concentration: Yes")
        if spell.get('ritual'):
            print(f"   Ritual: Yes")
        print(f"\n   {' '.join(spell['desc'])}")
        if spell.get('higher_level'):
            print(f"\n   At Higher Levels: {' '.join(spell['higher_level'])}")


def cmd_monster(args):
    """Look up a monster."""
    if args.list:
        data = api_get("/monsters")
        for monster in data['results']:
            print(monster['name'])
        return
    
    if args.search:
        data = api_get("/monsters")
        monsters = [m for m in data['results'] if args.search.lower() in m['name'].lower()]
        if not monsters:
            print(f"No monsters found matching: {args.search}", file=sys.stderr)
            sys.exit(1)
        if len(monsters) > 1:
            print(f"Multiple monsters found. Be more specific:")
            for monster in monsters[:10]:
                print(f"  - {monster['name']}")
            sys.exit(0)
        monster_index = monsters[0]['index']
    else:
        monster_index = args.name.lower().replace(' ', '-')
    
    # Get monster details
    monster = api_get(f"/monsters/{monster_index}")
    
    if args.json:
        print(json.dumps(monster, indent=2))
    else:
        print(f"👹 {monster['name']}")
        print(f"   {monster['size']} {monster['type']}, {monster['alignment']}")
        print(f"   CR {monster['challenge_rating']} ({monster['xp']} XP)")
        print(f"\n   AC: {monster['armor_class'][0]['value']}")
        print(f"   HP: {monster['hit_points']} ({monster['hit_dice']})")
        print(f"   Speed: {', '.join(f'{k} {v}' for k, v in monster['speed'].items())}")
        print(f"\n   STR {monster['strength']} | DEX {monster['dexterity']} | CON {monster['constitution']}")
        print(f"   INT {monster['intelligence']} | WIS {monster['wisdom']} | CHA {monster['charisma']}")
        
        if monster.get('special_abilities'):
            print(f"\n   Special Abilities:")
            for ability in monster['special_abilities'][:3]:
                print(f"   • {ability['name']}: {ability['desc']}")
        
        if monster.get('actions'):
            print(f"\n   Actions:")
            for action in monster['actions'][:3]:
                print(f"   • {action['name']}: {action['desc']}")


def cmd_character(args):
    """Generate random character."""
    # Get races and classes
    races = api_get("/races")['results']
    classes = api_get("/classes")['results']
    
    race = random.choice(races)
    char_class = random.choice(classes)
    
    # Roll stats
    stats = {
        'STR': sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
        'DEX': sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
        'CON': sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
        'INT': sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
        'WIS': sum(sorted([random.randint(1, 6) for _ in range(4)])[1:]),
        'CHA': sum(sorted([random.randint(1, 6) for _ in range(4)])[1:])
    }
    
    # Random name
    first_names = ['Aldric', 'Brynn', 'Cedric', 'Elara', 'Finn', 'Gwen', 'Hilda', 'Ivan', 'Jora', 'Kael', 'Luna', 'Magnus']
    name = random.choice(first_names)
    
    if args.json:
        print(json.dumps({
            'name': name,
            'race': race['name'],
            'class': char_class['name'],
            'stats': stats
        }, indent=2))
    else:
        print(f"⚔️  {name}")
        print(f"   Race: {race['name']}")
        print(f"   Class: {char_class['name']}")
        print(f"\n   Stats:")
        for stat, value in stats.items():
            modifier = (value - 10) // 2
            print(f"   {stat}: {value} ({modifier:+d})")


def cmd_encounter(args):
    """Generate random encounter."""
    cr = args.cr or random.choice([0.5, 1, 2, 3, 5])
    
    # Get monsters
    data = api_get("/monsters")
    all_monsters = data['results']
    
    # Filter by CR (approximately)
    suitable = []
    for m in all_monsters:
        monster = api_get(f"/monsters/{m['index']}")
        if abs(monster['challenge_rating'] - cr) <= 2:
            suitable.append(monster)
    
    if not suitable:
        print(f"No monsters found near CR {cr}", file=sys.stderr)
        sys.exit(1)
    
    # Pick 1-3 monsters
    num_monsters = random.randint(1, 3)
    encounter = random.sample(suitable, min(num_monsters, len(suitable)))
    
    print(f"🎲 Random Encounter (CR ~{cr})\n")
    for monster in encounter:
        count = random.randint(1, 4) if monster['challenge_rating'] < 1 else random.randint(1, 2)
        print(f"   {count}x {monster['name']} (CR {monster['challenge_rating']})")
        print(f"      AC {monster['armor_class'][0]['value']}, HP {monster['hit_points']}")


def cmd_npc(args):
    """Generate random NPC."""
    first_names = ['Aldric', 'Brynn', 'Cedric', 'Elara', 'Finn', 'Gwendolyn', 'Hilda', 'Ivan', 'Jora', 'Kael']
    last_names = ['Blackwood', 'Stormwind', 'Ironforge', 'Moonwhisper', 'Shadowend', 'Brightblade', 'Darkwater']
    
    races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Orc', 'Tiefling', 'Dragonborn']
    occupations = ['Blacksmith', 'Tavern Keeper', 'Merchant', 'Guard', 'Wizard', 'Cleric', 'Farmer', 'Noble', 'Thief', 'Bard']
    traits = ['friendly', 'suspicious', 'greedy', 'helpful', 'fearful', 'arrogant', 'curious', 'wise', 'grumpy', 'cheerful']
    
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    race = random.choice(races)
    occupation = random.choice(occupations)
    trait = random.choice(traits)
    
    print(f"👤 {name}")
    print(f"   Race: {race}")
    print(f"   Occupation: {occupation}")
    print(f"   Trait: {trait.capitalize()}")


def main():
    parser = argparse.ArgumentParser(
        description="D&D 5e Toolkit - Characters, spells, monsters, dice, and more",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  dnd.py roll 2d6+3
  dnd.py roll 1d20
  dnd.py spell --search fireball
  dnd.py monster --search dragon
  dnd.py character
  dnd.py encounter --cr 5
  dnd.py npc
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', required=True)
    
    # Roll dice
    roll = subparsers.add_parser('roll', help='Roll dice (XdY+Z format)')
    roll.add_argument('dice', help='Dice to roll (e.g., 2d6, 1d20+5, 3d8-2)')
    roll.add_argument('--json', action='store_true', help='JSON output')
    
    # Spell lookup
    spell = subparsers.add_parser('spell', help='Look up a spell')
    spell.add_argument('name', nargs='?', help='Spell name')
    spell.add_argument('--search', '-s', help='Search for spell')
    spell.add_argument('--list', '-l', action='store_true', help='List all spells')
    spell.add_argument('--json', action='store_true', help='JSON output')
    
    # Monster lookup
    monster = subparsers.add_parser('monster', help='Look up a monster')
    monster.add_argument('name', nargs='?', help='Monster name')
    monster.add_argument('--search', '-s', help='Search for monster')
    monster.add_argument('--list', '-l', action='store_true', help='List all monsters')
    monster.add_argument('--json', action='store_true', help='JSON output')
    
    # Character generator
    char = subparsers.add_parser('character', help='Generate random character')
    char.add_argument('--json', action='store_true', help='JSON output')
    
    # Encounter generator
    encounter = subparsers.add_parser('encounter', help='Generate random encounter')
    encounter.add_argument('--cr', type=float, help='Challenge rating')
    
    # NPC generator
    npc = subparsers.add_parser('npc', help='Generate random NPC')
    
    args = parser.parse_args()
    
    commands = {
        'roll': cmd_roll,
        'spell': cmd_spell,
        'monster': cmd_monster,
        'character': cmd_character,
        'encounter': cmd_encounter,
        'npc': cmd_npc,
    }
    
    commands[args.command](args)


if __name__ == '__main__':
    main()
