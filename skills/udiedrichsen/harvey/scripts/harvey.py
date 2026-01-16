#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///

"""
Harvey State Manager - Track conversation sessions with the invisible rabbit.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# State file location
STATE_DIR = Path(__file__).parent.parent / "state"
STATE_FILE = STATE_DIR / "harvey_session.json"

# Default session timeout (2 hours)
SESSION_TIMEOUT_HOURS = 2

MODES = {
    "bored": {
        "name": "Langeweile-Modus",
        "emoji": "🎭",
        "response_delay": 0,
        "message_length": "medium",
        "depth": "medium"
    },
    "restaurant": {
        "name": "Restaurant-Modus", 
        "emoji": "🍽️",
        "response_delay": 45,  # seconds
        "message_length": "short",
        "depth": "light"
    },
    "waiting": {
        "name": "Warte-Modus",
        "emoji": "⏳",
        "response_delay": 0,
        "message_length": "short", 
        "depth": "light"
    },
    "walk": {
        "name": "Begleiter-Modus",
        "emoji": "🚶",
        "response_delay": 0,
        "message_length": "long",
        "depth": "deep"
    }
}


def load_state() -> dict:
    """Load current Harvey session state."""
    if not STATE_FILE.exists():
        return {"active": False}
    
    try:
        with open(STATE_FILE) as f:
            state = json.load(f)
            
        # Check if session has timed out
        if state.get("active") and state.get("last_activity"):
            last_activity = datetime.fromisoformat(state["last_activity"])
            now = datetime.now(timezone.utc)
            hours_inactive = (now - last_activity).total_seconds() / 3600
            
            if hours_inactive > SESSION_TIMEOUT_HOURS:
                state["active"] = False
                state["timeout"] = True
                save_state(state)
                
        return state
    except (json.JSONDecodeError, KeyError):
        return {"active": False}


def save_state(state: dict) -> None:
    """Save Harvey session state."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)


def start_session(mode: str = "bored") -> dict:
    """Start a new Harvey session."""
    if mode not in MODES:
        mode = "bored"
    
    now = datetime.now(timezone.utc).isoformat()
    state = {
        "active": True,
        "mode": mode,
        "mode_info": MODES[mode],
        "started_at": now,
        "last_activity": now,
        "topics_discussed": [],
        "user_mentions": {},
        "message_count": 0
    }
    save_state(state)
    return state


def end_session(reason: str = "user_ended") -> dict:
    """End the current Harvey session."""
    state = load_state()
    state["active"] = False
    state["ended_at"] = datetime.now(timezone.utc).isoformat()
    state["end_reason"] = reason
    save_state(state)
    return state


def update_session(topic: str = None, mention_key: str = None, mention_value: str = None) -> dict:
    """Update session with new activity."""
    state = load_state()
    
    if not state.get("active"):
        return state
    
    state["last_activity"] = datetime.now(timezone.utc).isoformat()
    state["message_count"] = state.get("message_count", 0) + 1
    
    if topic and topic not in state.get("topics_discussed", []):
        state.setdefault("topics_discussed", []).append(topic)
    
    if mention_key and mention_value:
        state.setdefault("user_mentions", {})[mention_key] = mention_value
    
    # Track if it's time to offer a game (every 7+ messages if no game offered yet)
    msg_count = state.get("message_count", 0)
    game_offered = state.get("game_offered", False)
    if msg_count >= 7 and not game_offered:
        state["suggest_game"] = True
    
    save_state(state)
    return state


def mark_game_offered() -> dict:
    """Mark that a game has been offered in this session."""
    state = load_state()
    if state.get("active"):
        state["game_offered"] = True
        state["suggest_game"] = False
        save_state(state)
    return state


def should_suggest_game() -> bool:
    """Check if Harvey should suggest a game."""
    state = load_state()
    return state.get("suggest_game", False)


# ============================================================================
# Game & Score Tracking
# ============================================================================

DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

def start_game(game_type: str, difficulty: str = "medium") -> dict:
    """Start a new game within the Harvey session."""
    state = load_state()
    
    if not state.get("active"):
        return {"error": "No active Harvey session"}
    
    if difficulty not in DIFFICULTY_LEVELS:
        difficulty = "medium"
    
    state["current_game"] = {
        "type": game_type,
        "difficulty": difficulty,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "questions_asked": 0,
        "correct_answers": 0,
        "hints_used": 0
    }
    state["game_offered"] = True
    state["suggest_game"] = False
    
    save_state(state)
    return state["current_game"]


