#!/bin/bash
# Quick test script for Pocket TTS skill

echo "🧪 Testing Pocket TTS installation..."

# Check if package is installed
if ! python -c "import pocket_tts" 2>/dev/null; then
    echo "❌ pocket-tts not installed"
    echo "Run: pip install pocket-tts"
    exit 1
fi

echo "✅ pocket-tts package installed"

# Test basic import
python -c "
from pocket_tts import TTSModel
print('✅ TTSModel imported successfully')
"

echo ""
echo "📋 Skill files created:"
ls -la /home/clawdbot/clawd/skills/pocket-tts/

echo ""
echo "💡 Usage:"
echo "   pocket-tts \"Hello world\" --output test.wav"
echo "   python /home/clawdbot/clawd/skills/pocket-tts/cli.py \"Test\""
