#!/bin/bash
set -e

mkdir -p public/icons

sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  inner_size=$((size * 60 / 100))
  offset=$(( (size - inner_size) / 2 ))
  
  convert -size "${size}x${size}" xc:"#08081a" \
          -fill "#06b6d4" -draw "rectangle ${offset},${offset} $((offset+inner_size)),$((offset+inner_size))" \
          "public/icons/icon-${size}x${size}.png"
  echo "Created public/icons/icon-${size}x${size}.png"
done

# Favicon
size=32
inner_size=$((size * 60 / 100))
offset=$(( (size - inner_size) / 2 ))
convert -size "${size}x${size}" xc:"#08081a" \
        -fill "#06b6d4" -draw "rectangle ${offset},${offset} $((offset+inner_size)),$((offset+inner_size))" \
        "public/favicon.png"
echo "Created public/favicon.png"