def update_game_score(correct: bool, hint_used: bool = False) -> dict:
    """Update the current game score."""
    state = load_state()
    
    if not state.get("active") or not state.get("current_game"):
        return {"error": "No active game"}
    
    game = state["current_game"]
    game["questions_asked"] = game.get("questions_asked", 0) + 1
    
    if correct:
        game["correct_answers"] = game.get("correct_answers", 0) + 1
    
    if hint_used:
        game["hints_used"] = game.get("hints_used", 0) + 1
    
    save_state(state)
    return game


def end_game() -> dict:
    """End the current game and return final score."""
    state = load_state()
    
    if not state.get("active") or not state.get("current_game"):
        return {"error": "No active game"}
    
    game = state["current_game"]
    game["ended_at"] = datetime.now(timezone.utc).isoformat()
    
    # Calculate score
    questions = game.get("questions_asked", 0)
    correct = game.get("correct_answers", 0)
    hints = game.get("hints_used", 0)
    
    if questions > 0:
        base_score = (correct / questions) * 100
        hint_penalty = hints * 5
        game["final_score"] = max(0, base_score - hint_penalty)
        game["accuracy"] = f"{correct}/{questions}"
    else:
        game["final_score"] = 0
        game["accuracy"] = "0/0"
    
    # Save to game history
    if "game_history" not in state:
        state["game_history"] = []
    state["game_history"].append(game)
    
    # Keep only last 10 games
    state["game_history"] = state["game_history"][-10:]
    
    # Clear current game
    state["current_game"] = None
    
    save_state(state)
    return game


def get_game_stats() -> dict:
    """Get overall game statistics."""
    state = load_state()
    
    history = state.get("game_history", [])
    
    if not history:
        return {
            "games_played": 0,
            "message": "Noch keine Spiele gespielt! 🎮"
        }
    
    total_games = len(history)
    total_correct = sum(g.get("correct_answers", 0) for g in history)
    total_questions = sum(g.get("questions_asked", 0) for g in history)
    avg_score = sum(g.get("final_score", 0) for g in history) / total_games
    
    # Find favorite game type
    game_types = {}
    for g in history:
        gt = g.get("type", "unknown")
        game_types[gt] = game_types.get(gt, 0) + 1
    favorite = max(game_types, key=game_types.get) if game_types else "none"
    
    return {
        "games_played": total_games,
        "total_correct": total_correct,
        "total_questions": total_questions,
        "average_score": round(avg_score, 1),
        "favorite_game": favorite,
        "message": f"🎮 {total_games} Spiele | ⭐ {avg_score:.0f}% avg | 🏆 Favorit: {favorite}"
    }


def adjust_difficulty(direction: str = "auto") -> str:
    """Adjust game difficulty based on performance or manual input."""
    state = load_state()
    
    current = state.get("difficulty", "medium")
    current_idx = DIFFICULTY_LEVELS.index(current) if current in DIFFICULTY_LEVELS else 1
    
    if direction == "up" and current_idx < 2:
        new_difficulty = DIFFICULTY_LEVELS[current_idx + 1]
    elif direction == "down" and current_idx > 0:
        new_difficulty = DIFFICULTY_LEVELS[current_idx - 1]
    elif direction == "auto":
        # Auto-adjust based on recent performance
        history = state.get("game_history", [])[-5:]  # Last 5 games
        if len(history) >= 3:
            avg_score = sum(g.get("final_score", 0) for g in history) / len(history)
            if avg_score > 80 and current_idx < 2:
                new_difficulty = DIFFICULTY_LEVELS[current_idx + 1]
            elif avg_score < 40 and current_idx > 0:
                new_difficulty = DIFFICULTY_LEVELS[current_idx - 1]
            else:
                new_difficulty = current
        else:
            new_difficulty = current
    else:
        new_difficulty = current
    
    state["difficulty"] = new_difficulty
    save_state(state)
    return new_difficulty


def change_mode(mode: str) -> dict:
    """Change the current session mode."""
    state = load_state()
    
    if not state.get("active"):
        return start_session(mode)
    
    if mode in MODES:
        state["mode"] = mode
        state["mode_info"] = MODES[mode]
        state["last_activity"] = datetime.now(timezone.utc).isoformat()
        save_state(state)
    
    return state


