from io import BytesIO
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "input" / "test-shirt.jpg"
OUTPUT_PATH = BASE_DIR / "output" / "test-shirt-cutout.png"

CANVAS_WIDTH = 1200
CANVAS_HEIGHT = 1600
SAFE_AREA = 0.86  # how much of canvas the clothing can occupy


def trim_transparent_edges(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()

    if bbox is None:
        raise ValueError("No visible subject detected after background removal.")

    return image.crop(bbox)


def normalize_on_canvas(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")

    max_width = int(CANVAS_WIDTH * SAFE_AREA)
    max_height = int(CANVAS_HEIGHT * SAFE_AREA)

    width, height = image.size
    scale = min(max_width / width, max_height / height)

    new_width = max(1, round(width * scale))
    new_height = max(1, round(height * scale))

    resized = image.resize((new_width, new_height), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_WIDTH, CANVAS_HEIGHT), (0, 0, 0, 0))

    x = (CANVAS_WIDTH - new_width) // 2
    y = (CANVAS_HEIGHT - new_height) // 2

    canvas.paste(resized, (x, y), resized)
    return canvas


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Input image not found: {INPUT_PATH}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    print("Loading FACION test image...")
    input_bytes = INPUT_PATH.read_bytes()

    print("Starting background removal...")
    session = new_session("isnet-general-use")
    output_bytes = remove(input_bytes, session=session)

    print("Opening removed-background image...")
    cutout = Image.open(BytesIO(output_bytes)).convert("RGBA")

    print("Trimming transparent empty space...")
    trimmed = trim_transparent_edges(cutout)

    print("Normalizing item on consistent transparent canvas...")
    normalized = normalize_on_canvas(trimmed)

    normalized.save(OUTPUT_PATH)
    print(f"Done! Saved cutout to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()