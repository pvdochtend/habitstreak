# PWA Icons

This directory should contain the following PWA icon files:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

### Option 1: Using an Online Tool

1. Create a source icon (at least 512x512px, square)
2. Use a PWA icon generator like:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
3. Download the generated icons and place them in this directory

### Option 2: Using ImageMagick (Command Line)

```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: Download from https://imagemagick.org/

# Generate all sizes from a source 512x512 image
convert source-icon.png -resize 72x72 icon-72x72.png
convert source-icon.png -resize 96x96 icon-96x96.png
convert source-icon.png -resize 128x128 icon-128x128.png
convert source-icon.png -resize 144x144 icon-144x144.png
convert source-icon.png -resize 152x152 icon-152x152.png
convert source-icon.png -resize 192x192 icon-192x192.png
convert source-icon.png -resize 384x384 icon-384x384.png
convert source-icon.png -resize 512x512 icon-512x512.png
```

## Design Guidelines

- Use a simple, recognizable design
- Ensure good contrast and visibility at small sizes
- Consider using the flame emoji (🔥) or a checkmark for HabitStreak
- Background color: #3b82f6 (primary blue)
- Icon color: white or contrasting color

## Temporary Placeholder

For development, you can use solid color placeholders or simple SVG-to-PNG conversions.
The app will function without icons, but they enhance the PWA experience.