def get_status() -> dict:
    """Get current Harvey status."""
    state = load_state()
    
    if not state.get("active"):
        return {
            "active": False,
            "message": "Harvey schläft gerade. Sag 'Hey Harvey' um ihn zu wecken! 🐰💤"
        }
    
    mode_info = MODES.get(state.get("mode", "bored"), MODES["bored"])
    duration_min = 0
    
    if state.get("started_at"):
        started = datetime.fromisoformat(state["started_at"])
        now = datetime.now(timezone.utc)
        duration_min = int((now - started).total_seconds() / 60)
    
    return {
        "active": True,
        "mode": state.get("mode"),
        "mode_name": mode_info["name"],
        "mode_emoji": mode_info["emoji"],
        "duration_minutes": duration_min,
        "message_count": state.get("message_count", 0),
        "topics": state.get("topics_discussed", []),
        "message": f"Harvey ist wach {mode_info['emoji']} | {mode_info['name']} | {duration_min} Min | {state.get('message_count', 0)} Nachrichten"
    }


def main():
    parser = argparse.ArgumentParser(description="Harvey Session Manager")
    parser.add_argument("action", choices=[
        "start", "end", "status", "update", "mode",
        "game-start", "game-score", "game-end", "game-stats", "difficulty"
    ], help="Action to perform")
    parser.add_argument("--mode", "-m", choices=list(MODES.keys()), default="bored",
                        help="Session mode")
    parser.add_argument("--topic", "-t", help="Add a discussed topic")
    parser.add_argument("--mention-key", help="Key for user mention")
    parser.add_argument("--mention-value", help="Value for user mention")
    parser.add_argument("--reason", default="user_ended", help="Reason for ending session")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    # Game arguments
    parser.add_argument("--game-type", "-g", help="Type of game (trivia, riddle, what_if, etc.)")
    parser.add_argument("--difficulty", "-d", choices=DIFFICULTY_LEVELS, default="medium")
    parser.add_argument("--correct", action="store_true", help="Mark answer as correct")
    parser.add_argument("--hint", action="store_true", help="Mark that hint was used")
    parser.add_argument("--direction", choices=["up", "down", "auto"], default="auto",
                        help="Difficulty adjustment direction")
    
    args = parser.parse_args()
    
    if args.action == "start":
        result = start_session(args.mode)
        msg = f"🐰 Harvey ist wach! Modus: {MODES[args.mode]['name']} {MODES[args.mode]['emoji']}"
    elif args.action == "end":
        result = end_session(args.reason)
        msg = "🐰💤 Harvey schläft jetzt. Bis später!"
    elif args.action == "status":
        result = get_status()
        msg = result.get("message", "")
    elif args.action == "update":
        result = update_session(args.topic, args.mention_key, args.mention_value)
        msg = "Session aktualisiert"
    elif args.action == "mode":
        result = change_mode(args.mode)
        msg = f"Modus gewechselt zu: {MODES[args.mode]['name']} {MODES[args.mode]['emoji']}"
    # Game actions
    elif args.action == "game-start":
        game_type = args.game_type or "trivia"
        result = start_game(game_type, args.difficulty)
        msg = f"🎮 Spiel gestartet: {game_type} ({args.difficulty})"
    elif args.action == "game-score":
        result = update_game_score(args.correct, args.hint)
        correct = result.get("correct_answers", 0)
        total = result.get("questions_asked", 0)
        msg = f"📊 Score: {correct}/{total}"
    elif args.action == "game-end":
        result = end_game()
        if "error" not in result:
            msg = f"🏁 Spiel beendet! Score: {result.get('final_score', 0):.0f}% ({result.get('accuracy', '?')})"
        else:
            msg = result["error"]
    elif args.action == "game-stats":
        result = get_game_stats()
        msg = result.get("message", "")
    elif args.action == "difficulty":
        result = adjust_difficulty(args.direction)
        msg = f"🎚️ Schwierigkeit: {result}"
    else:
        result = {"error": "Unknown action"}
        msg = "Unbekannte Aktion"
    
    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(msg)
        if args.action == "status" and result.get("active"):
            print(f"  Topics: {', '.join(result.get('topics', [])) or 'noch keine'}")


if __name__ == "__main__":
    main()
