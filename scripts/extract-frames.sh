#!/bin/sh
# Rebuilds public/frames/* from the original videos. Reads originals only; never modifies them.
# Usage: sh scripts/extract-frames.sh [path-to-videos]
SRC="${1:-/mnt/user-data/uploads}"
OUT="$(dirname "$0")/../public/frames"
for pair in 1:intro 2:about 3:experience 4:projects 5:skills 6:contact; do
  i=${pair%%:*}; n=${pair##*:}; f="$SRC/scene_0${i}_${n}.mp4"
  mkdir -p "$OUT/desktop/$n" "$OUT/mobile/$n"
  ffmpeg -v error -y -i "$f" -an -vf "scale=1920:-2:flags=lanczos,unsharp=3:3:0.5:3:3:0.0" -c:v libwebp -quality 85 -compression_level 4 -start_number 0 "$OUT/desktop/$n/%04d.webp"
  ffmpeg -v error -y -i "$f" -an -vf "fps=15,scale=1080:-2:flags=lanczos" -c:v libwebp -quality 75 -compression_level 4 -start_number 0 "$OUT/mobile/$n/%04d.webp"
done
