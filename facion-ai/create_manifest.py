
import csv
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SOURCE_DIR = Path(
    r"C:\Users\suhac\Downloads\FACION- clothes"
)

PROCESSED_DIR = BASE_DIR / "processed"
MANIFEST_PATH = BASE_DIR / "cutout_manifest.csv"

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def generate_sku(path: Path) -> str:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return "FAC-IMG-" + digest[:24].upper()


def main():
    if not SOURCE_DIR.is_dir():
        raise FileNotFoundError(
            f"Original clothing folder not found: {SOURCE_DIR}"
        )

    rows = []
    missing = []
    seen = set()

    for original in sorted(SOURCE_DIR.rglob("*")):
        if not original.is_file():
            continue

        if original.suffix.lower() not in EXTENSIONS:
            continue

        relative = original.relative_to(SOURCE_DIR)
        cutout = (
            PROCESSED_DIR / relative
        ).with_suffix(".png")

        if not cutout.is_file():
            missing.append(str(relative))
            continue

        sku = generate_sku(original)

        if sku in seen:
            continue

        seen.add(sku)

        rows.append({
            "sku": sku,
            "original_path": str(original),
            "cutout_path": str(cutout),
        })

    with MANIFEST_PATH.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "sku",
                "original_path",
                "cutout_path",
            ],
        )

        writer.writeheader()
        writer.writerows(rows)

    print("FACION CUTOUT MANIFEST CREATED")
    print(f"Matched products: {len(rows)}")
    print(f"Missing cutouts: {len(missing)}")
    print(f"Manifest: {MANIFEST_PATH}")

    if missing:
        print("Some original images have no processed PNG.")
        for path in missing[:10]:
            print("Missing:", path)


if __name__ == "__main__":
    main()
