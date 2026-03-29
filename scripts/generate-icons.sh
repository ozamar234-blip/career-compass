#!/bin/bash
# Generate PWA icons from favicon.svg
# Requires: brew install librsvg (for rsvg-convert) OR use an online tool
# Alternative: npx svg2png-cli

echo "Generating PWA icons from favicon.svg..."

if command -v rsvg-convert &> /dev/null; then
  rsvg-convert -w 192 -h 192 public/favicon.svg > public/icon-192.png
  rsvg-convert -w 512 -h 512 public/favicon.svg > public/icon-512.png
  rsvg-convert -w 180 -h 180 public/favicon.svg > public/apple-touch-icon.png
  rsvg-convert -w 1200 -h 630 public/favicon.svg > public/og-image.png
  echo "Done! Icons generated."
else
  echo "rsvg-convert not found. Install with: brew install librsvg"
  echo "Or use an online SVG-to-PNG converter for:"
  echo "  - 192x192 → public/icon-192.png"
  echo "  - 512x512 → public/icon-512.png"
  echo "  - 180x180 → public/apple-touch-icon.png"
  echo "  - 1200x630 → public/og-image.png"
fi
