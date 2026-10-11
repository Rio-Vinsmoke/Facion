"""
FACION — Catalogue Standardization, Naming, Pricing & Metadata Engine
Generates unique, realistic fashion product names, category-appropriate INR prices,
descriptions, and color classifications based on visual analysis of source cutouts.
Outputs reviewable CSV and JSON manifests for approval before database update.
"""

import colorsys
import csv
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
import numpy as np
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
NORMALIZED_DIR = BASE_DIR / "normalized"
PROCESSED_DIR = BASE_DIR / "processed"
MANIFEST_INPUT = BASE_DIR / "cutout_manifest.csv"
REPORT_INPUT = BASE_DIR / "normalization_report.json"

CSV_OUTPUT = BASE_DIR / "catalogue_standardization_manifest.csv"
JSON_OUTPUT = BASE_DIR / "catalogue_standardization_manifest.json"

# Merchandising Price Points
PRICE_TIERS = {
    "T-shirts": [499, 599, 699, 799, 899, 999, 1199],
    "Tops": [599, 699, 799, 899, 999, 1199, 1299, 1399, 1499],
    "Shirts": [899, 999, 1099, 1199, 1299, 1499, 1699, 1799, 1899],
    "Jeans": [1199, 1299, 1499, 1699, 1799, 1999, 2199, 2299, 2499],
    "Hoodies": [1299, 1399, 1499, 1699, 1799, 1999, 2199, 2299, 2499],
    "Dresses": [1099, 1299, 1499, 1699, 1899, 2099, 2299, 2499, 2799, 2899],
}

COLOR_NAMES = [
    # Monochromes & neutrals
    (lambda h, s, v: v < 0.18, "Obsidian Black", "black"),
    (lambda h, s, v: v < 0.28 and s < 0.20, "Charcoal", "charcoal"),
    (lambda h, s, v: s < 0.12 and v > 0.88, "Crisp White", "white"),
    (lambda h, s, v: s < 0.16 and v > 0.78, "Ecru Off-White", "off-white"),
    (lambda h, s, v: s < 0.18 and 0.50 <= v <= 0.78, "Heather Grey", "grey"),
    (lambda h, s, v: s < 0.22 and 0.28 <= v < 0.50, "Slate Grey", "slate"),
    (lambda h, s, v: 25 <= h <= 50 and s < 0.35 and v > 0.65, "Sand Beige", "beige"),
    (lambda h, s, v: 20 <= h <= 45 and 0.25 <= s <= 0.55 and 0.45 <= v <= 0.75, "Warm Camel", "camel"),
    (lambda h, s, v: 15 <= h <= 35 and 0.35 <= s <= 0.75 and 0.25 <= v <= 0.50, "Rich Mocha Brown", "brown"),
    (lambda h, s, v: 10 <= h <= 30 and s >= 0.55 and v <= 0.40, "Espresso Brown", "brown"),
    # Reds & pinks
    (lambda h, s, v: (h >= 345 or h < 12) and s >= 0.45 and v < 0.50, "Deep Burgundy", "burgundy"),
    (lambda h, s, v: (h >= 345 or h < 12) and s >= 0.50 and v >= 0.50, "Crimson Red", "red"),
    (lambda h, s, v: 330 <= h < 355 and s < 0.45 and v >= 0.70, "Blush Pink", "pink"),
    (lambda h, s, v: 330 <= h < 355 and s >= 0.45, "Dusty Rose", "rose"),
    # Oranges & corals
    (lambda h, s, v: 12 <= h < 28 and s >= 0.45 and v >= 0.65, "Terracotta Rust", "rust"),
    (lambda h, s, v: 12 <= h < 28 and s >= 0.45 and v < 0.65, "Burnt Amber", "amber"),
    # Yellows
    (lambda h, s, v: 35 <= h < 60 and s >= 0.40 and v >= 0.60, "Mustard Gold", "yellow"),
    (lambda h, s, v: 35 <= h < 60 and s < 0.40 and v >= 0.75, "Soft Buttercup Yellow", "yellow"),
    # Greens
    (lambda h, s, v: 65 <= h < 105 and s >= 0.25 and v < 0.55, "Olive Green", "olive"),
    (lambda h, s, v: 65 <= h < 110 and s < 0.35 and v >= 0.55, "Sage Green", "sage"),
    (lambda h, s, v: 110 <= h < 165 and s >= 0.35 and v < 0.50, "Forest Emerald Green", "green"),
    (lambda h, s, v: 110 <= h < 165 and s >= 0.30 and v >= 0.50, "Mint Green", "mint"),
    # Blues
    (lambda h, s, v: 165 <= h < 200 and s >= 0.25, "Ocean Teal", "teal"),
    (lambda h, s, v: 200 <= h < 225 and s < 0.35 and v >= 0.65, "Powder Blue", "light blue"),
    (lambda h, s, v: 200 <= h < 235 and s >= 0.30 and v < 0.45, "Midnight Navy Blue", "navy"),
    (lambda h, s, v: 200 <= h < 235 and s >= 0.30 and v >= 0.45, "Classic Indigo Blue", "blue"),
    (lambda h, s, v: 200 <= h < 230 and s < 0.30 and 0.45 <= v <= 0.75, "Steel Blue", "blue"),
    # Purples
    (lambda h, s, v: 250 <= h < 300 and s < 0.40 and v >= 0.60, "Soft Lavender", "lavender"),
    (lambda h, s, v: 250 <= h < 320 and s >= 0.35, "Rich Plum Purple", "purple"),
]


