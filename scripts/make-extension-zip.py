"""Create a deterministic unpacked-extension release archive.

The archive contains only the built Manifest V3 package.  Fixed ZIP metadata
and sorted paths make repeated builds reproducible when the dist contents are
unchanged.
"""

from pathlib import Path
import json
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "extension" / "dist"


def main() -> int:
    if not DIST.is_dir():
        raise SystemExit("extension/dist is missing; run the extension build first")
    package = json.loads((ROOT / "extension" / "package.json").read_text(encoding="utf-8"))
    version = package["version"]
    output = ROOT / f"MARGIN-extension-v{version}.zip"
    if output.exists():
        output.unlink()

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(p for p in DIST.rglob("*") if p.is_file()):
            relative = path.relative_to(DIST).as_posix()
            info = zipfile.ZipInfo(relative, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())

    print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
