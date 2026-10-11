"""
FACION — Garment Cutout Normalization Pipeline
Standardizes transparent clothing cutouts onto a 1200x1600 canvas with:
- True visible garment boundary detection (alpha noise filtering)
- Proportional category-aware scaling targeting ~85% canvas occupancy
- Mathematical horizontal and vertical centering
- Lanczos high-quality resampling
- Anomaly & suspicious cutout detection
- Non-destructive idempotent output to 'facion-ai/normalized'
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "processed"
OUTPUT_DIR = BASE_DIR / "normalized"
REPORT_PATH = BASE_DIR / "normalization_report.json"

CANVAS_WIDTH = 1200
CANVAS_HEIGHT = 1600
TARGET_OCCUPANCY = 0.85

# 85% safe boundaries
MAX_WIDTH = int(CANVAS_WIDTH * TARGET_OCCUPANCY)   # 1020 px
MAX_HEIGHT = int(CANVAS_HEIGHT * TARGET_OCCUPANCY) # 1360 px

# Alpha threshold to eliminate rembg boundary noise (alpha <= 15 is invisible noise)
ALPHA_NOISE_THRESHOLD = 15

# Categories with naturally tall vertical drape
TALL_CATEGORIES = {"dresses women", "jeans women", "dresses", "jeans", "trousers"}


def detect_garment_bounds(
    image: Image.Image,
    threshold: int = ALPHA_NOISE_THRESHOLD,
) -> Tuple[Optional[Tuple[int, int, int, int]], np.ndarray]:
    """
    Detects true garment bounding box by filtering out invisible alpha noise.
    Returns (bbox, cleaned_alpha_array).
    bbox is (min_x, min_y, max_x, max_y) inclusive-exclusive.
    """
    rgba = image.convert("RGBA")
    arr = np.array(rgba)
    alpha = arr[:, :, 3]

    # Filter out faint background noise
    clean_alpha = np.where(alpha > threshold, alpha, 0)
    mask = clean_alpha > 0

    if not np.any(mask):
        return None, clean_alpha

    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    bbox = (int(cmin), int(rmin), int(cmax + 1), int(rmax + 1))
    return bbox, clean_alpha


def calculate_category_scale(
    category_name: str,
    garment_width: int,
    garment_height: int,
) -> float:
    """
    Calculates proportional scale targeting ~85% canvas occupancy
    while respecting natural garment silhouette proportions.
    """
    cat_lower = category_name.lower()
    is_tall = any(t in cat_lower for t in TALL_CATEGORIES)

    scale_to_max_w = MAX_WIDTH / garment_width
    scale_to_max_h = MAX_HEIGHT / garment_height

    if is_tall:
        # Full-length dresses & jeans: target 85% canvas height,
        # capped so width does not exceed 85% canvas width
        scale = min(scale_to_max_h, scale_to_max_w)
    else:
        # Torso garments (Tees, Shirts, Hoodies, Tops):
        # Target 85% canvas width, capped so height does not exceed 85% canvas height
        scale = min(scale_to_max_w, scale_to_max_h)

    return scale


def normalize_garment(
    image: Image.Image,
    category_name: str,
) -> Tuple[Image.Image, Dict]:
    """
    Crops transparent padding, scales proportionally, and centers on 1200x1600 canvas.
    Returns (normalized_image, metrics_dict).
    """
    bbox, clean_alpha = detect_garment_bounds(image)

    if bbox is None:
        raise ValueError("No visible clothing detected after alpha noise filtering.")

    cmin, rmin, cmax, rmax = bbox
    garment_w = cmax - cmin
    garment_h = rmax - rmin

    # Zero out noise pixels in RGBA
    arr = np.array(image.convert("RGBA"))
    arr[:, :, 3] = clean_alpha

    # Crop to exact visible garment
    cropped_arr = arr[rmin:rmax, cmin:cmax]
    cropped = Image.fromarray(cropped_arr, mode="RGBA")

    # Calculate proportional category-aware scale
    scale = calculate_category_scale(category_name, garment_w, garment_h)
    new_w = max(1, round(garment_w * scale))
    new_h = max(1, round(garment_h * scale))

    # Resize using high quality Lanczos resampling
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Place on 1200x1600 transparent canvas centered horizontally & vertically
    canvas = Image.new("RGBA", (CANVAS_WIDTH, CANVAS_HEIGHT), (0, 0, 0, 0))
    x = (CANVAS_WIDTH - new_w) // 2
    y = (CANVAS_HEIGHT - new_h) // 2
    canvas.alpha_composite(resized, (x, y))

    # Anomaly / flag detection
    visible_pixels = int(np.count_nonzero(clean_alpha > 0))
    aspect_ratio = round(garment_w / garment_h, 3)
    flags: List[str] = []

    # Flag 1: Extremely small garment
    if visible_pixels < 40000:
        flags.append("tiny_alpha_region")

    # Flag 2: Unusual aspect ratio for category
    cat_lower = category_name.lower()
    if any(t in cat_lower for t in TALL_CATEGORIES) and aspect_ratio > 1.1:
        flags.append("unusual_wide_tall_garment")
    elif ("tees" in cat_lower or "tops" in cat_lower) and aspect_ratio < 0.55:
        flags.append("unusual_narrow_top")

    # Flag 3: Edge touching in original
    orig_w, orig_h = image.size
    raw_bbox = image.getchannel("A").getbbox()
    if raw_bbox:
        if raw_bbox[0] <= 1 or raw_bbox[1] <= 1 or raw_bbox[2] >= orig_w - 1 or raw_bbox[3] >= orig_h - 1:
            flags.append("touches_edge_in_source")

    # Flag 4: Low density / fragmented
    density = visible_pixels / (garment_w * garment_h)
    if density < 0.20:
        flags.append("low_alpha_density")

    metrics = {
        "original_canvas": list(image.size),
        "visible_bbox": [cmin, rmin, cmax, rmax],
        "garment_size": [garment_w, garment_h],
        "normalized_size": [new_w, new_h],
        "scale_applied": round(scale, 4),
        "canvas_position": [x, y],
        "width_occupancy": round(new_w / CANVAS_WIDTH, 3),
        "height_occupancy": round(new_h / CANVAS_HEIGHT, 3),
        "aspect_ratio": aspect_ratio,
        "visible_pixels": visible_pixels,
        "flags": flags,
        "review_required": len(flags) > 0,
    }

    return canvas, metrics


def process_all_cutouts() -> None:
    """
    Batch processes all transparent cutouts from INPUT_DIR into OUTPUT_DIR.
    Idempotent and non-destructive.
    """
    if not INPUT_DIR.exists():
        raise FileNotFoundError(f"Input processed directory not found: {INPUT_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    png_files = sorted(INPUT_DIR.rglob("*.png"))
    print(f"Found {len(png_files)} cutouts in {INPUT_DIR}")

    results = []
    success_count = 0
    flagged_count = 0
    failed_count = 0

    for idx, input_path in enumerate(png_files, start=1):
        relative = input_path.relative_to(INPUT_DIR)
        category = relative.parent.name
        output_path = OUTPUT_DIR / relative

        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with Image.open(input_path) as im:
                normalized, metrics = normalize_garment(im, category)
                normalized.save(output_path, format="PNG", optimize=True)

            metrics["file"] = relative.name
            metrics["relative_path"] = str(relative).replace("\\", "/")
            metrics["category"] = category
            metrics["status"] = "success"

            if metrics["review_required"]:
                flagged_count += 1

            success_count += 1
            results.append(metrics)

            if idx % 25 == 0 or idx == len(png_files):
                print(f"[{idx}/{len(png_files)}] Processed: {relative.name[:35]} (Flags: {len(metrics['flags'])})")

        except Exception as err:
            failed_count += 1
            print(f"[{idx}/{len(png_files)}] ERROR on {relative}: {err}")
            results.append({
                "file": relative.name,
                "relative_path": str(relative).replace("\\", "/"),
                "category": category,
                "status": "failed",
                "error": str(err),
                "review_required": True,
                "flags": ["processing_error"],
            })

    # Save detailed report
    summary = {
        "total_files": len(png_files),
        "successful": success_count,
        "flagged_for_review": flagged_count,
        "failed": failed_count,
        "target_canvas": [CANVAS_WIDTH, CANVAS_HEIGHT],
        "target_occupancy": TARGET_OCCUPANCY,
        "results": results,
    }

    with REPORT_PATH.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 50)
    print("NORMALIZATION COMPLETE")
    print(f"Total processed: {success_count}/{len(png_files)}")
    print(f"Flagged for manual review: {flagged_count}")
    print(f"Failed: {failed_count}")
    print(f"Output folder: {OUTPUT_DIR}")
    print(f"Report saved to: {REPORT_PATH}")
    print("=" * 50)


if __name__ == "__main__":
    process_all_cutouts()
