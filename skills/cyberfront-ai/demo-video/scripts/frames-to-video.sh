#!/bin/bash
#
# Convert captured frames to video
#
# Usage: ./frames-to-video.sh [input_dir] [output_name] [format]
#
# Arguments:
#   input_dir   - Directory containing frame_*.jpg files (default: ./demo-frames)
#   output_name - Output filename without extension (default: demo)
#   format      - mp4, gif, or webm (default: mp4)
#
# Examples:
#   ./frames-to-video.sh
#   ./frames-to-video.sh ./demo-frames my-demo mp4
#   ./frames-to-video.sh ./frames product-tour gif

set -e

INPUT_DIR="${1:-./demo-frames}"
OUTPUT_NAME="${2:-demo}"
FORMAT="${3:-mp4}"

# Validate input
if [ ! -d "$INPUT_DIR" ]; then
    echo "❌ Error: Input directory not found: $INPUT_DIR"
    exit 1
fi

FRAME_COUNT=$(ls -1 "$INPUT_DIR"/frame_*.jpg 2>/dev/null | wc -l)
if [ "$FRAME_COUNT" -eq 0 ]; then
    echo "❌ Error: No frame_*.jpg files found in $INPUT_DIR"
    exit 1
fi

echo "🎬 Converting $FRAME_COUNT frames to $FORMAT..."
echo "   Input:  $INPUT_DIR"
echo "   Output: ${OUTPUT_NAME}.${FORMAT}"
echo ""

case "$FORMAT" in
    mp4)
        # H.264 MP4 - Good quality, widely compatible
        ffmpeg -y -framerate 30 \
            -pattern_type glob -i "$INPUT_DIR/frame_*.jpg" \
            -c:v libx264 \
            -preset medium \
            -crf 23 \
            -pix_fmt yuv420p \
            -movflags +faststart \
            "${OUTPUT_NAME}.mp4"
        echo "✅ Created ${OUTPUT_NAME}.mp4"
        ;;
        
    gif)
        # Animated GIF - Good for embedding, larger files
        # Two-pass for better quality: generate palette, then encode
        ffmpeg -y -framerate 15 \
            -pattern_type glob -i "$INPUT_DIR/frame_*.jpg" \
            -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
            "${OUTPUT_NAME}.gif"
        echo "✅ Created ${OUTPUT_NAME}.gif"
        ;;
        
    webm)
        # VP9 WebM - Smaller files, good quality
        ffmpeg -y -framerate 30 \
            -pattern_type glob -i "$INPUT_DIR/frame_*.jpg" \
            -c:v libvpx-vp9 \
            -crf 30 \
            -b:v 0 \
            -pix_fmt yuv420p \
            "${OUTPUT_NAME}.webm"
        echo "✅ Created ${OUTPUT_NAME}.webm"
        ;;
        
    *)
        echo "❌ Error: Unknown format '$FORMAT'. Use: mp4, gif, or webm"
        exit 1
        ;;
esac

# Show file info
echo ""
ls -lh "${OUTPUT_NAME}.${FORMAT}"
