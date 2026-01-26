#!/usr/bin/env python3
"""Convert local SVG file to PNG - handles foreignObject with HTML content"""

import sys
import xml.etree.ElementTree as ET
import re
from PIL import Image, ImageDraw, ImageFont

def svg_file_to_png(svg_path, output_path, width=500, height=300):
    # Read SVG file
    with open(svg_path, 'r') as f:
        svg_content = f.read()
    
    # Extract quote from foreignObject div
    quote = ""
    character = ""
    
    # Match quote-text div content (handles multiline)
    quote_match = re.search(r'<div[^>]*class="quote-text"[^>]*>(.*?)</div>', svg_content, re.DOTALL)
    if quote_match:
        # Clean up HTML - remove extra whitespace
        quote_text = quote_match.group(1).strip()
        quote = re.sub(r'\s+', ' ', quote_text)
        quote = quote.strip()
    
    # Match character text
    char_match = re.search(r'<text[^>]*class="character-info"[^>]*>(.*?)</text>', svg_content, re.DOTALL)
    if char_match:
        char_text = char_match.group(1).strip()
        character = re.sub(r'\s+', ' ', char_text)
        character = character.strip()
        # Remove leading dash if present
        if character.startswith('-'):
            character = character[1:].strip()
    
    # Check for empty/invalid SVG
    if not quote or quote in ["Quote loading...", ""]:
        return {"error": "API returned empty image", "status": "empty"}
    
    # Create image with dark background
    img = Image.new('RGB', (width, height), color='#111827')
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([10, 10, width-10, height-10], outline='#0284c7', width=10)
    
    # Draw quote (simplified text rendering)
    try:
        font_size = 18
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Word wrap
    words = quote.split()
    lines = []
    current_line = ""
    for word in words:
        test_line = current_line + (" " if current_line else "") + word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] < width - 60:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    # Draw text centered
    y = height // 2 - (len(lines) * 20) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        draw.text((x, y), line, fill='white', font=font)
        y += 25
    
    # Draw character
    if character:
        try:
            char_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except:
            char_font = font
        bbox = draw.textbbox((0, 0), f"- {character}", font=char_font)
        char_width = bbox[2] - bbox[0]
        draw.text(((width - char_width) // 2, height - 50), f"- {character}", fill='#9ca3af', font=char_font)
    
    img.save(output_path, 'PNG')
    return output_path

def svg_file_to_png_with_status(svg_path, output_path, width=500, height=300):
    """Convert SVG to PNG, returns dict with status."""
    result = svg_file_to_png(svg_path, output_path, width, height)
    if isinstance(result, dict) and result.get("status") == "empty":
        return result
    return {"status": "success", "path": result}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: svg2png_file.py <svg-file> <output.png>")
        sys.exit(1)
    
    svg_file = sys.argv[1]
    output = sys.argv[2]
    svg_file_to_png(svg_file, output)
    print(f"Saved to {output}")