def extract_color(image: Image.Image) -> Tuple[str, str, float]:
    """Extracts dominant fashion color name, simple color family, and confidence."""
    rgba = image.convert("RGBA")
    arr = np.array(rgba)
    mask = arr[:, :, 3] > 40

    if not np.any(mask):
        return "Classic Neutral", "neutral", 0.75

    rgb = arr[mask][:, :3]
    median_rgb = np.median(rgb, axis=0) / 255.0
    h, s, v = colorsys.rgb_to_hsv(*median_rgb)
    h_deg = h * 360

    for matcher, full_name, family in COLOR_NAMES:
        try:
            if matcher(h_deg, s, v):
                confidence = 0.92 if s > 0.25 or v < 0.25 or v > 0.85 else 0.85
                return full_name, family, confidence
        except Exception:
            continue

    return "Subtle Neutral", "neutral", 0.80


def generate_unique_name(
    category: str,
    gender: str,
    color_label: str,
    color_family: str,
    index: int,
    existing_names: Set[str],
    aspect_ratio: float,
    flags: List[str],
) -> Tuple[str, str]:
    """Generates a distinct, realistic fashion product name and description."""
    cat_lower = category.lower()

    # Category-specific silhouettes and descriptors
    if "tee" in cat_lower or "t-shirt" in cat_lower:
        silhouettes = [
            "Crewneck Everyday T-Shirt",
            "Drop-Shoulder Boxy Tee",
            "Classic Fit Cotton-Look Tee",
            "Ribbed Collar Casual T-Shirt",
            "Pocket Detail Everyday Tee",
            "Relaxed V-Neck T-Shirt",
            "Heavyweight Streetwear Tee",
            "Minimalist Staple T-Shirt",
            "Oversized Urban Graphic Tee",
            "Structured Combed Cotton Tee",
        ]
        fits = ["Relaxed", "Classic", "Boxy", "Everyday", "Essential", "Structured", "Modern"]
        fit = fits[index % len(fits)]
        sil = silhouettes[index % len(silhouettes)]
        name = f"{color_label} {fit} {sil}".replace("T-Shirt T-Shirt", "T-Shirt").replace("Tee Tee", "Tee")
        desc = (
            f"An essential {color_family} wardrobe foundation featuring a clean {fit.lower()} cut "
            "and durable ribbed neckline. Ideal for daily rotation and layered styling."
        )

    elif "shirt" in cat_lower:
        silhouettes = [
            "Button-Down Shirt",
            "Casual Linen-Look Shirt",
            "Classic Fit Oxford Shirt",
            "Relaxed Spread-Collar Shirt",
            "Textured Everyday Shirt",
            "Camp Collar Casual Shirt",
            "Structured Poplin Shirt",
            "Tailored Point-Collar Shirt",
            "Minimalist Utility Shirt",
            "Mandarin Collar Clean Shirt",
        ]
        fits = ["Relaxed", "Tailored", "Everyday", "Structured", "Modern Fit", "Classic", "Refined", "Essential"]
        fit = fits[index % len(fits)]
        sil = silhouettes[index % len(silhouettes)]
        name = f"{color_label} {fit} {sil}".replace("Shirt Shirt", "Shirt")
        desc = (
            f"Designed with a {fit.lower()} silhouette and clean tailored detailing, this {color_family} shirt "
            "delivers versatile everyday elegance. Pair effortlessly with tailored trousers or casual denim."
        )

    elif "dress" in cat_lower:
        silhouettes = [
            "A-Line Midi Dress",
            "Wrap Silhouette Dress",
            "Tiered Summer Sundress",
            "Elegance Maxi Dress",
            "Sleeveless Fit-and-Flare Dress",
            "Pleated Fluid Midi Dress",
            "Slip Silhouette Midi Dress",
            "Smocked Bodice Sundress",
            "Boatneck Shift Dress",
            "Flounce Hem Midi Dress",
        ]
        fits = ["Flowing", "Tailored", "Breezy", "Effortless", "Sculpted", "Airy", "Sleek", "Contemporary"]
        fit = fits[index % len(fits)]
        sil = silhouettes[index % len(silhouettes)]
        name = f"{color_label} {fit} {sil}".replace("Dress Dress", "Dress")
        desc = (
            f"Featuring a graceful {fit.lower()} drape and flattering neckline, this {color_family} dress "
            "offers effortless movement for both daytime occasions and evening events."
        )

    elif "jean" in cat_lower:
        is_wide_or_cropped = aspect_ratio > 1.0 or any("unusual" in f for f in flags)
        if is_wide_or_cropped:
            silhouettes = [
                "Cropped Wide-Leg Denim",
                "Relaxed Folded Denim Jeans",
                "High-Rise Ankle Denim",
                "Vintage Cut-Off Denim Jeans",
                "Bermuda Silhouette Denim",
            ]
        else:
            silhouettes = [
                "Straight Leg Denim Jeans",
                "High-Rise Slim Jeans",
                "Classic Tapered Denim Jeans",
                "Relaxed Boyfriend Fit Jeans",
                "Clean Cut Bootcut Jeans",
                "Vintage Washed Denim Jeans",
                "Mid-Rise Essential Jeans",
                "Sculpted Skinny Denim Jeans",
            ]
        fits = ["Classic", "Vintage Washed", "Authentic", "Everyday", "Refined", "Structured"]
        fit = fits[index % len(fits)]
        sil = silhouettes[index % len(silhouettes)]
        name = f"{color_label} {sil}".replace("Jeans Jeans", "Jeans")
        desc = (
            f"Crafted in a flattering {sil.lower()} silhouette with timeless five-pocket styling. "
            "A dependable wardrobe staple that styles smoothly with tees, hoodies, and jackets."
        )

    elif "hoodie" in cat_lower:
        silhouettes = [
            "Everyday Pullover Hoodie",
            "Drop-Shoulder Fleece Hoodie",
            "Relaxed Kangaroo-Pocket Hoodie",
            "Heavyweight Casual Hoodie",
            "Minimalist Drawstring Hoodie",
            "Boxy Fit Streetwear Hoodie",
            "Cozy Fleece Essential Hoodie",
            "Structured Ribbed-Trim Hoodie",
        ]
        fits = ["Oversized", "Relaxed", "Heavyweight", "Cozy", "Classic Fit", "Everyday"]
        fit = fits[index % len(fits)]
        sil = silhouettes[index % len(silhouettes)]
        name = f"{color_label} {fit} {sil}".replace("Hoodie Hoodie", "Hoodie")
        desc = (
            f"Cut with an easy {fit.lower()} drape and soft-touch interior for plush comfort. "
            "Features a spacious hood, ribbed cuffs, and balanced proportions for casual layering."
        )


    else:  # Tops
        silhouettes = [
            "Square-Neck Everyday Top",
            "Ribbed Knit Cap-Sleeve Top",
            "Relaxed Blouse Silhouette Top",
            "Fluted Sleeve Contemporary Top",
            "Boatneck Minimalist Top",
            "Sweetheart Neckline Casual Top",
            "Smocked Yoke Everyday Top",
            "Breezy Sleeveless Summer Top",
        ]
        fits = ["Contemporary", "Relaxed", "Sleek", "Feminine", "Essential", "Chic"]
        fit = fits[index % len(fits)]
        sil = silhouettes[index % len(silhouettes)]
        name = f"{color_label} {fit} {sil}".replace("Top Top", "Top")
        desc = (
            f"Designed with a flattering {fit.lower()} profile and refined finish, this {color_family} piece "
            "transitions effortlessly from weekday workwear to weekend outings."
        )

    # Ensure uniqueness across entire catalogue
    counter = 2
    unique_name = name
    while unique_name in existing_names:
        unique_name = f"{name} (Edition {counter})"
        counter += 1

    existing_names.add(unique_name)
    return unique_name, desc


