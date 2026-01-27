#!/usr/bin/env python3
"""
Test script for send_status.py
"""

import sys
import subprocess
from pathlib import Path

def test_send_status():
    """Test the status sending functionality."""
    script_path = Path(__file__).parent / "send_status.py"
    
    # Test cases
    test_cases = [
        ("Test progress message", "progress", "test_step", None),
        ("Test success message", "success", "test_step", None),
        ("Test error message", "error", "test_step", None),
        ("Test warning message", "warning", "test_step", None),
        ("Long message test", "progress", "step1", "with details about the step"),
    ]
    
    print("Testing send_status.py...")
    print("=" * 50)
    
    for message, status_type, step_name, details in test_cases:
        print(f"\nTest: {message}")
        print(f"  Type: {status_type}, Step: {step_name}")
        
        # Build command
        cmd = [sys.executable, str(script_path), message, status_type, step_name]
        if details:
            cmd.append(details)
        
        try:
            # Run the command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print(f"  PASS: Success")
                output = result.stdout.strip()
                if output:
                    print(f"  Output: {output}")
            else:
                print(f"  FAIL: Failed with return code {result.returncode}")
                if result.stderr:
                    print(f"  Error: {result.stderr.strip()}")
        except subprocess.TimeoutExpired:
            print(f"  FAIL: Timed out")
        except Exception as e:
            print(f"  FAIL: Exception: {e}")
    
    print("\n" + "=" * 50)
    print("Testing complete")

if __name__ == "__main__":
    test_send_status()
