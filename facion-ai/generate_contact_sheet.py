"""
FACION — Visual Contact Sheet Generator
Generates an interactive HTML contact sheet comparing cutouts before and after
normalization, highlighting flagged anomalies and metrics for manual review.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
REPORT_PATH = BASE_DIR / "normalization_report.json"
CONTACT_SHEET_HTML = BASE_DIR / "contact_sheet.html"


def generate_html_contact_sheet() -> None:
    if not REPORT_PATH.exists():
        raise FileNotFoundError(f"Report not found at {REPORT_PATH}. Run normalize_cutouts.py first.")

    with REPORT_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    results = data.get("results", [])
    categories = sorted(list(set(r.get("category", "unknown") for r in results)))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FACION — Cutout Normalization Contact Sheet</title>
  <style>
    :root {{
      --bg: #121013;
      --card-bg: #1b171c;
      --card-border: #2d2630;
      --text: #eae4eb;
      --text-muted: #9f95a2;
      --accent: #d88ab2;
      --badge-flag: #ff4757;
      --badge-ok: #2ed573;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
    }}
    header {{
      max-width: 1400px;
      margin: 0 auto 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
    }}
    h1 {{ font-size: 26px; font-weight: 600; margin-bottom: 8px; color: #fff; }}
    .subtitle {{ color: var(--text-muted); font-size: 14px; margin-bottom: 16px; }}
    .stats-bar {{
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }}
    .stat-pill {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
    }}
    .stat-pill strong {{ color: var(--accent); }}
    .controls {{
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 16px;
    }}
    select, button, input {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }}
    select:focus, input:focus {{ outline: 2px solid var(--accent); }}
    .grid {{
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }}
    .item-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }}
    .item-card.is-flagged {{
      border-color: rgba(255, 71, 87, 0.5);
    }}
    .item-card:hover {{
      transform: translateY(-2px);
      border-color: var(--accent);
    }}
    .card-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }}
    .card-title {{
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      word-break: break-all;
    }}
    .category-badge {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(216, 138, 178, 0.15);
      color: var(--accent);
      white-space: nowrap;
    }}
    .images-row {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }}
    .img-box {{
      background: #231f26;
      /* Checkerboard pattern for transparency */
      background-image:
        linear-gradient(45deg, #2b262f 25%, transparent 25%),
        linear-gradient(-45deg, #2b262f 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #2b262f 75%),
        linear-gradient(-45deg, transparent 75%, #2b262f 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      border-radius: 8px;
      aspect-ratio: 3 / 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      border: 1px solid #332b38;
    }}
    .img-box img {{
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }}
    .img-label {{
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(0, 0, 0, 0.7);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .metrics-table {{
      font-size: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 10px;
      color: var(--text-muted);
      border-top: 1px solid var(--card-border);
      padding-top: 10px;
    }}
    .metrics-table span strong {{ color: var(--text); }}
    .flags-container {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }}
    .flag-badge {{
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(255, 71, 87, 0.2);
      color: #ff6b81;
      border: 1px solid rgba(255, 71, 87, 0.4);
    }}
    .ok-badge {{
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(46, 213, 115, 0.15);
      color: #2ed573;
    }}
  </style>
</head>
<body>
  <header>
    <h1>FACION — Product Cutout Normalization Contact Sheet</h1>
    <p class="subtitle">Side-by-side comparison: Processed (original cutout) vs Normalized (1200x1600 standardized 85% occupancy).</p>

    <div class="stats-bar">
      <div class="stat-pill">Total Cutouts: <strong>{data.get("total_files", 0)}</strong></div>
      <div class="stat-pill">Successfully Normalized: <strong>{data.get("successful", 0)}</strong></div>
      <div class="stat-pill">Flagged for Review: <strong style="color: #ff6b81;">{data.get("flagged_for_review", 0)}</strong></div>
      <div class="stat-pill">Canvas Standard: <strong>1200 &times; 1600 (3:4)</strong></div>
      <div class="stat-pill">Target Occupancy: <strong>85%</strong></div>
    </div>

    <div class="controls">
      <label>Category:
        <select id="catFilter" onchange="filterItems()">
          <option value="all">All Categories ({len(results)})</option>
          {"".join(f'<option value="{c}">{c}</option>' for c in categories)}
        </select>
      </label>

      <label>Status:
        <select id="flagFilter" onchange="filterItems()">
          <option value="all">All Items</option>
          <option value="flagged">Flagged / Review Required Only</option>
          <option value="clean">Clean Only</option>
        </select>
      </label>

      <input type="text" id="searchInput" placeholder="Search filename..." oninput="filterItems()" style="width: 220px;" />

      <span id="counter" style="color: var(--text-muted); font-size: 13px; margin-left: auto;"></span>
    </div>
  </header>

  <main class="grid" id="grid">
"""

    for r in results:
        rel_path = r.get("relative_path", "")
        cat = r.get("category", "")
        file_name = r.get("file", "")
        flags = r.get("flags", [])
        is_flagged = r.get("review_required", False)
        scale = r.get("scale_applied", 1.0)
        occ_w = int(r.get("width_occupancy", 0) * 100)
        occ_h = int(r.get("height_occupancy", 0) * 100)
        garment_size = r.get("garment_size", [0, 0])
        norm_size = r.get("normalized_size", [0, 0])

        flag_badges_html = "".join(f'<span class="flag-badge">⚠ {f.replace("_", " ")}</span>' for f in flags)
        if not flags:
            flag_badges_html = '<span class="ok-badge">✓ Optimal bounds</span>'

        # Paths relative to contact_sheet.html
        orig_img_src = f"processed/{rel_path}"
        norm_img_src = f"normalized/{rel_path}"

        html += f"""
    <div class="item-card {'is-flagged' if is_flagged else ''}"
         data-cat="{cat}"
         data-flagged="{'true' if is_flagged else 'false'}"
         data-file="{file_name.lower()}">
      <div class="card-header">
        <span class="card-title" title="{file_name}">{file_name[:36]}</span>
        <span class="category-badge">{cat}</span>
      </div>

      <div class="images-row">
        <div class="img-box" title="Before: Processed cutout">
          <span class="img-label">Before</span>
          <img src="{orig_img_src}" alt="Before" loading="lazy" />
        </div>
        <div class="img-box" title="After: Normalized (Centered & Scaled)">
          <span class="img-label">Normalized</span>
          <img src="{norm_img_src}" alt="Normalized" loading="lazy" />
        </div>
      </div>

      <div class="metrics-table">
        <span>Raw: <strong>{garment_size[0]}&times;{garment_size[1]}</strong></span>
        <span>Norm: <strong>{norm_size[0]}&times;{norm_size[1]}</strong></span>
        <span>Scale: <strong>{scale}&times;</strong></span>
        <span>Occ: <strong>W:{occ_w}% H:{occ_h}%</strong></span>
      </div>

      <div class="flags-container">
        {flag_badges_html}
      </div>
    </div>
"""

    html += """
  </main>

  <script>
    function filterItems() {
      const cat = document.getElementById('catFilter').value;
      const flag = document.getElementById('flagFilter').value;
      const query = document.getElementById('searchInput').value.trim().toLowerCase();
      const cards = document.querySelectorAll('.item-card');

      let visible = 0;
      cards.forEach(card => {
        const matchesCat = (cat === 'all' || card.dataset.cat === cat);
        const matchesFlag = (flag === 'all' ||
          (flag === 'flagged' && card.dataset.flagged === 'true') ||
          (flag === 'clean' && card.dataset.flagged === 'false'));
        const matchesQuery = (!query || card.dataset.file.includes(query));

        if (matchesCat && matchesFlag && matchesQuery) {
          card.style.display = 'flex';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      document.getElementById('counter').innerText = `Showing ${visible} of ${cards.length} items`;
    }
    filterItems();
  </script>
</body>
</html>
"""

    with CONTACT_SHEET_HTML.open("w", encoding="utf-8") as f:
        f.write(html)

    print(f"Contact sheet generated at: {CONTACT_SHEET_HTML}")


if __name__ == "__main__":
    generate_html_contact_sheet()
