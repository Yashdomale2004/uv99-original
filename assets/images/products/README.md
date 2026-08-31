# UV99 Products page media

Upload the finished files into this folder using the exact filenames below. The website
detects them automatically and swaps them in — no HTML edits are required.

**Every media slot on `films.html` already ships a finished-looking CSS/SVG illustration**
(marked "Illustrative" in the corner). Nothing on the page looks unfinished before the
photos arrive. When a real file with the matching name loads, its slot switches from the
illustration to the photo. Delivering the photos is an upgrade, not a prerequisite.

## Hero

| Filename | Recommended size | Content |
|---|---:|---|
| `products-hero-film-sheets.webp` | 1400 × 1000 px | Several transparent automotive film sheets suspended against black or soft grey, with light passing through at different shades. |

## Product cards

Keep these images at the same aspect ratio and use a consistent vehicle/lighting style.

| Filename | Recommended size | Content |
|---|---:|---|
| `uv99-70-windshield.webp` | 1200 × 900 px | Almost-clear windshield showing maximum clarity. |
| `uv99-50-side-window.webp` | 1200 × 900 px | Slightly darker side window showing balanced protection. |
| `uv-pro-70-cool-cabin.webp` | 1200 × 900 px | Bright summer exterior versus visibly cooler cabin. |
| `uv-pro-50-glare-control.webp` | 1200 × 900 px | Daylight driving scene demonstrating comfort and glare control. |
| `uv99-plus-one-premium.webp` | 1400 × 1000 px | Premium clear-film image for UV99 +1 with refined lighting. |

## Tint simulator

The simulator on `films.html` is now a self-contained CSS/SVG illustration: one drive
scene, a draggable clear-vs-film divider, and a tint wash whose shade changes with the
selected film. It needs **no photography** — the `simulator-*.webp` files are no longer
referenced. If you later want a photo-real simulator, reintroduce a before/after image
set and wire it into the `.tsim` block; otherwise nothing is required here.

## Demonstration media

Both proof panels also ship a CSS/SVG illustration and swap to real media on load.

| Filename | Recommended format | Content |
|---|---|---|
| `heat-lamp-comparison.mp4` | MP4, H.264, 1920 × 1080 | Short side-by-side comparison using the same heat source and visible temperature sensor. Keep under roughly 20 MB for web use. |
| `uv-meter-demonstration.webp` | WebP, 1600 × 1000 px | UV meter test with the product name, test conditions and reading visible in-frame. |

## Export guidance

- Use WebP for photographs at approximately 75–85% quality.
- Keep product-card images below 350 KB when possible.
- Keep simulator images below 500 KB each.
- Do not add text inside the photos unless it is part of a real measurement display.
- Preserve the filenames exactly, including lowercase letters and hyphens.
