
from io import BytesIO
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

BASE_DIR = Path(__file__).resolve().parent

# Folder containing your extracted clothing images
SOURCE_DIR = Path(r"C:\Users\suhac\Downloads\FACION- clothes")

# Folder where processed images will be saved
OUTPUT_DIR = BASE_DIR / "processed"

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

CANVAS_WIDTH = 1200
CANVAS_HEIGHT = 1600
SAFE_AREA = 0.86


def trim_transparent_edges(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()

    if bbox is None:
        raise ValueError("No visible clothing detected.")

    return image.crop(bbox)


def normalize_on_canvas(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")

    max_width = int(CANVAS_WIDTH * SAFE_AREA)
    max_height = int(CANVAS_HEIGHT * SAFE_AREA)

    width, height = image.size

    scale = min(
        max_width / width,
        max_height / height,
    )

    new_width = max(1, round(width * scale))
    new_height = max(1, round(height * scale))

    resized = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new(
        "RGBA",
        (CANVAS_WIDTH, CANVAS_HEIGHT),
        (0, 0, 0, 0),
    )

    x = (CANVAS_WIDTH - new_width) // 2
    y = (CANVAS_HEIGHT - new_height) // 2

    canvas.alpha_composite(resized, (x, y))

    return canvas


def process_one_image(
    input_path: Path,
    output_path: Path,
    session,
) -> None:
    input_bytes = input_path.read_bytes()

    output_bytes = remove(
        input_bytes,
        session=session,
    )

    cutout = Image.open(BytesIO(output_bytes)).convert("RGBA")

    trimmed = trim_transparent_edges(cutout)
    normalized = normalize_on_canvas(trimmed)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    normalized.save(output_path, format="PNG")


def main():
    if not SOURCE_DIR.is_dir():
        print(f"Source folder not found: {SOURCE_DIR}")
        print("Check SOURCE_DIR in process_batch.py.")
        return

    image_paths = sorted(
        path
        for path in SOURCE_DIR.rglob("*")
        if path.is_file()
        and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    if not image_paths:
        print("No clothing images found.")
        return

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("FACION AI Background Removal")
    print(f"Images found: {len(image_paths)}")
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}")

    print("Loading AI model...")
    session = new_session("isnet-general-use")

    successful = 0
    skipped = 0
    failed = 0
    failures = []

    for index, input_path in enumerate(image_paths, start=1):
        relative_path = input_path.relative_to(SOURCE_DIR)

        output_path = (
            OUTPUT_DIR / relative_path
        ).with_suffix(".png")

        if output_path.exists():
            skipped += 1
            print(
                f"[{index}/{len(image_paths)}] "
                f"Skipped: {relative_path}"
            )
            continue

        print(
            f"[{index}/{len(image_paths)}] "
            f"Processing: {relative_path}"
        )

        try:
            process_one_image(
                input_path,
                output_path,
                session,
            )

            successful += 1
            print("  Success")

        except Exception as error:
            failed += 1

            failures.append(
                (str(relative_path), str(error))
            )

            print(f"  Failed: {error}")

    print("\nFACION PROCESSING COMPLETE")
    print(f"Successful: {successful}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")

    if failures:
        report_path = OUTPUT_DIR / "failed_files.txt"

        with report_path.open(
            "w",
            encoding="utf-8",
        ) as report:
            for filename, reason in failures:
                report.write(
                    f"{filename}\n"
                    f"Reason: {reason}\n\n"
                )

        print(f"Failure report: {report_path}")


if __name__ == "__main__":
    main()
