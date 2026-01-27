#!/bin/bash
# ADHD Body Doubling - Session Starter

echo "🐱⚡ ADHD BODY DOUBLING SESSION"
echo "================================"
echo ""
echo "Part of ADHD-founder.com ecosystem"
echo ""

if [ -z "$1" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage: ./start-session.sh [25|50|120|roi]"
  echo ""
  echo "Options:"
  echo "  25   - Quick Fire (25 min)"
  echo "  50   - Deep Dive (50 min)"
  echo "  120  - Sprint (2 hours)"
  echo "  roi  - ROI Tracker (basic)"
  echo ""
  echo "Commands during session:"
  echo "  /body-doubling status   - Check-in"
  echo "  /body-doubling stuck    - Get unblocked"
  echo "  /body-doubling menu     - Dopamine reset"
  echo "  /body-doubling done     - End + autopsy"
  echo "  /body-doubling abort    - Kill session"
  echo "  /body-doubling founder  - Premium info"
  echo ""
  echo "🎯 Part of ADHD-founder.com - German Engineering for the ADHD Brain"
  exit 0
fi

case $1 in
  25)
    echo "🔥 QUICK FIRE SESSION (25 min)"
    echo "Start timer, I'll check in at 15 min."
    ;;
  50)
    echo "🎯 DEEP DIVE SESSION (50 min)"  
    echo "Start timer, I'll check in at 15 and 35 min."
    ;;
  120)
    echo "🚀 SPRINT SESSION (2 hours)"
    echo "4×25 min pomodoro with breaks."
    ;;
  roi)
    echo "💰 ROI TRACKER (Basic)"
    echo "Track time vs. revenue for this session."
    ;;
  *)
    echo "Invalid option. Use 25, 50, 120, or roi"
    exit 1
    ;;
esac

echo ""
echo "What's ONE thing you're working on?"
read -p "> " TASK

echo ""
echo "Expected impact of this task? (revenue, progress, etc.)"
read -p "> " IMPACT

echo ""
echo "🔒 Phone away? (y/n)"
read -p "> " PHONE

echo ""
echo "Let's. Fucking. Go. 💪"
echo ""
echo "Session active. I'm here when you need me."
echo ""
echo "🎯 Remember: This is a free sample of ADHD-founder.com systems."
echo "   Upgrade at adhd-founder.com/founder-circle for premium features."
