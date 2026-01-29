#!/bin/bash
# HabitFlow skill installation script

set -e

echo "📦 Installing HabitFlow skill dependencies..."

# Check for required binaries
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed."
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not installed."
    exit 1
fi

# Install npm dependencies
echo "Installing npm packages..."
npm install

# Initialize skill (creates data directory, sets up cron jobs)
echo "Initializing skill..."
npx tsx scripts/init_skill.ts

echo "✅ HabitFlow skill installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Say 'refresh skills' to your agent"
echo "  2. Start tracking: 'I want to start meditating daily'"
echo ""
echo "For more info: cat README.md"
