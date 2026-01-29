#!/usr/bin/env python3
"""
Decision Tree Calculator
Calculates expected value (EV) for decision tree analysis.
"""

import argparse
import json
import sys
from typing import List, Dict, Any


def calculate_ev(outcomes: List[Dict[str, Any]]) -> float:
    """Calculate expected value from list of outcomes."""
    return sum(outcome["probability"] * outcome["value"] for outcome in outcomes)


def validate_probabilities(outcomes: List[Dict[str, Any]]) -> bool:
    """Check if probabilities sum to 1.0 (with tolerance)."""
    total = sum(outcome["probability"] for outcome in outcomes)
    return abs(total - 1.0) < 0.001


def format_value(value: float) -> str:
    """Format monetary value with sign."""
    sign = "+" if value > 0 else ""
    return f"{sign}${value:,.2f}"


def print_tree(data: Dict[str, Any]) -> None:
    """Print formatted decision tree analysis."""
    print(f"\n📊 Decision Tree Analysis\n")
    print(f"Decision: {data['decision']}\n")
    
    best_option = None
    best_ev = float('-inf')
    
    for i, option in enumerate(data['options'], 1):
        ev = calculate_ev(option['outcomes'])
        
        print(f"Option {i}: {option['name']}")
        print(f"  └─ EV = {format_value(ev)}")
        
        for outcome in option['outcomes']:
            prob_pct = outcome['probability'] * 100
            value_str = format_value(outcome['value'])
            print(f"     ├─ {outcome['name']} ({prob_pct:.1f}%) → {value_str}")
        
        print()
        
        if ev > best_ev:
            best_ev = ev
            best_option = option['name']
    
    print(f"✅ Recommendation: {best_option} (EV: {format_value(best_ev)})")
    print()


def interactive_mode() -> None:
    """Interactive mode for building decision tree."""
    print("📊 Decision Tree Calculator - Interactive Mode\n")
    
    decision = input("What decision are you analyzing? ")
    options = []
    
    while True:
        print(f"\nOption {len(options) + 1}")
        name = input("  Option name (or 'done' to finish): ")
        
        if name.lower() == 'done':
            break
        
        outcomes = []
        remaining_prob = 1.0
        
        print(f"  Outcomes for '{name}':")
        
        while remaining_prob > 0.001:
            outcome_name = input(f"    Outcome name (remaining probability: {remaining_prob:.2%}): ")
            
            if remaining_prob < 1.0:
                use_remaining = input(f"    Use remaining {remaining_prob:.2%}? (y/n): ").lower()
                if use_remaining == 'y':
                    prob = remaining_prob
                else:
                    prob = float(input("    Probability (0-1): "))
            else:
                prob = float(input("    Probability (0-1): "))
            
            value = float(input("    Value ($): "))
            
            outcomes.append({
                "name": outcome_name,
                "probability": prob,
                "value": value
            })
            
            remaining_prob -= prob
        
        if not validate_probabilities(outcomes):
            print("  ⚠️  Warning: Probabilities don't sum to 1.0")
        
        options.append({
            "name": name,
            "outcomes": outcomes
        })
    
    data = {
        "decision": decision,
        "options": options
    }
    
    print_tree(data)
    
    # Offer to save
    save = input("Save to JSON file? (y/n): ").lower()
    if save == 'y':
        filename = input("Filename: ")
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ Saved to {filename}")


def main():
    parser = argparse.ArgumentParser(description='Decision Tree Calculator')
    parser.add_argument('--json', help='Path to JSON file with decision tree')
    parser.add_argument('--interactive', '-i', action='store_true', 
                        help='Interactive mode')
    
    args = parser.parse_args()
    
    if args.interactive:
        interactive_mode()
    elif args.json:
        try:
            with open(args.json, 'r') as f:
                data = json.load(f)
            
            # Validate structure
            if 'decision' not in data or 'options' not in data:
                print("Error: JSON must have 'decision' and 'options' fields")
                sys.exit(1)
            
            # Validate probabilities
            for option in data['options']:
                if not validate_probabilities(option['outcomes']):
                    print(f"Warning: Probabilities for '{option['name']}' don't sum to 1.0")
            
            print_tree(data)
            
        except FileNotFoundError:
            print(f"Error: File '{args.json}' not found")
            sys.exit(1)
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in '{args.json}'")
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
