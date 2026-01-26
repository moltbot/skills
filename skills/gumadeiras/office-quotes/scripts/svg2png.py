#!/usr/bin/env python3
"""Convert Office Quotes API SVG to PNG"""

import sys
import urllib.request
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

def svg_to_png(svg_url, output_path, width=500, height=300):
    # Fetch SVG
    with urllib.request.urlopen(svg_url) as response:
        svg_content = response.read().decode('utf-8')
    
    # Parse SVG
    root = ET.fromstring(svg_content)
    
    # Create image with dark background
    img = Image.new('RGB', (width, height), color='#111827')
    draw = ImageDraw.Draw(img)
    
    # Try to get quote text (simplified - parses from SVG text elements)
    quote = "Loading..."
    character = ""
    
    # Extract text from SVG (simple approach)
    import re
    text_matches = re.findall(r'>([^<]+)<', svg_content)
    if len(text_matches) >= 2:
        quote = text_matches[0].strip()
        if len(text_matches) > 1:
            character = text_matches[1].strip()
    elif text_matches:
        quote = text_matches[0].strip()
    
    # Draw border
    draw.rectangle([10, 10, width-10, height-10], outline='#0284c7', width=10)
    
    # Draw quote (simplified text rendering)
    try:
        # Try to use a default font
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

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: svg2png.py <svg-url> <output.png>")
        sys.exit(1)
    
    svg_url = sys.argv[1]
    output = sys.argv[2]
    svg_to_png(svg_url, output)
    print(f"Saved to {output}")
