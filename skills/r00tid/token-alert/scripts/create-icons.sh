#!/bin/bash
# Create placeholder PWA icons using ImageMagick (if available)

if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not installed - skipping icon generation"
    echo "📝 Install with: brew install imagemagick"
    exit 0
fi

# 192x192 icon
convert -size 192x192 xc:transparent \
    -fill "#667eea" -draw "circle 96,96 96,10" \
    -fill white -pointsize 80 -gravity center -annotate +0+0 "🚨" \
    icon-192.png

# 512x512 icon
convert -size 512x512 xc:transparent \
    -fill "#667eea" -draw "circle 256,256 256,20" \
    -fill white -pointsize 200 -gravity center -annotate +0+0 "🚨" \
    icon-512.png

echo "✅ Icons created"