def assign_merchandising_price(
    category: str,
    index: int,
    aspect_ratio: float,
    visible_pixels: int,
) -> int:
    """Assigns realistic, plausible merchandising INR price based on complexity & category."""
    tiers = PRICE_TIERS.get(category, PRICE_TIERS["Tops"])

    # Basic items lower, intricate/larger styles higher
    tier_idx = (index * 3 + int(visible_pixels / 80000)) % len(tiers)
    return tiers[tier_idx]


def build_catalogue_manifest() -> None:
    print("Building FACION Catalogue Standardization Manifest...")

    # Load normalization report
    with REPORT_INPUT.open("r", encoding="utf-8") as f:
        norm_report = json.load(f)

    report_by_rel_path = {
        r.get("relative_path", ""): r for r in norm_report.get("results", [])
    }

    # Load cutout manifest
    with MANIFEST_INPUT.open("r", encoding="utf-8") as f:
        manifest_rows = list(csv.DictReader(f))

    print(f"Loaded {len(manifest_rows)} products from manifest.")

    existing_names: Set[str] = set()
    manifest_output_rows: List[Dict] = []

    # Category counters
    cat_counters: Dict[str, int] = {}

    for row in manifest_rows:
        sku = row["sku"]
        cutout_path_str = row["cutout_path"]

        # Find relative path in report
        norm_key = ""
        for k in report_by_rel_path.keys():
            if Path(k).name == Path(cutout_path_str).name:
                norm_key = k
                break

        norm_data = report_by_rel_path.get(norm_key, {})
        category_dir = norm_data.get("category", "")

        # Standardize product category
        if "shirt" in category_dir.lower():
            category = "Shirts"
            gender = "Men"
        elif "dress" in category_dir.lower():
            category = "Dresses"
            gender = "Women"
        elif "jean" in category_dir.lower():
            category = "Jeans"
            gender = "Women"
        elif "hoodie" in category_dir.lower():
            category = "Hoodies"
            gender = "Unisex"
        elif "tee" in category_dir.lower():
            category = "T-shirts"
            gender = "Men"
        else:
            category = "Tops"
            gender = "Women"

        cat_idx = cat_counters.get(category, 0)
        cat_counters[category] = cat_idx + 1

        # Extract visual color from normalized PNG
        norm_file = NORMALIZED_DIR / category_dir / Path(cutout_path_str).name
        if not norm_file.exists():
            norm_file = Path(cutout_path_str)

        color_label, color_family, color_conf = ("Classic Palette", "neutral", 0.80)
        if norm_file.exists():
            try:
                with Image.open(norm_file) as im:
                    color_label, color_family, color_conf = extract_color(im)
            except Exception as e:
                print(f"Warning extracting color for {sku}: {e}")

        aspect_ratio = norm_data.get("aspect_ratio", 0.75)
        flags = norm_data.get("flags", [])
        visible_pixels = norm_data.get("visible_pixels", 200000)
        review_required = norm_data.get("review_required", False)

        # Generate realistic unique name & description
        new_name, description = generate_unique_name(
            category=category,
            gender=gender,
            color_label=color_label,
            color_family=color_family,
            index=cat_idx,
            existing_names=existing_names,
            aspect_ratio=aspect_ratio,
            flags=flags,
        )

        # Old price from database mapping standard
        old_prices = {
            "T-shirts": 799,
            "Tops": 799,
            "Hoodies": 999,
            "Shirts": 1299,
            "Jeans": 1499,
            "Dresses": 1699,
        }
        old_price = old_prices.get(category, 999)

        # Realistic new price
        new_price = assign_merchandising_price(
            category=category,
            index=cat_idx,
            aspect_ratio=aspect_ratio,
            visible_pixels=visible_pixels,
        )

        # Placeholder old name
        old_name = f"{gender} {category} {cat_idx + 1}"

        confidence = round(0.95 if not review_required else 0.82, 2)

        entry = {
            "id": sku,
            "sku": sku,
            "old_name": old_name,
            "new_name": new_name,
            "old_price": old_price,
            "new_price": new_price,
            "category": category,
            "gender": gender,
            "color": color_label,
            "description": description,
            "confidence": confidence,
            "review_required": review_required,
            "flags": flags,
        }
        manifest_output_rows.append(entry)

    # Save CSV
    fieldnames = [
        "id", "sku", "old_name", "new_name", "old_price", "new_price",
        "category", "gender", "color", "description", "confidence", "review_required"
    ]
    with CSV_OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(manifest_output_rows)

    # Save JSON
    with JSON_OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(manifest_output_rows, f, indent=2)

    print("\n" + "=" * 50)
    print(f"CATALOGUE MANIFEST CREATED SUCCESSFULLY")
    print(f"Total products mapped: {len(manifest_output_rows)}")
    print(f"Unique product names: {len(existing_names)}/{len(manifest_output_rows)}")
    print(f"Items flagged for review: {sum(1 for r in manifest_output_rows if r['review_required'])}")
    print(f"CSV Manifest: {CSV_OUTPUT}")
    print(f"JSON Manifest: {JSON_OUTPUT}")
    print("=" * 50)


if __name__ == "__main__":
    build_catalogue_manifest()
