import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS_DIR = ROOT / "extensions"


def iter_extension_package_dirs():
    for path in EXTENSIONS_DIR.iterdir():
        if path.name.startswith("_") or not path.is_dir():
            continue
        if (path / "__init__.py").exists():
            yield path


def test_extension_packages_have_meta_files():
    package_dirs = list(iter_extension_package_dirs())
    assert package_dirs, "Expected at least one extension package"
    for package_dir in package_dirs:
        meta_path = package_dir / "meta.json"
        assert meta_path.exists(), f"Missing meta.json for extension: {package_dir.name}"


def test_extension_meta_matches_directory_and_required_fields():
    for meta_path in sorted(EXTENSIONS_DIR.glob("*/meta.json")):
        data = json.loads(meta_path.read_text())
        if not meta_path.parent.name.startswith("_"):
            assert data["key"] == meta_path.parent.name
        assert data["title"]
        assert data["subtitle"]
        assert data["displayName"]
        assert data["description"]
        assert isinstance(data["tags"], list)
        assert isinstance(data["setupFields"], list)
